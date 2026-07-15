import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface CoachMarkProps {
  isVisible: boolean;
  onClose: () => void;
  targetId: string;
}

export const CoachMark: React.FC<CoachMarkProps> = ({ isVisible, onClose, targetId }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible) {
      const target = document.getElementById(targetId);
      if (target) {
        const rect = target.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX + rect.width / 2,
        });
      }
    }
  }, [isVisible, targetId]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          className="absolute bg-[#2563eb] text-white p-4 rounded-[24px] shadow-2xl flex items-center gap-3"
          style={{
            top: position.top - 80,
            left: position.left,
            transform: 'translateX(-50%)',
          }}
        >
          <span className="font-bold text-sm">هنا مجتمع الدواء 👥</span>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={16} />
          </button>
          {/* Arrow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#2563eb] rotate-45" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
