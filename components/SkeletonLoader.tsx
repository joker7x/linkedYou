import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="premium-card p-5 rounded-[28px] border border-slate-100 dark:border-white/5 relative overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
      <div className="animate-pulse flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-slate-100 dark:bg-zinc-800 rounded-lg w-3/4" />
            <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded-lg w-1/2" />
          </div>
          <div className="w-11 h-11 rounded-[18px] bg-slate-100 dark:bg-zinc-800 shrink-0" />
        </div>
        <div className="mt-2 flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-7 bg-slate-100 dark:bg-zinc-800 rounded-lg w-20" />
            <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded-lg w-12" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />
            <div className="h-8 w-8 bg-slate-100 dark:bg-zinc-800 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};