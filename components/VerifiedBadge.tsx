import React from 'react';
import { motion } from 'motion/react';

export const VerifiedBadge = ({ size = 20, className = "" }: { size?: number, className?: string }) => {
  return (
    <motion.div 
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative inline-flex items-center justify-center ${className} bg-white dark:bg-slate-900 rounded-full p-[1px]`}
      style={{ width: size + 4, height: size + 4 }}
    >
      <svg 
        viewBox="0 0 24 24" 
        className="relative z-10 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.2)]"
        width={size} 
        height={size}
      >
        <defs>
          <linearGradient id="facebookVerifyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2D88FF" />
            <stop offset="100%" stopColor="#1877F2" />
          </linearGradient>
        </defs>
        {/* High-fidelity 12-petal scalloped badge background */}
        <path 
          fill="url(#facebookVerifyGradient)" 
          d="M22.5 12c0-1.5-1-2.9-2.3-3.6.4-1.4.2-3-.7-4.1s-2.4-1.5-3.9-1c-.9-1.2-2.4-2-4.1-2s-3.2.8-4.1 2c-1.5-.5-3.1-.1-4 .9s-1.1 2.5-.7 3.9C1.3 9.1.3 10.5.3 12s1 2.9 2.3 3.6c-.4 1.4-.2 3 .7 4.1s2.4 1.5 3.9 1c.9 1.2 2.4 2 4.1 2s3.2-.8 4.1-2c1.5.5 3.1.1 4-.9s1.1-2.5.7-3.9c1.4-.7 2.4-2.1 2.4-3.6z"
        />
        {/* Rounded, bold Facebook-style checkmark */}
        <path 
          fill="none"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 12.5l2.5 2.5 6.5-6.5" 
        />
      </svg>
    </motion.div>
  );
};
