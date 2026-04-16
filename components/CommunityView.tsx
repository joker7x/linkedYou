import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ShieldCheck, AlertTriangle, Pill, Send, MoreHorizontal, Flag, ThumbsUp, MessageCircle, Search, User, Award, CheckCircle2, Filter, X, Trash2, Clock, Calendar } from 'lucide-react';
import { CommunityPost, CommunityUser, Drug, CommunityComment } from '../types.ts';
import { 
  getPosts, addPost, deletePost as deletePostSupabase, 
  deleteComment as deleteCommentSupabase, updateCommentReactions, 
  getLikesCount, getCommentsCount, getIsLiked, addLike, 
  removeLike, searchDrugsSupabase, reportUser, logActivity, 
  addComment, getComments, getUserProfile, getUserProfiles 
} from '../services/supabase.ts';
import { Avatar } from './Avatar.tsx';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CommunityViewProps {
  onBack: () => void;
  onUserClick: (userId: string) => void;
  userId: string;
  config?: any;
}

// Mock Data
const currentUser: CommunityUser = {
  id: 'u1',
  name: 'د. أحمد محمود',
  isVerified: true,
  level: 'gold',
  points: 1250,
  role: 'pharmacist'
};

const mockPosts: CommunityPost[] = [
  {
    id: 'p1',
    author: {
      id: 'u2',
      name: 'د. سارة خالد',
      isVerified: true,
      level: 'silver',
      points: 850,
      role: 'pharmacist'
    },
    content: 'لاحظت نقص شديد في حقن الكليكسان الأيام دي، هل في حد لقى بديل متوفر في شركات التوزيع؟',
    mentionedDrugs: [{ id: 'd1', name: 'Clexane 40mg' }],
    mentionedActiveIngredients: ['Enoxaparin'],
    likes: 24,
    commentsCount: 8,
    createdAt: 'منذ ساعتين'
  },
  {
    id: 'p2',
    author: {
      id: 'u3',
      name: 'د. محمد علي',
      isVerified: false,
      level: 'bronze',
      points: 120,
      role: 'pharmacist'
    },
    content: 'تحديث بخصوص الأسعار: تم تعديل سعر كونكور 5 ملجم اليوم. يرجى مراجعة السيستم.',
    mentionedDrugs: [{ id: 'd2', name: 'Concor 5mg' }],
    mentionedActiveIngredients: ['Bisoprolol'],
    likes: 45,
    commentsCount: 12,
    createdAt: 'منذ 5 ساعات'
  },
  {
    id: 'p3',
    author: {
      id: 'u4',
      name: 'د. ياسمين طارق',
      isVerified: true,
      level: 'gold',
      points: 2100,
      role: 'pharmacist'
    },
    content: 'يا جماعة، مريض بيسأل عن بديل لكليكسان 40 عشان مش لاقيه، هل ينفع ندي له حاجة تانية نفس المادة الفعالة؟',
    mentionedDrugs: [{ id: 'd1', name: 'Clexane 40mg' }],
    mentionedActiveIngredients: ['Enoxaparin'],
    likes: 15,
    commentsCount: 22,
    createdAt: 'منذ 6 ساعات'
  }
];

export const CommunityView: React.FC<CommunityViewProps> = ({ onBack, onUserClick, userId, config }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, CommunityComment[]>>({});
  const [isCommentingLoading, setIsCommentingLoading] = useState<Record<string, boolean>>({});

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const distance = formatDistanceToNow(date, { addSuffix: true, locale: ar });
      const fullDate = format(date, 'eeee, d MMMM yyyy', { locale: ar });
      const time = format(date, 'hh:mm a', { locale: ar });
      
      return { distance, fullDate, time };
    } catch (e) {
      return { distance: dateString, fullDate: '', time: '' };
    }
  };

  const handleLike = async (postId: string) => {
    if (userId === 'guest') {
      alert('يرجى تسجيل الدخول أولاً لتتمكن من الإعجاب بالمنشورات.');
      return;
    }

    const isLiked = likedPosts.has(postId);
    const success = isLiked 
      ? await removeLike(postId, userId)
      : await addLike(postId, userId);

    if (success) {
      if (isLiked) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
      } else {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
        logActivity(userId, 'like', 1, postId);
      }
    } else {
      console.error('Failed to update like for post:', postId);
      alert('عذراً، فشل تحديث الإعجاب. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleCommentToggle = async (postId: string) => {
    if (showComments === postId) {
      setShowComments(null);
    } else {
      setShowComments(postId);
      if (!postComments[postId]) {
        setIsCommentingLoading(prev => ({ ...prev, [postId]: true }));
        try {
          const comments = await getComments(postId);
          
          // Optimization: Get all unique user IDs from comments
          const userIds = comments.map(c => c.user_id);
          const profiles = await getUserProfiles(userIds);
          
          const commentsWithProfiles = comments.map((c) => {
            const profile = profiles[c.user_id];
            return {
              id: c.id,
              postId: c.post_id,
              parentId: c.parent_id,
              author: { 
                id: c.user_id, 
                name: profile?.name || 'مستخدم', 
                isVerified: profile?.isVerified || false, 
                level: profile?.level || 'bronze' as const, 
                points: profile?.points || 0, 
                role: profile?.role || 'pharmacist' as const,
                avatarId: profile?.avatarId || 'avatar_m_01'
              },
              content: c.content,
              reactions: c.reactions,
              createdAt: c.created_at
            };
          });
          setPostComments(prev => ({ 
            ...prev, 
            [postId]: commentsWithProfiles
          }));
        } catch (error) {
          console.error("Error loading comments:", error);
          alert('فشل تحميل التعليقات. يرجى المحاولة مرة أخرى.');
        } finally {
          setIsCommentingLoading(prev => ({ ...prev, [postId]: false }));
        }
      }
    }
  };

  const handleSendComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim() || isCommentingLoading[postId]) return;

    if (config?.strictMode && userId === 'guest') {
      alert('الوضع الصارم مفعل: يجب تسجيل الدخول للتعليق.');
      return;
    }

    const parentId = replyingToCommentId;
    console.log("Sending comment for post:", postId, "Parent:", parentId);
    setIsCommentingLoading(prev => ({ ...prev, [postId]: true }));
    
    try {
      // Optimistic Update: Add comment to UI immediately for better UX
      const tempId = 'temp-' + Date.now();
      const commentObj: CommunityComment = {
        id: tempId,
        postId: postId,
        parentId: parentId || undefined,
        author: { 
          id: userId, 
          name: 'أنت', 
          isVerified: true, 
          level: 'gold' as const, 
          points: 0, 
          role: 'pharmacist' as const
        },
        content: content,
        createdAt: new Date().toISOString()
      };
      
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), commentObj]
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setReplyingToCommentId(null);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));

      // Actual API Call
      const newComment = await addComment(postId, content, userId, parentId || undefined);
      
      if (newComment) {
        // Replace temp comment with real one from server
        setPostComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).map(c => c.id === tempId ? {
            ...c,
            id: newComment.id,
            createdAt: newComment.created_at
          } : c)
        }));
        logActivity(userId, 'comment', 2, postId);
        console.log("Comment successfully saved to database.");
      } else {
        // Rollback if failed
        setPostComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== tempId)
        }));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) } : p));
        setCommentInputs(prev => ({ ...prev, [postId]: content })); // Restore input
        alert('فشل حفظ التعليق في قاعدة البيانات. يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error("Unexpected error in handleSendComment:", error);
      alert('حدث خطأ غير متوقع. يرجى التأكد من اتصالك بالإنترنت.');
    } finally {
      setIsCommentingLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleReaction = async (comment: CommunityComment, emoji: string) => {
    const currentReactions = comment.reactions || {};
    const newReactions = { ...currentReactions };
    newReactions[emoji] = (newReactions[emoji] || 0) + 1;
    
    const success = await updateCommentReactions(comment.id, newReactions);
    if (success) {
      setPostComments(prev => ({
        ...prev,
        [comment.postId]: (prev[comment.postId] || []).map(c => 
          c.id === comment.id ? { ...c, reactions: newReactions } : c
        )
      }));
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    const success = await deleteCommentSupabase(commentId, userId);
    if (success) {
      setPostComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
      }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) } : p));
    } else {
      alert('فشل حذف التعليق.');
    }
  };

  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);

  // Close reaction menu on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      if (activeReactionMenu) setActiveReactionMenu(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [activeReactionMenu]);

  const renderComment = (comment: CommunityComment, allComments: CommunityComment[]) => {
    const replies = allComments.filter(c => c.parentId === comment.id);
    
    return (
      <div key={comment.id} className="relative mt-3">
        {/* Thread Line for Nested Comments */}
        {comment.parentId && (
          <div className="absolute -right-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700 mr-3" />
        )}
        
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 z-10 overflow-hidden">
            <Avatar name={comment.author.avatarId || 'avatar_m_01'} size={32} />
          </div>
          <div className="flex-1">
            <div className={`p-3 rounded-2xl ${comment.parentId ? 'bg-slate-50 dark:bg-slate-800/30' : 'bg-slate-50 dark:bg-slate-800/50'} border border-slate-100 dark:border-slate-800`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-slate-900 dark:text-white">{comment.author.name}</span>
                <span className="text-[8px] text-slate-400">{typeof formatTime(comment.createdAt) === 'object' ? (formatTime(comment.createdAt) as any).distance : formatTime(comment.createdAt)}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{comment.content}</p>
            </div>
            
            {/* Action Bar */}
            <div className="flex items-center gap-3 mt-1 px-1">
              <div className="relative">
                <button 
                  onClick={() => setActiveReactionMenu(activeReactionMenu === comment.id ? null : comment.id)}
                  className="text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  تفاعل
                </button>
                
                {/* Reaction Menu */}
                <AnimatePresence>
                  {activeReactionMenu === comment.id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: 15 }}
                      className="absolute right-[-10px] bottom-full mb-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-1.5 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-0.5 z-[100] min-w-max"
                      style={{ transformOrigin: 'bottom right' }}
                    >
                      {['❤️', '👍', '😂', '😮', '😢', '🙏'].map((emoji, i) => (
                        <motion.button 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          key={emoji} 
                          onClick={() => { handleReaction(comment, emoji); setActiveReactionMenu(null); }} 
                          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[20px] sm:text-[24px] hover:scale-125 hover:-translate-y-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-all duration-200 active:scale-90 origin-bottom"
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => {
                  setReplyingToCommentId(comment.id);
                  setCommentInputs(prev => ({ ...prev, [comment.postId]: `@${comment.author.name} ` }));
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
              >
                رد
              </button>

              {comment.author.id === userId && (
                <button 
                  onClick={() => handleDeleteComment(comment.id, comment.postId)}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  حذف
                </button>
              )}
              
              {/* Reactions Display */}
              <div className="flex gap-1">
                {Object.entries(comment.reactions || {}).map(([emoji, count]) => (
                  <span key={emoji} className="flex items-center gap-0.5 text-[9px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 px-1.5 py-0.5 rounded-full shadow-sm">
                    {emoji} <span className="font-bold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Nested Replies Rendering */}
        {replies.length > 0 && (
          <div className="mr-6 space-y-1">
            {replies.map(reply => renderComment(reply, allComments))}
          </div>
        )}
      </div>
    );
  };

  React.useEffect(() => {
    const loadPosts = async () => {
      const data = await getPosts(userId);
      const likedSet = new Set<string>();
      
      // Optimization: Get all unique author IDs to fetch profiles in one go
      const authorIds = data.map(p => p.user_id);
      const profiles = await getUserProfiles(authorIds);
      
      const postsWithCounts = await Promise.all(data.map(async (p) => {
        const likes = await getLikesCount(p.id);
        const commentsCount = await getCommentsCount(p.id);
        const isLiked = await getIsLiked(p.id, userId);
        const profile = profiles[p.user_id];
        
        if (isLiked) {
          likedSet.add(p.id);
        }

        return {
          id: p.id,
          author: { 
            id: p.user_id, 
            name: profile?.name || 'مستخدم', 
            isVerified: profile?.isVerified || false, 
            level: profile?.level || 'bronze' as const, 
            points: profile?.points || 0, 
            role: profile?.role || 'pharmacist' as const,
            avatarId: profile?.avatarId || 'avatar_m_01'
          },
          content: p.content,
          mentionedDrugs: [],
          mentionedActiveIngredients: [],
          likes,
          commentsCount,
          createdAt: p.created_at
        };
      }));
      
      setLikedPosts(likedSet);
      setPosts(postsWithCounts);
      setLoading(false);
    };
    loadPosts();
  }, [userId]);

  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showReportModal, setShowReportModal] = useState<string | null>(null);

  const handleReport = async (reason: string) => {
    if (showReportModal) {
      const post = posts.find(p => p.id === showReportModal);
      if (post) {
        await reportUser(post.author.id, userId, reason);
        alert('تم إرسال البلاغ بنجاح');
      }
      setShowReportModal(null);
    }
  };
  const [activeFilter, setActiveFilter] = useState<{ type: 'drug' | 'api', id: string, name: string } | null>(null);
  const [mentionResults, setMentionResults] = useState<{id: string, name: string, type: 'drug' | 'api' | 'company' | 'location', subtext?: string}[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  const deletePost = async (postId: string) => {
    const success = await deletePostSupabase(postId, userId);
    if (success) {
      setPosts(posts.filter(p => p.id !== postId));
    } else {
      alert('فشل حذف المنشور. قد لا تملك الصلاحية لذلك.');
    }
  };

  const GOVERNORATES = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس', 'الشرقية', 'جنوب سيناء', 'شمال سيناء', 'بني سويف', 'بورسعيد', 'دمياط', 'سوهاج', 'قنا', 'كفر الشيخ', 'مطروح', 'الأقصر', 'أسوان', 'أسيوط'
  ];

  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    const position = e.target.selectionStart;
    setNewPostContent(content);
    setCursorPosition(position);

    const lastAt = content.lastIndexOf('@', position - 1);
    if (lastAt !== -1) {
      const query = content.slice(lastAt + 1, position).trim();
      if (query.length >= 2) {
        // Search Drugs
        const drugResults = await searchDrugsSupabase(query);
        const results: any[] = drugResults.map(d => ({
          id: d.id,
          name: d.name_en,
          subtext: d.name_ar,
          type: 'drug'
        }));

        // Search Governorates
        const govMatches = GOVERNORATES.filter(g => g.includes(query)).map(g => ({
          id: g,
          name: g,
          type: 'location'
        }));

        // Add some common companies if they match (or extract from drug results)
        const companies = Array.from(new Set(drugResults.map(d => d.company).filter(Boolean))).map(c => ({
          id: c as string,
          name: c as string,
          type: 'company'
        }));

        setMentionResults([...govMatches, ...results, ...companies].slice(0, 10));
        return;
      }
    }
    setMentionResults([]);
  };

  const insertMention = (item: {name: string, type: string}) => {
    const lastAt = newPostContent.lastIndexOf('@', cursorPosition - 1);
    const before = newPostContent.slice(0, lastAt);
    const after = newPostContent.slice(cursorPosition);
    
    // We'll use a prefix in the tag to identify the type during rendering, but keep it clean
    // Format: @Type:Name
    const mentionText = `@${item.type}:${item.name.replace(/\s+/g, '_')} `;
    setNewPostContent(before + mentionText + after);
    setMentionResults([]);
  };

  const cleanMentionName = (name: string) => {
    return name
      .replace(/powder for i\.v\. inf\. vial/gi, 'Vial')
      .replace(/powder for solution for injection/gi, 'Inj')
      .replace(/film coated tablets/gi, 'Tab')
      .replace(/hard gelatin capsules/gi, 'Cap')
      .replace(/oral suspension/gi, 'Susp')
      .replace(/_/g, ' ')
      .trim();
  };

  const renderContent = (content: string) => {
    // Remove all mentions from the content for display in the post body
    return content.replace(/@[a-z]+:[^\s]+/g, '').trim();
  };

  const renderTags = (content: string) => {
    const tags: {type: string, name: string}[] = [];
    const matches = content.matchAll(/@([a-z]+):([^\s]+)/g);
    for (const match of matches) {
      tags.push({ type: match[1], name: match[2] });
    }

    if (tags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, i) => {
          const cleanedName = cleanMentionName(tag.name);
          let colorClass = "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50";
          let Icon = Pill;

          if (tag.type === 'location') {
            colorClass = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50";
            Icon = Search;
          } else if (tag.type === 'company') {
            colorClass = "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50";
            Icon = ShieldCheck;
          }

          return (
            <span 
              key={i} 
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-[11px] border shadow-sm ${colorClass}`}
            >
              <Icon size={10} className="shrink-0" />
              {cleanedName}
            </span>
          );
        })}
      </div>
    );
  };

  const filteredPosts = useMemo(() => {
    if (!activeFilter) return posts;
    return posts.filter(post => {
      if (activeFilter.type === 'drug') {
        return post.mentionedDrugs.some(d => d.id === activeFilter.id);
      }
      if (activeFilter.type === 'api') {
        return post.mentionedActiveIngredients.includes(activeFilter.name);
      }
      return true;
    });
  }, [posts, activeFilter]);

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'diamond': return 'from-cyan-400 to-blue-600';
      case 'gold': return 'from-yellow-400 to-amber-600';
      case 'silver': return 'from-slate-300 to-slate-500';
      case 'bronze': return 'from-orange-400 to-orange-600';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  const handlePost = async () => {
    console.log("handlePost triggered, content:", newPostContent);
    if (!newPostContent.trim() || isPosting) {
      console.log("handlePost aborted: content empty or isPosting is true");
      return;
    }
    
    if (config?.strictMode && userId === 'guest') {
      alert('الوضع الصارم مفعل: يجب تسجيل الدخول للمشاركة.');
      return;
    }
    
    setIsPosting(true);
    try {
      console.log("Attempting to add post with userId:", userId);
      const addedPost = await addPost({ content: newPostContent }, userId);
      console.log("addPost result:", addedPost);
      if (addedPost) {
        await logActivity(userId, 'post', 10, addedPost.id);
        const newPost: CommunityPost = {
          id: addedPost.id,
          author: { id: userId, name: 'مستخدم', isVerified: false, level: 'bronze', points: 0, role: 'pharmacist' },
          content: addedPost.content,
          mentionedDrugs: [],
          mentionedActiveIngredients: [],
          likes: 0,
          commentsCount: 0,
          createdAt: 'الآن'
        };
        setPosts([newPost, ...posts]);
        setNewPostContent('');
      } else {
        alert('حدث خطأ أثناء نشر المنشور. يرجى التأكد من اتصالك بالإنترنت.');
      }
    } catch (error) {
      console.error("Post creation error:", error);
      alert('حدث خطأ غير متوقع.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="pt-14 px-4 pb-32 min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 pt-4 px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[20px] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <MessageSquare size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">مجتمع فارما</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">نقاشات الصيادلة</p>
          </div>
        </div>
        
        {/* User Gamification Badge */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500">نقاطك</div>
            <div className="text-sm font-black text-blue-600 dark:text-blue-400 leading-none">{currentUser.points}</div>
          </div>
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getLevelColor(currentUser.level)} p-[2px]`}>
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
              <Award size={14} className="text-slate-800 dark:text-slate-200" />
            </div>
          </div>
        </div>
      </header>

      {/* Create Post */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-4 mb-6 border border-slate-200 dark:border-slate-800 shadow-sm relative">
        <div className="flex gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getLevelColor(currentUser.level)} p-[2px] shrink-0`}>
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden">
              <User size={20} className="text-slate-400" />
            </div>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={newPostContent}
              onChange={handleContentChange}
              placeholder="اكتب منشورك هنا... استخدم @ للإشارة لدواء أو شركة"
              className="w-full bg-transparent resize-none outline-none text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[80px]"
            />
            
            {/* Mention Suggestions */}
            <AnimatePresence>
              {mentionResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto no-scrollbar"
                >
                  {mentionResults.map((item, index) => (
                    <button
                      key={`${item.id}-${index}`}
                      onClick={() => insertMention(item)}
                      className="w-full text-right px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {item.type === 'drug' && <Pill size={14} className="text-blue-500" />}
                        {item.type === 'location' && <Search size={14} className="text-emerald-500" />}
                        {item.type === 'company' && <ShieldCheck size={14} className="text-amber-500" />}
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">{item.name}</span>
                      </div>
                      {item.subtext && <span className="text-[10px] font-bold text-slate-400 truncate">{item.subtext}</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setNewPostContent(prev => prev + '@')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40"
            >
              <Pill size={14} />
              <span>إشارة @</span>
            </button>
          </div>
          <button 
            onClick={handlePost}
            disabled={!newPostContent.trim() || isPosting}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-all active:scale-95"
          >
            {isPosting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} className="mr-1" />
            )}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        <AnimatePresence>
          {activeFilter && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    عرض المنشورات الخاصة بـ: <span className="font-black">{activeFilter.name}</span>
                  </span>
                </div>
                <button onClick={() => setActiveFilter(null)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors shadow-sm">
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredPosts.map(post => {
          const timeData = formatTime(post.createdAt);
          const isLiked = likedPosts.has(post.id);
          const isCommenting = showComments === post.id;

          return (
            <div key={post.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative">
              {/* Time Badge - Top Left Floating */}
              <div className="absolute top-4 left-4 flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-[9px] font-black text-white bg-blue-600 px-2.5 py-1 rounded-full shadow-lg shadow-blue-500/30">
                  <Clock size={10} />
                  <span>{typeof timeData === 'object' ? timeData.distance : timeData}</span>
                </div>
                {typeof timeData === 'object' && timeData.time && (
                  <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">
                    {timeData.time}
                  </div>
                )}
              </div>

              {/* Post Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onUserClick(post.author.id)}>
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getLevelColor(post.author.level)} p-[1.5px] shadow-lg shadow-blue-500/10`}>
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden">
                      <Avatar name={post.author.avatarId || 'avatar_m_01'} size={44} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-[15px] text-slate-900 dark:text-white">{post.author.name}</span>
                      {post.author.isVerified && <CheckCircle2 size={14} className="text-blue-500" />}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {post.author.role === 'pharmacist' ? 'صيدلي متخصص' : 'مستخدم'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="relative mb-5">
                <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {renderContent(post.content)}
                </p>
              </div>

              {/* Tags Section Below Post */}
              {renderTags(post.content)}

              {/* Actions Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(post.id);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all active:scale-90 ${
                      isLiked 
                        ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 border border-rose-100 dark:border-rose-800/50' 
                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <ThumbsUp size={18} className={isLiked ? 'fill-current' : ''} />
                    <span className="text-xs font-black">{post.likes}</span>
                  </button>
                  
                  <button 
                    onClick={() => handleCommentToggle(post.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all active:scale-90 ${
                      isCommenting
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-800/50'
                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <MessageCircle size={18} />
                    <span className="text-xs font-black">{post.commentsCount || 0}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {post.author.id === userId ? (
                    <button 
                      onClick={() => deletePost(post.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 hover:bg-rose-100 transition-all active:scale-95"
                    >
                      <Trash2 size={16} />
                      <span className="text-[10px] font-black">حذف</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowReportModal(post.id)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <Flag size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Comments Area */}
              <AnimatePresence>
                {isCommenting && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50"
                  >
                    {/* Comments List */}
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                      {postComments[post.id]
                        ?.filter(c => !c.parentId)
                        .map(comment => renderComment(comment, postComments[post.id] || []))}
                      
                      {(!postComments[post.id] || postComments[post.id].length === 0) && !isCommentingLoading[post.id] && (
                        <div className="flex flex-col items-center justify-center py-6 opacity-40">
                          <MessageCircle size={32} className="text-slate-300 mb-2" />
                          <p className="text-[10px] font-bold text-slate-400">لا توجد تعليقات بعد</p>
                        </div>
                      )}
                      {isCommentingLoading[post.id] && (
                        <div className="flex justify-center py-4">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Comment Input */}
                    <div className="flex flex-col gap-2">
                      {replyingToCommentId && (
                        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg text-[10px] text-blue-600 font-bold">
                          <span>ترد على تعليق</span>
                          <button onClick={() => { setReplyingToCommentId(null); setCommentInputs(prev => ({ ...prev, [post.id]: '' })); }} className="text-rose-500">إلغاء</button>
                        </div>
                      )}
                      <div className="flex gap-2 w-full">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl p-1 flex items-center border border-slate-100 dark:border-slate-700">
                          <input 
                            type="text" 
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                            placeholder="اكتب تعليقك هنا..."
                            className="flex-1 bg-transparent border-none px-4 py-2 text-xs font-medium outline-none text-slate-900 dark:text-white w-full"
                          />
                          <button 
                            onClick={() => handleSendComment(post.id)}
                            disabled={isCommentingLoading[post.id] || !commentInputs[post.id]?.trim()}
                            className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-90 transition-transform disabled:opacity-50 shrink-0"
                          >
                            {isCommentingLoading[post.id] ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Smart Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowReportModal(null)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6 text-rose-600 dark:text-rose-500">
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                  <Flag size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">الإبلاغ عن المحتوى</h3>
              </div>
              
              <div className="space-y-2 mb-6">
                {[
                  'معلومات طبية خاطئة',
                  'تلاعب بأسعار الأدوية',
                  'محتوى غير لائق أو مسيء',
                  'إزعاج (Spam)'
                ].map(reason => (
                  <button key={reason} onClick={() => handleReport(reason)} className="w-full text-right p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors">
                    {reason}
                  </button>
                ))}
              </div>
              
              <button onClick={() => setShowReportModal(null)} className="w-full py-4 rounded-2xl font-black text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                إلغاء
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
