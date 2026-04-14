
import React from 'react';
import { TabMode } from '../types';
import { LayoutGrid, TrendingUp, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface TabFilterProps { current: TabMode; onChange: (mode: TabMode) => void; }

const tabs: { id: TabMode; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'الكل', icon: <LayoutGrid size={18} /> },
  { id: 'changed', label: 'تغييرات', icon: <TrendingUp size={18} /> },
  { id: 'fav', label: 'المفضلة', icon: <Star size={18} /> },
];

export const TabFilter: React.FC<TabFilterProps> = React.memo(({ current, onChange }) => {
  // Use any to bypass TypeScript errors for motion props
  const MDiv = motion.div as any;

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-[28px] p-1.5 flex items-center border border-slate-200 dark:border-slate-800 shadow-sm">
      {tabs.map((tab) => {
        const isActive = current === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[22px] transition-all duration-200 relative ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            {isActive && (
              <MDiv
                layoutId="activeTabPill"
                className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-[22px] border border-blue-100 dark:border-blue-800/50"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <span className={`transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {tab.icon}
              </span>
              <span className={`text-[12px] ${isActive ? 'font-black' : 'font-bold'}`}>{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});
