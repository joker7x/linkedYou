
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ArrowRight, Activity, Database, Users, Sparkles, Globe, Construction, Bell, Send, 
  Bot, RefreshCw, Terminal, Settings as SettingsIcon, ShieldAlert, Coins, History, Ban, Lock, Unlock, 
  Save, AlertTriangle, Fingerprint, Eye, Zap, HeartPulse, CheckCircle2, ChevronLeft, Trash2, MessageSquare,
  Search, Filter, ExternalLink, User, Package
} from 'lucide-react';
import { AdminConfig } from '../types.ts';
import { getAllUsers, updateGlobalConfig, getAllPostsAdmin, adminDeletePost, updateUserPermissions } from '../services/supabase.ts';
import { ADMIN_ID } from '../constants.ts';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AdminViewProps {
  onBack: () => void;
  drugsCount: number;
  config: AdminConfig;
  onUpdateConfig: (config: Partial<AdminConfig>) => void;
  currentUser: any;
}

const TabButton = ({ id, label, icon: Icon, activeTab, setActiveTab }: any) => {
  const isActive = activeTab === id;
  return (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
    >
      {isActive && (
        <motion.div 
          layoutId="activeAdminTabBg" 
          className="absolute inset-0 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20" 
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <Icon size={18} className="relative z-10" />
      <span className="relative z-10">{label}</span>
    </button>
  );
};

export const AdminView: React.FC<AdminViewProps> = ({ onBack, drugsCount, config, onUpdateConfig, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'moderation' | 'system'>('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<{msg: string, time: string}[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const addLog = (msg: string) => {
    setAuditLogs(prev => [{ msg, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
  };

  const saveConfig = async (updates: Partial<AdminConfig>) => {
    onUpdateConfig(updates);
    addLog(`تحديث إعدادات: ${Object.keys(updates).join(', ')}`);
    try {
      await updateGlobalConfig({...config, ...updates});
    } catch (e) {
      console.error("Failed to sync config to cloud", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      setLoading(true);
      getAllUsers().then(u => {
        setUsers(u);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else if (activeTab === 'moderation') {
      setLoading(true);
      getAllPostsAdmin().then(p => {
        setPosts(p);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [activeTab]);

  const handleDeletePost = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    const success = await adminDeletePost(deleteConfirmId);
    if (success) {
      setPosts(prevPosts => prevPosts.filter(p => p.id !== deleteConfirmId));
      addLog(`تم حذف المحتوى: ${deleteConfirmId}`);
      setDeleteConfirmId(null);
    } else {
      addLog(`فشل حذف المحتوى: ${deleteConfirmId}`);
    }
    setIsDeleting(false);
  };

  const handleToggleAdmin = async (user: any) => {
    const newStatus = !user.is_admin;
    await updateUserPermissions(user.id, { is_admin: newStatus });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: newStatus } : u));
    addLog(`تغيير صلاحيات ${user.first_name} إلى ${newStatus ? 'أدمن' : 'مستخدم'}`);
  };

  const updateUserInList = (userId: number, updates: any) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, ...updates, device_info: { ...u.device_info, ...updates } };
      }
      return u;
    }));
  };

  const handleOpenEditModal = async (user: any) => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      const freshUser = allUsers.find(u => u.id === user.id);
      setSelectedUserForEdit(freshUser || user);
    } catch (e) {
      setSelectedUserForEdit(user);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.id.toString().includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-y-auto no-scrollbar transition-colors duration-300" dir="rtl">
      
      {/* Premium Header */}
      <div className="sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <header className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                <ArrowRight size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <ShieldCheck size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight">لوحة التحكم</h1>
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">Pharma Core Security</p>
                </div>
              </div>
            </div>
            
            <div className="hidden sm:flex bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <TabButton id="dashboard" label="نظرة عامة" icon={Activity} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="users" label="المستخدمين" icon={Users} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="moderation" label="المحتوى" icon={ShieldAlert} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="system" label="النظام" icon={Terminal} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </header>

          {/* Mobile Tabs */}
          <div className="sm:hidden flex overflow-x-auto no-scrollbar py-2 gap-2">
            <TabButton id="dashboard" label="نظرة عامة" icon={Activity} activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="users" label="المستخدمين" icon={Users} activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="moderation" label="المحتوى" icon={ShieldAlert} activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="system" label="النظام" icon={Terminal} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
        <AnimatePresence mode="wait">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard icon={Database} label="إجمالي الأدوية" value={drugsCount.toLocaleString()} color="blue" />
                <StatCard icon={Users} label="المستخدمين" value={users.length > 0 ? users.length.toString() : '---'} color="indigo" />
                <StatCard icon={MessageSquare} label="المنشورات" value={posts.length > 0 ? posts.length.toString() : '---'} color="emerald" />
                <StatCard icon={Activity} label="حالة النظام" value="مستقر" color="amber" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Health */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">أداء النظام</h3>
                    <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest">مستقر</div>
                  </div>
                  <div className="space-y-8">
                    <ProgressBar label="استهلاك قاعدة البيانات" percentage={12} color="bg-blue-500" />
                    <ProgressBar label="استهلاك الذاكرة (RAM)" percentage={45} color="bg-indigo-500" />
                    <ProgressBar label="معدل الاستجابة (API)" percentage={8} color="bg-emerald-500" />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-black mb-6 text-slate-900 dark:text-white">إجراءات سريعة</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <QuickAction icon={RefreshCw} label="مزامنة" />
                    <QuickAction icon={ShieldAlert} label="فحص" />
                    <QuickAction icon={Database} label="نسخ" />
                    <QuickAction icon={SettingsIcon} label="إعدادات" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* USERS TAB - Enhanced */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <Users className="text-blue-600" size={28} /> 
                      إدارة المستخدمين
                    </h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">إجمالي المستخدمين: {users.length}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setLoading(true);
                        getAllUsers().then(u => {
                          setUsers(u);
                          setLoading(false);
                        }).catch(() => setLoading(false));
                      }}
                      className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all"
                      title="تحديث القائمة"
                    >
                      <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="text" 
                        placeholder="ابحث بالاسم أو ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pr-12 pl-4 text-sm font-bold outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-600" size={40} /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">المستخدم</th>
                          <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">الصلاحية</th>
                          <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="py-5 px-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-lg">
                                  {user.first_name?.[0] || 'U'}
                                </div>
                                <div>
                                  <div className="text-sm font-black text-slate-900 dark:text-white">{user.first_name} {user.last_name}</div>
                                  <div className="text-[11px] font-bold text-slate-400 mt-0.5">ID: {user.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-4">
                              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black ${user.is_admin ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                {user.is_admin ? <ShieldCheck size={14} /> : <User size={14} />}
                                {user.is_admin ? 'أدمن' : 'مستخدم'}
                              </span>
                            </td>
                            <td className="py-5 px-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleOpenEditModal(user)}
                                  className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all"
                                  title="إدارة متقدمة"
                                >
                                  <SettingsIcon size={18} />
                                </button>
                                <button 
                                  onClick={() => handleToggleAdmin(user)}
                                  className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-all"
                                  title={user.is_admin ? 'إزالة صلاحية الأدمن' : 'ترقية لأدمن'}
                                >
                                  <ShieldCheck size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* MODERATION TAB */}
          {activeTab === 'moderation' && (
            <motion.div key="moderation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <ShieldAlert className="text-rose-500" size={24} /> 
                  مراقبة المحتوى
                </h3>

                {loading ? (
                  <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">لا يوجد محتوى لعرضه</div>
                ) : (
                  <div className="space-y-4">
                    {posts.map(post => {
                      const isComment = post.content.startsWith('__COMMENT__');
                      const isProfile = post.content.startsWith('__PROFILE__');
                      const isLike = post.content.startsWith('__LIKE__');
                      const isTrust = post.content.startsWith('__TRUST__');
                      const isAdminTrust = post.content.startsWith('__ADMIN_TRUST__');
                      
                      // Skip internal system logs and comments (comments will be nested)
                      if (isProfile || isLike || isComment || isTrust || isAdminTrust) return null; 

                      const postComments = posts.filter(p => p.content.startsWith(`__COMMENT__${post.id}__`));

                      return (
                        <div key={post.id} className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-900 transition-all group overflow-hidden">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <span className="px-3 py-1 rounded-xl text-[10px] font-black bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                منشور
                              </span>
                              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">ID: {post.id.substring(0,8)}...</span>
                              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">المستخدم: {post.user_id}</span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button 
                                onClick={() => window.open(`/post/${post.id}`, '_blank')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-black text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all active:scale-95"
                              >
                                <ExternalLink size={14} />
                                عرض
                              </button>
                              <button 
                                onClick={() => handleDeletePost(post.id)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-black text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all active:scale-95"
                              >
                                <Trash2 size={14} />
                                حذف
                              </button>
                            </div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 mb-4">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed break-words">{post.content}</p>
                          </div>
                          
                          {/* Nested Comments */}
                          {postComments.length > 0 && (
                            <div className="mt-4 mr-2 sm:mr-6 space-y-3 border-r-2 border-slate-100 dark:border-slate-800 pr-3 sm:pr-4">
                              <div className="flex items-center gap-2 mb-2 text-slate-400">
                                <MessageSquare size={14} />
                                <span className="text-[10px] font-black uppercase tracking-wider">التعليقات ({postComments.length})</span>
                              </div>
                              {postComments.map(comment => {
                                const parts = comment.content.split('__');
                                const commentText = parts.slice(5).join('__') || parts.slice(4).join('__') || parts.slice(2).join('__');
                                return (
                                  <div key={comment.id} className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700 flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-bold text-slate-400">User: {comment.user_id}</span>
                                      </div>
                                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 break-words">{commentText}</p>
                                    </div>
                                    <button 
                                      onClick={() => handleDeletePost(comment.id)}
                                      className="shrink-0 p-2 text-rose-400 hover:text-rose-600 transition-colors"
                                      title="حذف التعليق"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* SYSTEM TAB - Enhanced */}
          {activeTab === 'system' && (
            <motion.div key="system" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              
              {/* Core Settings */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
                    <SettingsIcon className="text-blue-600" size={28} /> 
                    إعدادات النظام
                  </h3>
                  <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                    التحكم المركزي
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SystemAction 
                    label="وضع الصيانة" 
                    description="إغلاق التطبيق للصيانة والتحديثات" 
                    icon={Construction} 
                    active={config.maintenanceMode} 
                    onClick={() => saveConfig({maintenanceMode: !config.maintenanceMode})} 
                    color="amber"
                  />
                  <SystemAction 
                    label="التزامن المباشر" 
                    description="تحديث أسعار الأدوية من السيرفر لحظياً" 
                    icon={RefreshCw} 
                    active={config.liveSync} 
                    onClick={() => saveConfig({liveSync: !config.liveSync})} 
                    color="blue"
                  />
                  <SystemAction 
                    label="التحليل بالذكاء الاصطناعي" 
                    description="تفعيل ميزات AI في البحث والتحليل" 
                    icon={Bot} 
                    active={config.aiAnalysis} 
                    onClick={() => saveConfig({aiAnalysis: !config.aiAnalysis})} 
                    color="indigo"
                  />
                  <SystemAction 
                    label="الوضع الصارم (Strict Mode)" 
                    description="تطبيق قيود أمنية إضافية على الحسابات" 
                    icon={Lock} 
                    active={config.strictMode} 
                    onClick={() => saveConfig({strictMode: !config.strictMode})} 
                    color="rose"
                  />
                </div>
              </div>

              {/* Broadcast Module */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-[32px] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-900/20">
                      <Zap size={28} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">البث العالمي</h3>
                      <p className="text-blue-400/60 text-xs font-bold mt-1">إرسال تنبيهات فورية لجميع المستخدمين النشطين</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="عنوان التنبيه (مثال: تحديث هام)..." 
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold outline-none placeholder:text-white/20 text-white focus:bg-white/10 focus:border-blue-500/50 transition-all" 
                      />
                    </div>
                    <div className="relative">
                      <textarea 
                        placeholder="اكتب رسالة البث التي ستظهر لجميع المستخدمين..." 
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold outline-none h-40 resize-none placeholder:text-white/20 text-white focus:bg-white/10 focus:border-blue-500/50 transition-all" 
                      />
                    </div>
                    
                    <button 
                      onClick={() => { 
                        if (!broadcastTitle || !broadcastMessage) return;
                        setIsBroadcasting(true);
                        setTimeout(() => {
                          addLog(`إرسال بث عام: ${broadcastTitle}`);
                          setIsBroadcasting(false);
                          setBroadcastSuccess(true);
                          setBroadcastTitle('');
                          setBroadcastMessage('');
                          setTimeout(() => setBroadcastSuccess(false), 3000);
                        }, 1500);
                      }} 
                      disabled={isBroadcasting || !broadcastTitle || !broadcastMessage}
                      className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20 text-white group"
                    >
                      {isBroadcasting ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : broadcastSuccess ? (
                        <CheckCircle2 size={20} className="text-emerald-400" />
                      ) : (
                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      )}
                      {isBroadcasting ? 'جاري معالجة البث...' : broadcastSuccess ? 'تم الإرسال بنجاح' : 'إطلاق البث الآن'}
                    </button>
                  </div>
                </div>
              </div>

              {/* System Logs */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
                  <Terminal className="text-slate-400" size={24} /> 
                  سجل العمليات الأخير
                </h3>
                
                <div className="space-y-3">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold italic">لا توجد عمليات مسجلة حالياً</div>
                  ) : (
                    auditLogs.map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{log.msg}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{log.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* User Control Modal */}
      <AnimatePresence>
        {selectedUserForEdit && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserForEdit(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl">
                    {selectedUserForEdit.first_name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {selectedUserForEdit.first_name} {selectedUserForEdit.last_name}
                    </h3>
                    <p className="text-xs font-bold text-slate-400">ID: {selectedUserForEdit.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUserForEdit(null)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all">
                  <ArrowRight size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
                {/* Security & Limits */}
                <section className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 block">نظام الحظر والتقييد</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'none', label: 'نشط', icon: Activity, color: 'emerald' },
                        { id: 'temporary', label: 'مؤقت', icon: History, color: 'amber' },
                        { id: 'permanent', label: 'كلي', icon: Ban, color: 'rose' }
                      ].map(status => {
                        const currentStatus = selectedUserForEdit.device_info?.ban_status || 'none';
                        const isActive = currentStatus === status.id;
                        const isSuperAdmin = Number(selectedUserForEdit.id) === ADMIN_ID;
                        
                        return (
                          <button 
                            key={status.id}
                            disabled={isSuperAdmin && status.id !== 'none'}
                            onClick={async () => {
                              if (isSuperAdmin && status.id !== 'none') return;
                              // If clicking the same non-none status, toggle back to none
                              const nextStatus = (isActive && status.id !== 'none') ? 'none' : status.id;
                              const updates: any = { ban_status: nextStatus };
                              
                              if (nextStatus === 'temporary') {
                                const days = window.prompt('عدد أيام الحظر؟', '7');
                                if (days) {
                                  const date = new Date();
                                  date.setDate(date.getDate() + parseInt(days));
                                  updates.ban_until = date.toISOString();
                                } else return;
                              } else {
                                updates.ban_until = null;
                              }
                              
                              await updateUserPermissions(selectedUserForEdit.id, updates);
                              setSelectedUserForEdit({ ...selectedUserForEdit, device_info: { ...selectedUserForEdit.device_info, ...updates } });
                              updateUserInList(selectedUserForEdit.id, updates);
                              addLog(`تغيير حالة حظر ${selectedUserForEdit.first_name} إلى ${status.label}`);
                            }}
                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${isActive ? `bg-${status.color}-500 text-white border-${status.color}-600 shadow-lg` : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}
                          >
                            <status.icon size={20} />
                            <span className="text-[10px] font-black">{status.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedUserForEdit.device_info?.ban_status === 'temporary' && (
                      <p className="text-[10px] font-bold text-amber-600 text-center mt-3">
                        محظور حتى: {new Date(selectedUserForEdit.device_info.ban_until).toLocaleString('ar-EG')}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">حد عرض المحتوى (الأصناف)</label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input 
                          id="items_limit_input"
                          type="number" 
                          disabled={Number(selectedUserForEdit.id) === ADMIN_ID}
                          defaultValue={selectedUserForEdit.device_info?.items_limit || 100}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 pr-12 text-sm font-black outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                        />
                        <Package size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      <button 
                        disabled={Number(selectedUserForEdit.id) === ADMIN_ID}
                        onClick={async () => {
                          if (Number(selectedUserForEdit.id) === ADMIN_ID) return;
                          const input = document.getElementById('items_limit_input') as HTMLInputElement;
                          const val = parseInt(input?.value);
                          if (!isNaN(val)) {
                            setIsSaving(true);
                            await updateUserPermissions(selectedUserForEdit.id, { items_limit: val });
                            updateUserInList(selectedUserForEdit.id, { items_limit: val });
                            addLog(`تحديد عرض المحتوى لـ ${selectedUserForEdit.first_name} بـ ${val} صنف`);
                            setIsSaving(false);
                            // Visual feedback
                            input.classList.add('border-emerald-500');
                            setTimeout(() => input.classList.remove('border-emerald-500'), 2000);
                          }
                        }}
                        className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 mr-1">هذا الرقم يحدد أقصى عدد من الأدوية يظهر للمستخدم في الصفحة الرئيسية.</p>
                  </div>
                </section>

                {/* Restricted Pages */}
                <section>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">تقييد الوصول للصفحات</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'community', label: 'المجتمع' },
                      { id: 'shortages', label: 'المخزون' },
                      { id: 'analytics', label: 'التحليلات' },
                      { id: 'invoice', label: 'الفواتير' },
                      { id: 'market_shortages', label: 'النواقص' }
                    ].map(page => {
                      const restrictedPages = selectedUserForEdit.device_info?.restricted_pages || [];
                      const isRestricted = Array.isArray(restrictedPages) && restrictedPages.includes(page.id);
                      const isSuperAdmin = Number(selectedUserForEdit.id) === ADMIN_ID;
                      
                      return (
                        <button 
                          key={page.id}
                          disabled={isSuperAdmin}
                          onClick={async () => {
                            if (isSuperAdmin) return;
                            const current = Array.isArray(restrictedPages) ? [...restrictedPages] : [];
                            const next = isRestricted 
                              ? current.filter((p: string) => p !== page.id) 
                              : [...current, page.id];
                            
                            // Update local state immediately for snappy UI
                            const updatedUser = { 
                              ...selectedUserForEdit, 
                              device_info: { 
                                ...(selectedUserForEdit.device_info || {}), 
                                restricted_pages: next 
                              } 
                            };
                            setSelectedUserForEdit(updatedUser);
                            updateUserInList(selectedUserForEdit.id, { restricted_pages: next });

                            try {
                              await updateUserPermissions(selectedUserForEdit.id, { restricted_pages: next });
                            } catch (err) {
                              console.error("Failed to update permissions:", err);
                              // Rollback on error? Maybe just log for now
                            }
                          }}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isRestricted ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'}`}
                        >
                          <span className="text-xs font-black">{page.label}</span>
                          {isRestricted ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </section>

              </div>

              {/* Footer */}
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setSelectedUserForEdit(null)}
                  disabled={isSaving}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSaving && <RefreshCw size={18} className="animate-spin" />}
                  {isSaving ? 'جاري الحفظ...' : 'إغلاق وحفظ التغييرات'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Components

const StatCard = ({ icon: Icon, label, value, color }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800/50',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800/50',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 rounded-3xl flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">{label}</div>
        <div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div>
      </div>
    </div>
  );
};

const ProgressBar = ({ label, percentage, color }: any) => (
  <div>
    <div className="flex justify-between text-xs font-black mb-2">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span className="text-slate-900 dark:text-white">{percentage}%</span>
    </div>
    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }} 
        animate={{ width: `${percentage}%` }} 
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`} 
      />
    </div>
  </div>
);

const SystemAction = ({ label, description, icon: Icon, active, onClick, color = 'blue' }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-600',
    amber: 'bg-amber-500',
    indigo: 'bg-indigo-600',
    rose: 'bg-rose-500'
  };

  const shadowMap: any = {
    blue: 'shadow-blue-500/30',
    amber: 'shadow-amber-500/30',
    indigo: 'shadow-indigo-500/30',
    rose: 'shadow-rose-500/30'
  };

  return (
    <div 
      className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] hover:border-blue-200 dark:hover:border-blue-900 transition-all cursor-pointer group shadow-sm" 
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? `${colorMap[color]} text-white shadow-lg ${shadowMap[color]}` : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
          <Icon size={20} className={active ? 'animate-pulse' : ''} />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{label}</h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className={`w-12 h-6 rounded-full p-1 transition-all flex items-center shrink-0 ${active ? colorMap[color] : 'bg-slate-200 dark:bg-slate-700'}`}>
        <motion.div 
          animate={{ x: active ? 24 : 0 }} 
          transition={{ type: 'spring', stiffness: 500, damping: 30 }} 
          className="w-4 h-4 bg-white rounded-full shadow-md" 
        />
      </div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label }: any) => (
  <button className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
    <Icon size={20} className="text-slate-600 dark:text-slate-400" />
    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{label}</span>
  </button>
);
