import React, { useState } from 'react';
import { Avatar } from './Avatar';

const MALE_AVATARS = Array.from({ length: 10 }, (_, i) => `avatar_m_${String(i + 1).padStart(2, '0')}`);
const FEMALE_AVATARS = Array.from({ length: 9 }, (_, i) => `avatar_f_${String(i + 1).padStart(2, '0')}`);

interface AvatarPickerProps {
  onSelect?: (avatarName: string) => void;
  selectedAvatar?: string;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ onSelect, selectedAvatar }) => {
  const [activeTab, setActiveTab] = useState<'male' | 'female'>('male');
  const [selected, setSelected] = useState<string>(selectedAvatar || MALE_AVATARS[0]);

  const avatars = activeTab === 'male' ? MALE_AVATARS : FEMALE_AVATARS;

  const handleSelect = (name: string) => {
    setSelected(name);
    if (onSelect) {
      onSelect(name);
    }
  };

  const formatName = (name: string) => {
    const num = name.split('_')[2];
    return `${activeTab === 'male' ? 'Male' : 'Female'} ${parseInt(num, 10)}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Preview Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-40 h-40 rounded-full border-4 border-indigo-100 overflow-hidden flex items-center justify-center bg-slate-50 mb-4 shadow-inner">
          <Avatar name={selected} size={160} />
        </div>
        <h3 className="text-xl font-semibold text-slate-800">
          {formatName(selected)}
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex w-full mb-6 bg-slate-100 p-1.5 rounded-xl">
        <button
          onClick={() => setActiveTab('male')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === 'male' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          Male
        </button>
        <button
          onClick={() => setActiveTab('female')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === 'female' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          Female
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4 w-full overflow-y-auto max-h-[320px] p-2 custom-scrollbar">
        {avatars.map((name) => (
          <button
            key={name}
            onClick={() => handleSelect(name)}
            className={`relative flex items-center justify-center p-2 rounded-2xl transition-all duration-200 ${
              selected === name 
                ? 'border-2 border-indigo-500 bg-indigo-50 shadow-md scale-105' 
                : 'border-2 border-transparent hover:bg-slate-50 hover:scale-105 hover:shadow-sm'
            }`}
          >
            <Avatar name={name} size={90} />
          </button>
        ))}
      </div>
    </div>
  );
};
