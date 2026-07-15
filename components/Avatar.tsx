import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { LOTTIE_AVATARS } from '../services/lottieData';

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
  isPremium?: boolean;
  premiumType?: 'rainbow' | 'gold' | 'neon' | 'none';
}

export const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  size = 90, 
  className = '', 
  isPremium = false, 
  premiumType = 'gold' 
}) => {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    setAnimationData(null); // Reset animation data when name changes
    
    // Handle old avatar IDs
    let resolvedName = name;
    if (name && !name.startsWith('avatar_')) {
      resolvedName = name.startsWith('f-') ? 'avatar_f_01' : 'avatar_m_01';
    }
    if (!resolvedName) {
      resolvedName = 'avatar_m_01';
    }

    const data = LOTTIE_AVATARS[resolvedName] || LOTTIE_AVATARS['avatar_m_01'];
    if (isMounted && data) {
      setAnimationData(data);
    }

    return () => {
      isMounted = false;
    };
  }, [name]);

  const getPremiumStyles = () => {
    if (!isPremium || premiumType === 'none') return '';
    switch(premiumType) {
      case 'gold': return 'before:absolute before:-inset-2 before:rounded-full before:border-2 before:border-amber-400 before:shadow-[0_0_15px_rgba(251,191,36,0.5)] before:animate-[spin_4s_linear_infinite]';
      case 'rainbow': return 'before:absolute before:-inset-2 before:rounded-full before:p-[2px] before:bg-gradient-to-tr before:from-red-500 before:via-blue-500 before:to-green-500 before:animate-[spin_3s_linear_infinite]';
      case 'neon': return 'before:absolute before:-inset-2 before:rounded-full before:border-2 before:border-cyan-400 before:shadow-[0_0_20px_rgba(34,211,238,0.8)] before:animate-[pulse_2s_ease-in-out_infinite]';
      default: return '';
    }
  };

  if (!animationData) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-slate-100 animate-pulse rounded-full relative ${getPremiumStyles()} ${className}`} 
      />
    );
  }

  return (
    <div 
      style={{ width: size, height: size }} 
      className={`relative rounded-full transition-transform duration-500 hover:scale-105 ${getPremiumStyles()} ${className}`}
    >
      <div className="w-full h-full rounded-full overflow-hidden relative z-10 bg-slate-50 dark:bg-slate-800">
        <Lottie 
          animationData={animationData} 
          loop={true} 
          autoplay={true} 
          style={{ width: '100%', height: '100%' }} 
        />
      </div>
    </div>
  );
};
