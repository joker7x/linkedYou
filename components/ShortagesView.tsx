import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, ArrowRight, Search, Filter, PackageX, TrendingDown, PackageCheck, Award } from 'lucide-react';

interface ShortagesViewProps {
  onBack: () => void;
}

type ShortageTab = 'current' | 'expected' | 'available';

interface ShortageItem {
  id: string;
  name_en: string;
  name_ar: string;
  status: ShortageTab;
  last_updated: string;
  alternatives: { name: string; price: number }[];
  expected_date?: string;
  company: string;
  isNotified: boolean;
}

const mockShortages: ShortageItem[] = [
  { id: '1', name_en: 'Panadol Extra 24 Tablets', name_ar: 'بانادول اكسترا 24 قرص', status: 'current', last_updated: 'منذ ساعتين', alternatives: [{name: 'Adol Extra', price: 25}, {name: 'Paramol Extra', price: 22}], company: 'GSK', isNotified: false },
  { id: '2', name_en: 'Augmentin 1g Tablets', name_ar: 'اوجمنتين 1 جم اقراص', status: 'current', last_updated: 'منذ يومين', alternatives: [{name: 'Curam 1g', price: 85}, {name: 'Augmentin Alternative', price: 80}], company: 'GSK', isNotified: true },
  { id: '3', name_en: 'Concor 5mg Tablets', name_ar: 'كونكور 5 مجم اقراص', status: 'expected', last_updated: 'منذ 5 ساعات', alternatives: [{name: 'Bisocard 5mg', price: 45}], expected_date: 'نهاية الشهر', company: 'Merck', isNotified: false },
  { id: '4', name_en: 'Cataflam 50mg Tablets', name_ar: 'كاتافلام 50 مجم اقراص', status: 'available', last_updated: 'اليوم', alternatives: [{name: 'Voltaren 50mg', price: 35}], company: 'Novartis', isNotified: false },
  { id: '5', name_en: 'Eltroxin 100mcg Tablets', name_ar: 'التروكسين 100 ميكروجرام', status: 'current', last_updated: 'منذ اسبوع', alternatives: [], company: 'Aspen', isNotified: true },
  { id: '6', name_en: 'Amaryl 2mg Tablets', name_ar: 'اماريل 2 مجم اقراص', status: 'expected', last_updated: 'منذ يوم', alternatives: [{name: 'Glim 2mg', price: 30}], expected_date: 'الاسبوع القادم', company: 'Sanofi', isNotified: false },
  { id: '7', name_en: 'Nexium 40mg Tablets', name_ar: 'نيكسيوم 40 مجم اقراص', status: 'available', last_updated: 'منذ 3 أيام', alternatives: [{name: 'Esomeprazole 40mg', price: 60}], company: 'AstraZeneca', isNotified: false },
];

const TabButton = ({ id, label, icon: Icon, activeTab, setActiveTab, count }: any) => {
  const MDiv = motion.div as any;
  const isActive = activeTab === id;
  return (
    <button onClick={() => setActiveTab(id)} className={`flex-1 py-3 rounded-[22px] flex flex-col items-center justify-center gap-1.5 text-[10px] font-black transition-all relative ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
      {isActive && <MDiv layoutId="activeShortageTab" className="absolute inset-0 bg-rose-50 dark:bg-rose-900/20 shadow-sm rounded-[22px] border border-rose-100 dark:border-rose-800/50" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
      <span className="relative z-10 flex items-center gap-1.5">
        <Icon size={16} className={isActive ? (id === 'current' ? 'text-rose-500' : id === 'expected' ? 'text-amber-500' : 'text-emerald-500') : ''} />
        {label}
        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800/50'}`}>{count}</span>
      </span>
    </button>
  );
};

export const ShortagesView: React.FC<ShortagesViewProps> = ({ onBack }) => {
  const MDiv = motion.div as any;
  const [activeTab, setActiveTab] = useState<ShortageTab>('current');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = mockShortages.filter(item => 
    item.status === activeTab && 
    (item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) || item.name_ar.includes(searchQuery))
  );

  const getStatusColor = (status: ShortageTab) => {
    switch(status) {
      case 'current': return 'rose';
      case 'expected': return 'amber';
      case 'available': return 'emerald';
    }
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
          <div className="w-12 h-12 rounded-[20px] bg-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-500/20">
            <AlertTriangle size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">نواقص السوق</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">تحديثات النواقص والبدائل</p>
          </div>
        </div>
        
        {/* User Gamification Badge */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500">نقاطك</div>
            <div className="text-sm font-black text-rose-600 dark:text-rose-400 leading-none">{gamification.points}</div>
          </div>
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getLevelColor(gamification.level)} p-[2px]`}>
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
              <Award size={14} className="text-slate-800 dark:text-slate-200" />
            </div>
          </div>
        </div>
      </header>

      <div className="relative mb-6 px-2">
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="ابحث في النواقص..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] py-4 pr-12 pl-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-1.5 flex items-center mb-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <TabButton id="current" label="نواقص حالية" icon={PackageX} activeTab={activeTab} setActiveTab={setActiveTab} count={mockShortages.filter(i => i.status === 'current').length} />
        <TabButton id="expected" label="متوقع نقصه" icon={TrendingDown} activeTab={activeTab} setActiveTab={setActiveTab} count={mockShortages.filter(i => i.status === 'expected').length} />
        <TabButton id="available" label="توفرت حديثاً" icon={PackageCheck} activeTab={activeTab} setActiveTab={setActiveTab} count={mockShortages.filter(i => i.status === 'available').length} />
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredItems.length > 0 ? filteredItems.map((item) => {
            const color = getStatusColor(item.status);
            return (
              <MDiv
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-1.5 h-full bg-${color}-500`} />
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">{item.name_en}</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{item.name_ar}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 whitespace-nowrap`}>
                    {item.status === 'current' ? 'غير متوفر' : item.status === 'expected' ? 'متوقع نقصه' : 'متوفر الآن'}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">الشركة المنتجة</div>
                    <div className="text-xs font-black text-slate-700 dark:text-slate-300">{item.company}</div>
                  </div>
                  {item.expected_date && (
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">التوفر المتوقع</div>
                      <div className="text-xs font-black text-amber-600 dark:text-amber-400">{item.expected_date}</div>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">البدائل</div>
                    <div className="text-xs font-black text-blue-600 dark:text-blue-400">
                      {item.alternatives.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {item.alternatives.map((alt, i) => (
                            <span key={i}>{alt.name} ({alt.price}ج)</span>
                          ))}
                        </div>
                      ) : 'لا يوجد'}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                    <Clock size={10} />
                    <span>{item.last_updated}</span>
                  </div>
                  <button 
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-colors ${item.isNotified ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                  >
                    {item.isNotified ? 'تم التنبيه' : 'أبلغني عند التوفر'}
                  </button>
                </div>
              </MDiv>
            );
          }) : (
            <MDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <Filter size={32} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 font-black text-sm">لا توجد نتائج مطابقة</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">جرب البحث بكلمات مختلفة</p>
            </MDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
