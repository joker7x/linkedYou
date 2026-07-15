import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export type PopUpTheme = 'minimal' | 'vibrant' | 'action';

export const PopUpPreview: React.FC<{ theme: PopUpTheme; title: string; message: string; onClose?: () => void }> = ({ theme, title, message, onClose }) => {
  const themes = {
    minimal: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-xl",
    vibrant: "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[32px] p-8 shadow-2xl",
    action: "bg-white dark:bg-slate-900 border-t-8 border-blue-600 rounded-[24px] p-6 shadow-2xl"
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`${themes[theme]} relative`}>
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 opacity-60 hover:opacity-100 hover:bg-black/10 rounded-full transition-all">
            <X size={16} />
        </button>
      )}
      <h2 className="text-xl font-black mb-2">{title}</h2>
      <p className="text-sm opacity-90">{message}</p>
    </motion.div>
  );
};

