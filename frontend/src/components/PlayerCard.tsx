import React from 'react';

interface PlayerCardProps {
  label: string;
  topColor: string;
  bottomColor: string;
  isActive: boolean;
  isPC?: boolean;
  Tooltip?: React.ComponentType<any>;
}

export function PlayerCard({ label, topColor, bottomColor, isActive, isPC, Tooltip }: PlayerCardProps) {
  const card = (
    <div className={`player-card${isActive ? ' active' : ''}`}>
      <span className="player-card-label">{label}</span>
      <div className="player-swatch">
        <div className="player-swatch-top" style={{ background: topColor }} />
        <div className="player-swatch-bottom" style={{ background: bottomColor }} />
      </div>
      {isActive && (
        <span className="player-card-turn">{isPC ? 'Thinking...' : 'Your Turn'}</span>
      )}
    </div>
  );
  if (Tooltip) {
    return (
      <Tooltip content="Player info. The highlighted player moves next." ariaLabel="player info">
        {card}
      </Tooltip>
    );
  }
  return card;
}
