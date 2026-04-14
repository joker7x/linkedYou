import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

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

    fetch(`/avatars/${resolvedName}.json`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        const text = await res.text();
        if (text.startsWith('<')) {
          throw new Error('Received HTML instead of JSON');
        }
        return JSON.parse(text);
      })
      .then((data) => {
        if (isMounted) {
          setAnimationData(data);
        }
      })
      .catch((err) => {
        console.error(`Failed to load avatar ${resolvedName}:`, err);
        // Fallback to default avatar if loading fails
        if (resolvedName !== 'avatar_m_01') {
          fetch(`/avatars/avatar_m_01.json`)
            .then(res => res.json())
            .then(data => {
              if (isMounted) setAnimationData(data);
            })
            .catch(e => console.error('Failed to load fallback avatar', e));
        }
      });

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
