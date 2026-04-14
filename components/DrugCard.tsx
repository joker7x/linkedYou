
import React, { memo } from 'react';
import { Drug } from '../types.ts';
import { Pill, ArrowUpRight, TrendingDown, ChevronLeft, Calendar, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface DrugCardProps {
  drug: Drug;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenInfo: (drug: Drug) => void;
  index: number;
}

const dateFormatter = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' });

export const DrugCard = memo(React.forwardRef<HTMLDivElement, DrugCardProps>(({ drug, isFavorite, onToggleFavorite, onOpenInfo, index }, ref) => {
  const MDiv = motion.div as any;
  const pNew = drug.price_new !== null ? Number(drug.price_new) : null;
  const pOld = drug.price_old !== null ? Number(drug.price_old) : null;
  const hasPriceChange = pNew !== null && pOld !== null && pNew !== pOld;
  const isIncrease = hasPriceChange && pNew! > pOld!;
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'محدث الآن';
    const date = new Date(dateStr);
    return dateFormatter.format(date);
  };

  return (
    <MDiv 
      ref={ref}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.2) }}
      onClick={() => onOpenInfo(drug)}
      className="active:scale-[0.98] transition-all cursor-pointer group"
    >
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{drug.company}</span>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">#{index + 1}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-blue-600 transition-colors">
              {drug.name_en}
            </h3>
            <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
              {drug.name_ar || '---'}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${hasPriceChange ? (isIncrease ? 'bg-red-50 border-red-100 text-red-500' : 'bg-emerald-50 border-emerald-100 text-emerald-500') : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
              <Pill size={24} />
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(drug.drug_no);
              }}
              className={`p-2 rounded-xl transition-all ${isFavorite ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600'}`}
            >
              <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between mt-6">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{pNew?.toFixed(2) || '--'}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase">EGP</span>
            </div>
            {hasPriceChange && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-slate-300 line-through">{pOld?.toFixed(2)}</span>
                <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-0.5 ${isIncrease ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                   {isIncrease ? <ArrowUpRight size={10} /> : <TrendingDown size={10} />}
                   {pOld && pNew ? `${Math.abs(((pNew - pOld) / pOld) * 100).toFixed(0)}%` : ''}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center gap-2">
                <Calendar size={12} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{formatDate(drug.api_updated_at)}</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:translate-x-[-4px] transition-transform">
                <ChevronLeft size={20} />
             </div>
          </div>
        </div>
      </div>
    </MDiv>
  );
}));
