
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, AlertTriangle, CheckCircle, Building2, Wallet, Info, Activity, Sparkles, ChevronLeft } from 'lucide-react';
import { TawreedProduct } from '../types.ts';
import { checkDrugAvailability } from '../services/tawreed.ts';

interface DrugIntelligenceModalProps { 
  drug: any; 
  onClose: () => void; 
  isMarketEnabled: boolean; 
  isAiEnabled: boolean;
}

export const DrugIntelligenceModal: React.FC<DrugIntelligenceModalProps> = ({ drug, onClose, isMarketEnabled, isAiEnabled }) => {
    // Use any to bypass TypeScript errors for motion props
    const MDiv = motion.div as any;
    const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'ai'>('overview');
    const [tawreedData, setTawreedData] = useState<TawreedProduct | null>(null);
    const [tawreedStatus, setTawreedStatus] = useState<'idle' | 'loading' | 'found' | 'not-found'>('idle');

    const drugName = drug.name_en || 'Unknown';
    const drugPrice = drug.price_new ?? 0;

    const checkMarket = async () => {
        if (!isMarketEnabled) return;
        setTawreedStatus('loading');
        try {
            const results = await checkDrugAvailability(drugName);
            if(results.length > 0) { 
              setTawreedData(results[0]); 
              setTawreedStatus('found'); 
            }
            else { 
              setTawreedStatus('not-found'); 
            }
        } catch(e) { 
          setTawreedStatus('not-found'); 
        }
    };

    useEffect(() => { 
      if(activeTab === 'market' && tawreedStatus === 'idle') checkMarket(); 
    }, [activeTab]);

    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-6" dir="rtl">
            <MDiv 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col max-h-[92vh] shadow-2xl relative border-t border-slate-100 dark:border-slate-800"
            >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 h-1.5 w-12 bg-slate-200 dark:bg-slate-800 rounded-full sm:hidden" />
                
                <div className="px-8 pt-12 pb-6 flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{drugName}</h2>
                      <p className="text-lg text-slate-500 dark:text-slate-400 font-bold mt-1">{drug.name_ar || '---'}</p>
                    </div>
                    <button onClick={onClose} className="w-11 h-11 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-transform border border-slate-100 dark:border-slate-700">
                      <X size={20}/>
                    </button>
                </div>

                <div className="px-8 mb-4">
                  <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-[24px] border border-slate-200 dark:border-slate-700">
                      <TabItem 
                        active={activeTab === 'overview'} 
                        onClick={() => setActiveTab('overview')} 
                        icon={Info} 
                        label="المواصفات" 
                        color="blue"
                      />
                      {isMarketEnabled && (
                        <TabItem 
                          active={activeTab === 'market'} 
                          onClick={() => setActiveTab('market')} 
                          icon={Activity} 
                          label="السوق" 
                          color="emerald"
                        />
                      )}
                      {isAiEnabled && (
                        <TabItem 
                          active={activeTab === 'ai'} 
                          onClick={() => setActiveTab('ai')} 
                          icon={Sparkles} 
                          label="ذكاء Core" 
                          color="indigo"
                        />
                      )}
                  </div>
                </div>

                <div className="px-8 py-6 overflow-y-auto no-scrollbar flex-1 pb-16">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <MDiv key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50/50 dark:bg-blue-500/5 p-6 rounded-[32px] border border-blue-100 dark:border-blue-500/10 shadow-sm">
                                        <Wallet size={20} className="text-blue-500 mb-4" />
                                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-black mb-1 uppercase tracking-widest">السعر الرسمي</div>
                                        <div className="flex items-baseline gap-1">
                                          <div className="text-2xl font-black dark:text-white">{Number(drugPrice).toFixed(2)}</div>
                                          <div className="text-[10px] font-bold text-slate-400">ج.م</div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-zinc-900/5 p-6 rounded-[32px] border border-slate-100 dark:border-white/5">
                                        <Building2 size={20} className="text-slate-400 dark:text-zinc-500 mb-4" />
                                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-black mb-1 uppercase tracking-widest">المصنع</div>
                                        <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300 line-clamp-2">{drug.company || 'شركة غير محددة'}</div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-zinc-900/5 p-6 rounded-[32px] border border-slate-100 dark:border-white/5">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3">تفاصيل إضافية</h4>
                                    <div className="space-y-3">
                                        <InfoRow label="رقم الصنف" value={drug.drug_no} />
                                        <InfoRow label="الحالة" value="متوفر في السوق" />
                                        <InfoRow label="آخر تحديث" value={new Date(drug.api_updated_at).toLocaleDateString('ar-EG')} />
                                    </div>
                                </div>
                            </MDiv>
                        )}

                        {activeTab === 'market' && (
                            <MDiv key="market" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                {tawreedStatus === 'loading' ? (
                                    <div className="text-center py-20 flex flex-col items-center">
                                        <div className="relative w-16 h-16 mb-6">
                                          <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-900/20" />
                                          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                                        </div>
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">جاري فحص التوافر الخارجي...</p>
                                    </div>
                                ) : tawreedStatus === 'found' ? (
                                    <div className="space-y-4">
                                      <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 p-8 rounded-[40px] text-center shadow-sm">
                                          <div className="w-16 h-16 bg-emerald-500 rounded-[22px] flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-emerald-500/20">
                                            <CheckCircle size={32} />
                                          </div>
                                          <h4 className="text-xl font-black text-emerald-700 dark:text-emerald-400 mb-2">رصد توافر في السوق</h4>
                                          <p className="text-sm font-bold text-emerald-600/70 mb-8">تم العثور على عروض توريد نشطة</p>
                                          
                                          <div className="grid grid-cols-2 gap-4">
                                              <div className="bg-white dark:bg-zinc-800 p-5 rounded-[28px] border border-emerald-100 dark:border-white/5">
                                                  <div className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-tighter">أفضل سعر توريد</div>
                                                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{Number(tawreedData?.bestSale || 0).toFixed(2)}</div>
                                              </div>
                                              <div className="bg-white dark:bg-zinc-800 p-5 rounded-[28px] border border-emerald-100 dark:border-white/5">
                                                  <div className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-tighter">الخصم المتوسط</div>
                                                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{tawreedData?.avgDiscount || 0}%</div>
                                              </div>
                                          </div>
                                      </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-24 bg-slate-50 dark:bg-zinc-900/5 rounded-[40px] border border-dashed border-slate-200 dark:border-white/10">
                                        <AlertTriangle size={48} className="mx-auto text-slate-300 dark:text-zinc-700 mb-4" />
                                        <p className="font-bold text-slate-400 dark:text-zinc-500 mb-2">لا توجد عروض نشطة</p>
                                        <p className="text-[11px] text-slate-300 dark:text-zinc-600 px-12 leading-relaxed">لم نتمكن من رصد أي عروض توريد لهذا الصنف في الوقت الحالي.</p>
                                    </div>
                                )}
                            </MDiv>
                        )}

                        {activeTab === 'ai' && (
                             <MDiv key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 py-4">
                                <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16" />
                                  <Sparkles className="mb-4 text-indigo-200" size={32} />
                                  <h4 className="text-xl font-black mb-2">توصية الذكاء الاصطناعي</h4>
                                  <p className="text-indigo-100/80 text-sm font-medium leading-relaxed">نقوم حالياً بتحليل البيانات التاريخية وسلوك السوق لتقديم أدق التوقعات.</p>
                                  <div className="mt-8 pt-6 border-t border-indigo-500/30 flex items-center justify-between">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200">System Ready</div>
                                    <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-lg">بدأ التحليل</button>
                                  </div>
                                </div>
                             </MDiv>
                        )}
                    </AnimatePresence>
                </div>
            </MDiv>
        </div>
    );
};

const TabItem = React.memo(({ active, onClick, icon: Icon, label, color }: any) => {
  const colorMap: any = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  };

  return (
    <button 
      onClick={onClick} 
      className={`flex-1 py-3.5 rounded-[20px] text-[12px] font-black transition-all flex items-center justify-center gap-2 relative ${active ? 'bg-white dark:bg-zinc-800 shadow-sm ' + colorMap[color] : 'text-slate-400 dark:text-zinc-600 hover:text-slate-600'}`}
    >
      <Icon size={16} strokeWidth={active ? 3 : 2} /> {label}
    </button>
  );
});

const InfoRow = React.memo(({ label, value }: { label: string, value: any }) => (
  <div className="flex items-center justify-between text-[12px]">
    <span className="font-bold text-slate-400 dark:text-zinc-500">{label}</span>
    <span className="font-black text-slate-800 dark:text-slate-200">{value || '---'}</span>
  </div>
));
