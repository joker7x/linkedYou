import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { LOTTIE_AVATARS } from '../services/lottieData';

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 90, className = '' }) => {
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

  if (!animationData) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-slate-100 animate-pulse rounded-full ${className}`} 
      />
    );
  }

  return (
    <div style={{ width: size, height: size }} className={className}>
      <Lottie 
        animationData={animationData} 
        loop={true} 
        autoplay={true} 
        style={{ width: '100%', height: '100%' }} 
      />
    </div>
  );
};
