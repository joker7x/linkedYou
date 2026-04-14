import React, { useState } from 'react';
import { User, CornerDownRight, MessageCircle } from 'lucide-react';

// --- Types ---
export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  replies: Comment[];
}

// --- Dummy Data ---
const initialComments: Comment[] = [
  {
    id: '1',
    author: 'أحمد محمود',
    content: 'هذا تعليق رئيسي أول.',
    createdAt: 'منذ ساعتين',
    replies: [
      {
        id: '1-1',
        author: 'سارة خالد',
        content: 'رد على التعليق الأول.',
        createdAt: 'منذ ساعة',
        replies: [
          {
            id: '1-1-1',
            author: 'محمد علي',
            content: 'رد فرعي على الرد الأول.',
            createdAt: 'منذ 30 دقيقة',
            replies: []
          }
        ]
      }
    ]
  },
  {
    id: '2',
    author: 'ياسمين طارق',
    content: 'تعليق رئيسي ثاني.',
    createdAt: 'منذ 5 ساعات',
    replies: []
  }
];

// --- Recursive Comment Component ---
const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="relative mt-3">
      {/* Thread Line */}
      {comment.replies.length > 0 && (
        <div className="absolute left-3 top-10 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />
      )}

      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 z-10">
          <User size={16} className="text-slate-500" />
        </div>
        <div className="flex-1">
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-slate-900 dark:text-white">{comment.author}</span>
              <span className="text-[10px] text-slate-400">{comment.createdAt}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{comment.content}</p>
          </div>
          
          <button 
            onClick={() => setShowReply(!showReply)}
            className="flex items-center gap-1 mt-1 ml-2 text-[10px] font-bold text-slate-500 hover:text-blue-600"
          >
            <CornerDownRight size={10} />
            رد
          </button>
        </div>
      </div>

      {/* Recursive Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-10 space-y-2">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
export const NestedCommentsSystem: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
      <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <MessageCircle size={20} />
        التعليقات
      </h2>
      <div className="space-y-2">
        {initialComments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
};
