
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ArrowRight, Activity, Database, Users, Sparkles, Globe, Construction, Bell, Send, 
  Bot, RefreshCw, Terminal, Settings as SettingsIcon, ShieldAlert, Coins, History, Ban, Lock, Unlock, 
  Save, AlertTriangle, Fingerprint, Eye, Zap, HeartPulse, CheckCircle2, ChevronLeft, Trash2, MessageSquare,
  Search, Filter
} from 'lucide-react';
import { AdminConfig } from '../types.ts';
import { getAllUsers, updateGlobalConfig, adminUpdateTrust, getAllPostsAdmin, adminDeletePost, updateUserPermissions } from '../services/supabase.ts';
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
    if (window.confirm('هل أنت متأكد من حذف هذا المحتوى نهائياً؟')) {
      const success = await adminDeletePost(id);
      if (success) {
        setPosts(posts.filter(p => p.id !== id));
        addLog(`تم حذف المحتوى: ${id}`);
      } else {
        alert('فشل الحذف');
      }
    }
  };

  const handleToggleAdmin = async (user: any) => {
    const newStatus = !user.is_admin;
    await updateUserPermissions(user.id, { is_admin: newStatus });
    setUsers(users.map(u => u.id === user.id ? { ...u, is_admin: newStatus } : u));
    addLog(`تغيير صلاحيات ${user.first_name} إلى ${newStatus ? 'أدمن' : 'مستخدم'}`);
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
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Database} label="إجمالي الأدوية" value={drugsCount.toLocaleString()} color="blue" />
                <StatCard icon={Users} label="المستخدمين" value={users.length > 0 ? users.length.toString() : '---'} color="indigo" />
                <StatCard icon={MessageSquare} label="المنشورات" value={posts.length > 0 ? posts.length.toString() : '---'} color="emerald" />
                <StatCard icon={Activity} label="حالة النظام" value="مستقر" color="amber" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* System Health */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">حالة الخوادم</h3>
                      <p className="text-sm font-bold text-slate-500 mt-1">جميع الأنظمة تعمل بكفاءة عالية</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <HeartPulse className="text-emerald-600 dark:text-emerald-400" size={24} />
                    </div>
                  </div>
                  
                  <div className="space-y-6 relative z-10">
                    <ProgressBar label="استهلاك قاعدة البيانات" percentage={12} color="bg-blue-500" />
                    <ProgressBar label="استهلاك الذاكرة (RAM)" percentage={45} color="bg-indigo-500" />
                    <ProgressBar label="معدل الاستجابة (API)" percentage={8} color="bg-emerald-500" />
                  </div>
                </div>

                {/* Audit Logs */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <ShieldAlert className="text-amber-600 dark:text-amber-400" size={20} />
                    </div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">سجل النشاطات</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                      <div key={i} className="flex flex-col gap-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.msg}</span>
                        <span className="text-[10px] text-slate-400 font-black">{log.time}</span>
                      </div>
                    )) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                        <History size={32} className="mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest">لا يوجد نشاط</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <Users className="text-blue-600" size={24} /> 
                    إدارة المستخدمين
                  </h3>
                  
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="ابحث بالاسم أو ID..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-12 pl-4 text-sm font-bold outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">المستخدم</th>
                          <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">الصلاحية</th>
                          <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">الثقة</th>
                          <th className="pb-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center font-black text-blue-600 dark:text-blue-400">
                                  {user.first_name?.[0] || 'U'}
                                </div>
                                <div>
                                  <div className="text-sm font-black text-slate-900 dark:text-white">{user.first_name} {user.last_name}</div>
                                  <div className="text-[10px] font-bold text-slate-500">ID: {user.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${user.is_admin ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                {user.is_admin ? <ShieldCheck size={12} /> : <User size={12} />}
                                {user.is_admin ? 'أدمن' : 'مستخدم'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number" 
                                  defaultValue={0} // Ideally fetch real trust score
                                  className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-black outline-none focus:border-blue-500 text-center"
                                  onBlur={async (e) => {
                                    const score = parseInt(e.target.value);
                                    if (!isNaN(score)) {
                                      const ok = await adminUpdateTrust(String(user.id), String(currentUser.id), score);
                                      if (ok) addLog(`تعديل ثقة ${user.first_name} إلى ${score}`);
                                    }
                                  }}
                                />
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleToggleAdmin(user)}
                                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                                  title={user.is_admin ? 'إزالة صلاحية الأدمن' : 'ترقية لأدمن'}
                                >
                                  <ShieldCheck size={16} />
                                </button>
                                <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors" title="حظر المستخدم">
                                  <Ban size={16} />
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
                      
                      if (isProfile || isLike) return null; // Skip non-content posts in moderation

                      let displayContent = post.content;
                      if (isComment) {
                        const parts = post.content.split('__');
                        displayContent = parts.slice(5).join('__') || parts.slice(4).join('__') || parts.slice(2).join('__'); // Try to extract actual comment text
                      }

                      return (
                        <div key={post.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isComment ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                {isComment ? 'تعليق' : 'منشور'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">ID: {post.id.substring(0,8)}...</span>
                              <span className="text-[10px] font-bold text-slate-400">User: {post.user_id}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">{displayContent}</p>
                          </div>
                          
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl font-black text-xs hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                          >
                            <Trash2 size={16} />
                            حذف المحتوى
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <motion.div key="system" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              
              {/* Core Settings */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-900 dark:text-white">
                  <SettingsIcon className="text-blue-600" size={24} /> 
                  إعدادات النظام الأساسية
                </h3>
                
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
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[32px] p-8 border border-indigo-800/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-white relative z-10">
                  <Zap className="text-yellow-400" size={24} /> 
                  وحدة البث الموحد (Global Broadcast)
                </h3>
                
                <div className="space-y-4 relative z-10">
                  <input 
                    type="text" 
                    placeholder="عنوان التنبيه (مثال: تحديث هام)..." 
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none placeholder:text-white/30 text-white focus:bg-white/10 transition-colors" 
                  />
                  <textarea 
                    placeholder="اكتب رسالة البث التي ستظهر لجميع المستخدمين..." 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none h-32 resize-none placeholder:text-white/30 text-white focus:bg-white/10 transition-colors" 
                  />
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
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 text-white"
                  >
                    {isBroadcasting ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : broadcastSuccess ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Send size={20} />
                    )}
                    {isBroadcasting ? 'جاري الإرسال لجميع الخوادم...' : broadcastSuccess ? 'تم الإرسال بنجاح' : 'إطلاق البث الآن'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
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

  return (
    <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${active ? `${colorMap[color]} text-white shadow-lg shadow-${color}-500/30` : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500'}`}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{label}</h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button className={`w-14 h-7 rounded-full p-1 transition-all flex items-center shrink-0 ${active ? colorMap[color] : 'bg-slate-200 dark:bg-slate-700'}`}>
        <motion.div animate={{ x: active ? -28 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="w-5 h-5 bg-white rounded-full shadow-md" />
      </button>
    </div>
  );
};

// Dummy User icon component since we didn't import it at the top
const User = ({ size, className }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
