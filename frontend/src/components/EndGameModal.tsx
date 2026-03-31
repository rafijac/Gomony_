
import { useEffect, useRef } from 'react';
import './EndGameModal.css';
import ConfettiEffect from './ConfettiEffect';
// ...existing code...

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
  loss: 'You lost.',
  draw: 'Draw!',
  resign: 'You resigned.',
  timeout: 'You lost on time.',
  disconnect: 'Opponent disconnected.',
  abandoned: 'Game abandoned.',
  simultaneous: 'Game ended simultaneously.'
};

const outcomeIcons: Record<string, string> = {
  win: '🏆',
  loss: '⚔️',
  draw: '🤝',
  resign: '🏳️',
  timeout: '⏱️',
  disconnect: '🔌',
  abandoned: '🚫',
  simultaneous: '⚖️',
};

export default function EndGameModal({
  outcome,
  player,
  opponent,
  isSpectator,
  onRematch,
  onLobby,
  onReplay,
  onExit
}: EndGameModalProps) {
  // Use fallback for prefers-reduced-motion in test environment
  let prefersReducedMotion = false;
  try {
    prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    prefersReducedMotion = false;
  }
  const modalRef = useRef<HTMLDivElement>(null);

  // Accessibility: focus trap
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  // ...existing code...

  return (
    <div className="modal-backdrop endgame-modal-backdrop">
      {outcome === 'win' && !prefersReducedMotion && prefs.animation && <ConfettiEffect />}
      <div
        className={`modal endgame-modal responsive-modal${prefersReducedMotion ? ' reduced-motion' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="endgame-title"
        tabIndex={0}
        ref={modalRef}
        data-outcome={outcome}
        data-prefers-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
      >
        {/* Sound icon and mute button removed */}

        <div className="endgame-header">
          <div className="endgame-icon" aria-hidden="true">
            {outcomeIcons[outcome] || '🎲'}
          </div>
          <h2 id="endgame-title">
            {isSpectator
              ? `${player.displayName} vs ${opponent.displayName}`
              : outcomeMessages[outcome] || 'Game Over'}
          </h2>
          {isSpectator && outcomeMessages[outcome] && (
            <p className="endgame-outcome-spectator">{outcomeMessages[outcome]}</p>
          )}
        </div>

        <div className="endgame-body">
          <div className="endgame-players">
            <div className="player-info" data-winner={outcome === 'win' ? 'true' : 'false'}>
              <div className="avatar-ring" data-initials={player.avatarUrl ? undefined : (player.displayName.charAt(0).toUpperCase() || '?')}>
                <img
                  src={player.avatarUrl}
                  alt={player.displayName}
                  className="avatar"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    (e.currentTarget.parentElement as HTMLElement).setAttribute('data-initials', player.displayName.charAt(0).toUpperCase() || '?');
                  }}
                  style={{ display: player.avatarUrl ? undefined : 'none' }}
                />
              </div>
              <span>{player.displayName}</span>
            </div>
            <div className="vs-divider"><span>vs</span></div>
            <div className="player-info" data-winner={outcome === 'loss' ? 'true' : 'false'}>
              <div className="avatar-ring" data-initials={opponent.avatarUrl ? undefined : (opponent.displayName.charAt(0).toUpperCase() || '?')}>
                <img
                  src={opponent.avatarUrl}
                  alt={opponent.displayName}
                  className="avatar"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    (e.currentTarget.parentElement as HTMLElement).setAttribute('data-initials', opponent.displayName.charAt(0).toUpperCase() || '?');
                  }}
                  style={{ display: opponent.avatarUrl ? undefined : 'none' }}
                />
              </div>
              <span>{opponent.displayName}</span>
            </div>
          </div>

          <div className="endgame-actions" style={{ marginTop: '2.2rem' }}>
            {!isSpectator && onRematch && <button className="btn-primary" onClick={onRematch}>Rematch</button>}
            {!isSpectator && onLobby && <button className="btn-secondary" onClick={onLobby}>Return to Lobby</button>}
            {onReplay && <button className="btn-secondary" onClick={onReplay}>View Replay</button>}
            {onExit && <button className="btn-exit" onClick={onExit}>Exit</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
