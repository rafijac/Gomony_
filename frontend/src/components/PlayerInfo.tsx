import React from 'react';

interface PlayerInfoProps {
  name: string;
  avatarUrl: string;
  fallbackName?: string;
  fallbackAvatar?: string;
}

export default function PlayerInfo({ name, avatarUrl, fallbackName = 'Player', fallbackAvatar = '/assets/avatars/avatar1.png' }: PlayerInfoProps) {
  return (
    <div className="player-info" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <img
        src={avatarUrl || fallbackAvatar}
        alt={name || fallbackName}
        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ccc' }}
        onError={(e) => { (e.target as HTMLImageElement).src = fallbackAvatar; }}
      />
      <span style={{ fontWeight: 600 }}>{name || fallbackName}</span>
    </div>
  );
}
