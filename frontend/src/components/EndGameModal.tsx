import React from 'react';
import './EndGameModal.css';

interface PlayerInfo {
  userId: string;
  displayName: string;
  avatarUrl: string;
  role: 'player' | 'spectator' | 'AI';
}

interface EndGameModalProps {
  outcome: 'win' | 'loss' | 'draw' | 'resign' | 'timeout' | 'disconnect' | 'abandoned' | 'simultaneous';
  customMessage?: string;
  player: PlayerInfo;
  opponent: PlayerInfo;
  isSpectator: boolean;
  onRematch?: () => void;
  onLobby?: () => void;
  onReplay?: () => void;
  onExit?: () => void;
}

const outcomeMessages: Record<string, string> = {
  win: 'You win!',
  loss: 'You lose.',
  draw: 'Draw!',
  resign: 'You resigned.',
  timeout: 'You lost by timeout.',
  disconnect: 'Opponent disconnected.',
  abandoned: 'Game abandoned.',
  simultaneous: 'Game ended simultaneously.'
};

export default function EndGameModal({
  outcome,
  customMessage,
  player,
  opponent,
  isSpectator,
  onRematch,
  onLobby,
  onReplay,
  onExit
}: EndGameModalProps) {
  return (
    <div className="modal-backdrop endgame-modal-backdrop">
      <div className="modal endgame-modal" role="dialog" aria-modal="true" aria-labelledby="endgame-title">
        <h2 id="endgame-title">
          {isSpectator
            ? `${player.displayName} vs ${opponent.displayName}`
            : outcomeMessages[outcome] || 'Game Over'}
        </h2>
        <div className="endgame-players">
          <div className="player-info">
            <img src={player.avatarUrl} alt={player.displayName} className="avatar" />
            <span>{player.displayName}</span>
          </div>
          <span className="vs">vs</span>
          <div className="player-info">
            <img src={opponent.avatarUrl} alt={opponent.displayName} className="avatar" />
            <span>{opponent.displayName}</span>
          </div>
        </div>
        {customMessage && <div className="endgame-custom-message">{customMessage}</div>}
        <div className="endgame-actions">
          {!isSpectator && onRematch && <button onClick={onRematch}>Rematch</button>}
          {!isSpectator && onLobby && <button onClick={onLobby}>Return to Lobby</button>}
          {onReplay && <button onClick={onReplay}>View Replay</button>}
          {onExit && <button onClick={onExit}>Exit</button>}
        </div>
      </div>
    </div>
  );
}
