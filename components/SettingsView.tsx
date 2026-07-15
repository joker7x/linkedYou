
import React, { useState } from 'react';
import { Moon, Info, Settings, ShieldCheck, Smartphone, ChevronLeft, User, ExternalLink, Shield, MessageSquare, Headphones, FileText, ScrollText, X, Lock, ShieldAlert, Award, BarChart3, ChevronRight, Sparkles, RefreshCw, CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './Avatar.tsx';
import { redeemPromoCode } from '../services/supabase.ts';
import { getTierLabel } from '../lib/accessControl.ts';

interface SettingsViewProps {
  user: any;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onClearFavorites: () => void;
  onBack: () => void;
  isAdmin?: boolean;
  onOpenAdmin: () => void;
  onOpenInvoice: () => void;
  onOpenAnalytics: () => void;
  onOpenShortages: () => void;
  onOpenInventory: () => void;
  onOpenProfile: () => void;
  onUpdateUser?: (updates: any) => void;
}

const SettingSection = React.memo(({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 px-4 flex items-center gap-2">
      {title}
    </h3>
    <div className="bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      {children}
    </div>
  </div>
));

const colorMap: Record<string, { bg: string, text: string, darkBg: string, darkText: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', darkBg: 'dark:bg-blue-500/10', darkText: 'dark:text-blue-400' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', darkBg: 'dark:bg-emerald-500/10', darkText: 'dark:text-emerald-400' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', darkBg: 'dark:bg-indigo-500/10', darkText: 'dark:text-indigo-400' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', darkBg: 'dark:bg-rose-500/10', darkText: 'dark:text-rose-400' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-600', darkBg: 'dark:bg-slate-500/10', darkText: 'dark:text-slate-400' },
};

const SettingItem = React.memo(({ icon: Icon, label, action, isLast = false, valueLabel, color = "blue" }: any) => {
  // Use any to bypass TypeScript errors for motion props
  const MButton = motion.button as any;
  const colors = colorMap[color] || colorMap.blue;
  
  return (
    <MButton
        whileTap={{ backgroundColor: "rgba(0,0,0,0.02)" }}
        onClick={action}
        className={`w-full flex items-center justify-between p-5 ${!isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''} transition-colors text-right hover:bg-slate-50 dark:hover:bg-slate-800/50`}
    >
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-2xl ${colors.bg} ${colors.darkBg} ${colors.text} ${colors.darkText}`}>
                <Icon size={18} strokeWidth={2.5} />
            </div>
            <span className="font-black text-[15px] text-slate-700 dark:text-slate-200">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            {valueLabel && <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg uppercase">{valueLabel}</span>}
            {action && <ChevronLeft size={16} className="text-slate-300 dark:text-slate-600" />}
        </div>
    </MButton>
  );
});

const PolicyModal = ({ title, content, onClose }: { title: string, content: string, onClose: () => void }) => {
  // Use any to bypass TypeScript errors for motion props
  const MDiv = motion.div as any;
  return (
    <MDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md p-6 flex items-center justify-center">
      <MDiv initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-8 max-h-[80vh] overflow-y-auto no-scrollbar relative">
        <button onClick={onClose} className="absolute top-6 left-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
          <X size={20} />
        </button>
        <h2 className="text-xl font-black mb-6 text-slate-900 dark:text-white pt-2">{title}</h2>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed space-y-4" dir="rtl">
          {content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
        </div>
      </MDiv>
    </MDiv>
  );
};

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const { 
    user, darkMode, toggleDarkMode, onBack, isAdmin, 
    onOpenAdmin, onOpenInvoice, onOpenAnalytics, 
    onOpenShortages, onOpenInventory, onOpenProfile, onUpdateUser 
  } = props;
  
  // Use any to bypass TypeScript errors for motion props
  const MDiv = motion.div as any;
  const MButton = motion.button as any;
  const [modal, setModal] = useState<{ title: string, content: string } | null>(null);
  
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ text: string, success: boolean } | null>(null);

  const safeAction = (fn?: () => void) => () => {
    if (typeof fn === 'function') fn();
    else console.warn('Action not provided');
  };

  const handleRedeem = async () => {
    if (!promoCode || !user) return;
    setIsRedeeming(true);
    setRedeemMessage(null);
    try {
      const result = await redeemPromoCode(String(user.id), promoCode);
      setRedeemMessage({ text: result.message, success: result.success });
      if (result.success && onUpdateUser) {
        // We need to refresh user data from server to get full profile
        onUpdateUser({ premiumTier: 'premium' }); // Optimistic update
      }
    } catch (e) {
      setRedeemMessage({ text: 'حدث خطأ غير متوقع', success: false });
    } finally {
      setIsRedeeming(false);
    }
  };

  const openSupport = () => {
    window.open("https://t.me/your_support_username", "_blank");
  };

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'diamond': return 'from-cyan-400 to-blue-600';
      case 'gold': return 'from-yellow-400 to-amber-600';
      case 'silver': return 'from-slate-300 to-slate-500';
      case 'bronze': return 'from-orange-400 to-orange-600';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  const gamification = {
    level: 'gold',
    points: 1250,
    isVerified: true
  };

  return (
    <div className="pt-14 px-4 pb-32 min-h-screen" dir="rtl">
        <header className="flex items-center justify-between mb-8 pt-4 px-2">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[20px] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                  <Settings size={24} strokeWidth={2.5} />
              </div>
              <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Pharma Core</h1>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">الإعدادات والتحكم</p>
              </div>
          </div>
          
          {/* User Gamification Badge */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500">نقاطك</div>
              <div className="text-sm font-black text-blue-600 dark:text-blue-400 leading-none">{gamification.points}</div>
            </div>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getLevelColor(gamification.level)} p-[2px]`}>
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                <Award size={14} className="text-slate-800 dark:text-slate-200" />
              </div>
            </div>
          </div>
        </header>

        {/* Profile Card */}
        {user && (
          <MButton 
            whileTap={{ scale: 0.98 }}
            onClick={safeAction(onOpenProfile)}
            className="w-full mb-8 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden text-right flex items-center gap-4"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16" />
             <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 overflow-hidden relative z-10">
                <Avatar name={user.avatarId || 'avatar_m_01'} size={64} isPremium={user.premiumTier && user.premiumTier !== 'free'} />
             </div>
             <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2">
                   <h2 className="text-lg font-black">{user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'مستخدم'}</h2>
                   {gamification.isVerified && <Shield size={14} className="text-blue-200" />}
                </div>
                <p className="text-[10px] font-black text-blue-100/70 uppercase tracking-widest mt-1">عرض وتعديل الملف الشخصي</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative z-10">
                <ChevronLeft size={20} />
             </div>
          </MButton>
        )}

        {isAdmin && (
          <SettingSection title="الإدارة الفنية">
             <SettingItem icon={ShieldAlert} label="لوحة تحكم النظام" color="blue" action={safeAction(onOpenAdmin)} isLast />
          </SettingSection>
        )}

        <SettingSection title="الاشتراك المميز">
            {user?.premiumTier && user.premiumTier !== 'free' ? (
              <div className="p-6 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                      <Sparkles size={20} fill="currentColor" />
                    </div>
                    <div>
                      <span className="font-black text-base text-slate-800 dark:text-white block">{getTierLabel(user)}</span>
                      {user.premiumUntil && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">ينتهي في: {new Date(user.premiumUntil).toLocaleDateString('ar-EG')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.unlockedFeatures?.map((f: string) => (
                    <span key={f} className="text-[9px] font-black px-2.5 py-1 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-900/30">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-amber-500/20 rounded-[28px] m-1 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
                 
                 <div className="flex items-start gap-4 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
                     <Sparkles size={24} strokeWidth={2.5} />
                   </div>
                   <div>
                     <span className="font-black text-lg text-slate-800 dark:text-white block">هل لديك كود تفعيل؟</span>
                     <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">ادخل الكود الخاص بك لفتح كامل المزايا الحصرية والنسخة الاحترافية.</p>
                   </div>
                 </div>
                 
                 <div className="relative group">
                   <input 
                     type="text" 
                     placeholder="ادخل الكود هنا (PHARMA2024)" 
                     value={promoCode}
                     onChange={(e) => setPromoCode(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl pr-6 pl-32 py-4 text-sm font-black outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                   />
                   <button 
                     onClick={handleRedeem}
                     disabled={isRedeeming || !promoCode}
                     className="absolute left-2 top-2 bottom-2 px-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-[20px] font-black text-xs shadow-md shadow-amber-500/30 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                   >
                     {isRedeeming ? <RefreshCw size={16} className="animate-spin" /> : 'تفعيل الآن'}
                   </button>
                 </div>
                 
                 {redeemMessage && (
                   <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center gap-3 mt-4 p-4 rounded-2xl ${redeemMessage.success ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30' : 'bg-rose-50 dark:bg-rose-900/10 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30'}`}
                   >
                     <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-sm">
                        {redeemMessage.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                     </div>
                     <span className="text-xs font-black leading-tight">{redeemMessage.text}</span>
                   </motion.div>
                 )}
              </div>
            )}
        </SettingSection>

        <SettingSection title="أدوات الصيدلية">
            <SettingItem icon={Package} label="مخزون الصيدلية (Stock)" color="indigo" action={safeAction(onOpenInventory)} />
            <SettingItem icon={BarChart3} label="تحليلات المخزون" color="blue" action={safeAction(onOpenAnalytics)} />
            <SettingItem icon={ShieldAlert} label="نواقص السوق" color="rose" action={safeAction(onOpenShortages)} />
            <SettingItem icon={FileText} label="منشئ الفواتير" color="emerald" action={safeAction(onOpenInvoice)} isLast />
        </SettingSection>

        <SettingSection title="المظهر">
            <div className="w-full flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                        <Moon size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-[15px] text-slate-700 dark:text-slate-200">الوضع الليلي</span>
                </div>
                <div onClick={toggleDarkMode} dir="ltr" className={`w-12 h-7 rounded-full p-1 cursor-pointer flex items-center transition-all duration-300 ${darkMode ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                    <MDiv layout className="w-5 h-5 bg-white rounded-full shadow-sm" animate={{ x: darkMode ? 20 : 0 }} />
                </div>
            </div>
        </SettingSection>

        <SettingSection title="الدعم والتواصل">
            <SettingItem icon={Headphones} label="الدعم الفني المباشر" color="emerald" action={openSupport} />
            <SettingItem icon={Smartphone} label="قناة التحديثات الرسمية" color="rose" isLast action={() => window.open("https://t.me/your_channel", "_blank")} />
        </SettingSection>

        <SettingSection title="القانون والسياسات">
            <SettingItem icon={ShieldCheck} label="سياسة الخصوصية" color="blue" action={() => setModal({ title: "سياسة الخصوصية", content: "بياناتك مشفرة ومحمية بالكامل." })} />
            <SettingItem icon={Info} label="إصدار التطبيق" valueLabel="v3.1.2 Premium" color="slate" isLast />
        </SettingSection>

        <AnimatePresence>
          {modal && <PolicyModal title={modal.title} content={modal.content} onClose={() => setModal(null)} />}
        </AnimatePresence>
    </div>
  );
}
