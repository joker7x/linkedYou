
import React from 'react';
import { Home, MoreHorizontal, FileText, Package, Users, User, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppView } from '../types.ts';

interface BottomNavigationProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  restrictedPages?: string[];
  isAdmin?: boolean;
}

const tabs: { id: AppView; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'community', label: 'المجتمع', icon: Users },
  { id: 'shortages', label: 'المخزون', icon: Package },
  { id: 'settings', label: 'المزيد', icon: MoreHorizontal },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  currentView, 
  onNavigate, 
  restrictedPages = [],
  isAdmin = false
}) => {
  // Use any to bypass TypeScript errors for motion props
  const MDiv = motion.div as any;

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none print:hidden">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] px-2 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-around w-full max-w-[400px] border border-slate-200 dark:border-slate-800 pointer-events-auto overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          const isRestricted = !isAdmin && Array.isArray(restrictedPages) && restrictedPages.includes(tab.id);
          const Icon = tab.icon;
          
          return (
            <button 
              key={tab.id}
              onClick={() => handleNavClick(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-2xl transition-all duration-300 relative ${isActive ? 'text-blue-600 dark:text-blue-400' : isRestricted ? 'text-slate-300 dark:text-slate-700' : 'text-slate-400 dark:text-slate-500'}`}
            >
              <div className={`transition-all duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
                {isRestricted ? <Lock size={18} strokeWidth={2.5} /> : <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
              </div>
              <span className={`text-[9px] font-black tracking-tighter transition-all ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                {tab.label}
              </span>
              {isActive && (
                <MDiv 
                  layoutId="navIndicator"
                  className="absolute -top-1 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
