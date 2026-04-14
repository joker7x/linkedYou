import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Award, CheckCircle2, MapPin, Briefcase, 
  GraduationCap, Sparkles, MessageSquare, Edit3, Save, 
  X, Camera, Building2, Phone, ShieldCheck, ThumbsUp
} from 'lucide-react';
import { CommunityUser } from '../types.ts';
import { Avatar } from './Avatar.tsx';
import { AvatarPicker } from './AvatarPicker.tsx';
import { getUserProfile, updateUserProfile, updateTrust, getTrustStats } from '../services/supabase.ts';

interface UserProfileViewProps {
  user: any; // Can be partial or full CommunityUser
  currentUserId: string;
  onBack: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ user: initialUser, currentUserId, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trustStats, setTrustStats] = useState({ score: 0, count: 0 });
  
  const [formData, setFormData] = useState<Partial<CommunityUser>>({
    name: initialUser.name || initialUser.first_name || 'صيدلي',
    title: initialUser.title || 'صيدلي',
    bio: initialUser.bio || '',
    location: initialUser.location || '',
    pharmacyName: initialUser.pharmacyName || '',
    contactInfo: initialUser.contactInfo || '',
    avatarId: initialUser.avatarId || 'avatar_m_01',
    trustScore: 0,
    trustCount: 0
  });

  const isOwnProfile = String(initialUser.id) === currentUserId;

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getUserProfile(String(initialUser.id));
      const stats = await getTrustStats(String(initialUser.id));
      
      if (profile) {
        setFormData(prev => ({ ...prev, ...profile }));
      }
      setTrustStats(stats);
      setLoading(false);
    };
    loadProfile();
  }, [initialUser.id]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateUserProfile(currentUserId, formData);
    if (success) {
      setIsEditing(false);
    } else {
      alert('فشل حفظ التغييرات. يرجى المحاولة مرة أخرى.');
    }
    setSaving(false);
  };

  const handleTrust = async () => {
    if (currentUserId === 'guest') {
      alert('يرجى تسجيل الدخول أولاً.');
      return;
    }
    const success = await updateTrust(String(initialUser.id), currentUserId, 5);
    if (success) {
      const stats = await getTrustStats(String(initialUser.id));
      setTrustStats(stats);
      alert('شكراً لثقتك!');
    }
  };

  const getLevelColor = (level: string = 'bronze') => {
    switch(level) {
      case 'diamond': return 'from-cyan-400 to-blue-600';
      case 'gold': return 'from-yellow-400 to-amber-600';
      case 'silver': return 'from-slate-300 to-slate-500';
      case 'bronze': return 'from-orange-400 to-orange-600';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pt-14 px-4 pb-32 min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
      <header className="flex items-center justify-between mb-8 pt-4 px-2">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
          <ArrowRight size={20} />
        </button>
        <h1 className="text-lg font-black text-slate-900 dark:text-white">الملف الشخصي</h1>
        {isOwnProfile ? (
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${isEditing ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (isEditing ? <Save size={20} /> : <Edit3 size={20} />)}
          </button>
        ) : <div className="w-10" />}
      </header>

      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 mb-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        
        <div className="relative inline-block mb-4">
          <div className={`w-28 h-28 mx-auto rounded-full bg-gradient-to-br ${getLevelColor(initialUser.level)} p-[3px]`}>
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
              <Avatar name={formData.avatarId || 'avatar_m_01'} size={100} />
            </div>
          </div>
          {isEditing && (
            <button 
              onClick={() => setShowAvatarPicker(true)}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900"
            >
              <Camera size={14} />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3 mt-2">
            <input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-center font-black text-lg outline-none focus:ring-2 ring-blue-500"
              placeholder="الاسم"
            />
            <input 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-center font-bold text-sm outline-none focus:ring-2 ring-blue-500"
              placeholder="المسمى الوظيفي"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{formData.name}</h2>
              {initialUser.isVerified && <CheckCircle2 size={20} className="text-blue-500" />}
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">{formData.title}</p>
          </>
        )}
        
        {/* Trust System Badge */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-0.5">
              <ShieldCheck size={16} />
              <span className="text-xs font-black uppercase tracking-wider">نظام الثقة</span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{trustStats.score}%</div>
            <div className="text-[10px] font-bold text-slate-400">{trustStats.count} تقييم</div>
          </div>
          
          {!isOwnProfile && (
            <button 
              onClick={handleTrust}
              className="flex flex-col items-center gap-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors group"
            >
              <ThumbsUp size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-[10px] font-black text-slate-500">ثق به</span>
            </button>
          )}
        </div>
      </div>

      {/* Pharmacy Details */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 mb-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Building2 size={18} className="text-blue-500" /> تفاصيل الصيدلية</h3>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">اسم الصيدلية</label>
              <input 
                value={formData.pharmacyName} 
                onChange={e => setFormData({...formData, pharmacyName: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-blue-500"
                placeholder="مثال: صيدلية الشفاء"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">الموقع</label>
              <input 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-blue-500"
                placeholder="المدينة، المنطقة"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">طريقة التواصل</label>
              <input 
                value={formData.contactInfo} 
                onChange={e => setFormData({...formData, contactInfo: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-blue-500"
                placeholder="رقم الهاتف أو رابط واتساب"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Building2 size={18} /></div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase">الصيدلية</div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{formData.pharmacyName || 'غير محدد'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400"><MapPin size={18} /></div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase">الموقع</div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{formData.location || 'غير محدد'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Phone size={18} /></div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase">التواصل</div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{formData.contactInfo || 'غير محدد'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 mb-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">نبذة تعريفية</h3>
        {isEditing ? (
          <textarea 
            value={formData.bio} 
            onChange={e => setFormData({...formData, bio: e.target.value})}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-blue-500 min-h-[100px]"
            placeholder="اكتب شيئاً عن نفسك..."
          />
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{formData.bio || 'لا توجد نبذة متاحة.'}</p>
        )}
      </div>

      {/* Contact Button */}
      {!isOwnProfile && formData.contactInfo && (
        <a 
          href={formData.contactInfo.includes('http') ? formData.contactInfo : `tel:${formData.contactInfo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-6 py-4 rounded-[28px] bg-blue-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
        >
          <MessageSquare size={18} /> تواصل الآن
        </a>
      )}

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {showAvatarPicker && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAvatarPicker(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">اختر الأفاتار</h3>
                <button onClick={() => setShowAvatarPicker(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"><X size={20} /></button>
              </div>
              
              <AvatarPicker 
                selectedAvatar={formData.avatarId} 
                onSelect={(name) => {
                  setFormData({...formData, avatarId: name});
                  setShowAvatarPicker(false);
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
