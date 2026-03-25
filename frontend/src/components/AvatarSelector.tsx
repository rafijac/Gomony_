import React from 'react';
import { AVATAR_PRESETS } from '../assets/avatars/presets';

interface AvatarSelectorProps {
  value: string;
  onChange: (url: string) => void;
}

export default function AvatarSelector({ value, onChange }: AvatarSelectorProps) {
  return (
    <div className="avatar-selector">
      {AVATAR_PRESETS.map((url) => (
        <img
          key={url}
          src={url}
          alt="Avatar"
          className={value === url ? 'selected' : ''}
          onClick={() => onChange(url)}
          style={{ width: 48, height: 48, borderRadius: '50%', margin: 4, border: value === url ? '2px solid #007bff' : '2px solid transparent', cursor: 'pointer' }}
        />
      ))}
    </div>
  );
}
