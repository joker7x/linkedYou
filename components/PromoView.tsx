
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Send, Bot, ShieldCheck, ArrowRight, 
  Smartphone, Globe, Share2, Info, Package2, Award, Pill
} from 'lucide-react';
import { getPromoLink, logPromoVisit, getDrugByNo } from '../services/supabase.ts';
import { Drug, PromoLink } from '../types.ts';

interface PromoViewProps {
  promoId: string;
  onClose: () => void;
}

export const PromoView: React.FC<PromoViewProps> = ({ promoId, onClose }) => {
  const [linkData, setLinkData] = useState<PromoLink | null>(null);
  const [drugData, setDrugData] = useState<Drug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data, error: linkError } = await getPromoLink(promoId);
        if (linkError || !data) {
          setError(true);
          setLoading(false);
          return;
        }
        setLinkData(data);

        // Fetch drug details
        const drug = await getDrugByNo(data.drug_no);
        if (drug) setDrugData(drug);

        // Log visit
        const metadata = await fetchMetadata();
        await logPromoVisit({
          link_id: promoId,
          ...metadata
        });

        setLoading(false);
      } catch (e) {
        setError(true);
        setLoading(false);
      }
    };
    init();
  }, [promoId]);

  const fetchMetadata = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      return {
        country: data.country_name,
        ip: data.ip,
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        platform: getPlatform(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || 'Direct'
      };
    } catch {
      return {
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        platform: getPlatform(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || 'Direct'
      };
    }
  };

  const getPlatform = () => {
    const ua = navigator.userAgent;
    if (/FBAN|FBAV/i.test(ua)) return 'Facebook';
    if (/Instagram/i.test(ua)) return 'Instagram';
    if (/WhatsApp/i.test(ua)) return 'WhatsApp';
    if (/Twitter|X/i.test(ua)) return 'X/Twitter';
    if (/Telegram/i.test(ua)) return 'Telegram';
    return 'Web Browser';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-950 z-[100] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-black text-slate-400 animate-pulse">جاري تحضير العرض الحصري...</p>
      </div>
    );
  }

  if (error || !linkData) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-950 z-[100] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <Info size={40} />
        </div>
        <h2 className="text-2xl font-black mb-2">الرابط غير صالح</h2>
        <p className="text-slate-500 mb-8">عذراً، يبدو أن هذا الرابط الترويجي قد انتهى أو غير موجود.</p>
        <button onClick={onClose} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black">الذهاب للتطبيق</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[100] overflow-y-auto" dir="rtl">
      <div className="max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">PHARMA <span className="text-blue-600">CORE</span></h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">عرض ترويجي حصري</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-full shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Content Card */}
        <div className="px-6 py-4 flex-1">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl shadow-blue-500/5 relative"
          >
            {/* Visual Header */}
            <div className="h-56 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 flex flex-col justify-end relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>
              
              <div className="absolute top-6 left-6 w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center transform -rotate-12">
                <Pill size={32} className="text-white/80" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-4 shadow-sm">
                  <Award size={12} /> تحديث الأسعار
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2 line-clamp-3">
                  {drugData?.name_ar || linkData.title}
                </h2>
                {drugData?.name_en && (
                  <p className="text-blue-100/80 font-bold text-xs sm:text-sm mb-2 line-clamp-1" dir="ltr">
                    {drugData.name_en}
                  </p>
                )}
                <p className="text-blue-100 font-bold text-sm opacity-90 flex items-center gap-2">
                  <Package2 size={14} />
                  {drugData?.company || 'شركة الأدوية'}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-800/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full"></div>
                  <div className="text-[10px] font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mb-2">السعر الجديد</div>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1">
                    {drugData?.price_new || '---'} <span className="text-sm font-bold">ج.م</span>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/5 rounded-bl-full"></div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">السعر القديم</div>
                  <div className="text-3xl font-black text-slate-400 line-through decoration-rose-500/50 flex items-baseline gap-1">
                    {drugData?.price_old || '---'} <span className="text-sm font-bold">ج.م</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100/50 dark:border-blue-800/50">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                    <Info size={24} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-blue-900 dark:text-blue-100">معلومات إضافية</h4>
                    <p className="text-sm text-blue-700/80 dark:text-blue-400/80 font-medium mt-1.5 leading-relaxed">
                      هذا الصنف متوفر حالياً بأسعاره الجديدة. يمكنك متابعة كافة التحديثات من خلال قنواتنا الرسمية.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <a 
                  href={`https://t.me/${linkData.bot_username}?start=promo_${promoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-[0.98]"
                >
                  <Bot size={24} />
                  فتح في البوت الرسمي
                </a>

                {linkData.channel_link && (
                  <a 
                    href={linkData.channel_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-800 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
                  >
                    <Send size={24} className="text-blue-500" />
                    انضم لقناة التليجرام
                  </a>
                )}
                
                <button 
                  onClick={onClose}
                  className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors mt-2"
                >
                  تخطي والذهاب للتطبيق
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-8 text-center pb-12">
          <div className="flex items-center justify-center gap-2 text-slate-300 dark:text-slate-700 mb-4">
            <div className="h-[1px] w-12 bg-current"></div>
            <ShieldCheck size={16} />
            <div className="h-[1px] w-12 bg-current"></div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            Powered by Pharma Core Intelligence
          </p>
        </div>
      </div>
    </div>
  );
};
