
import { useEffect, useRef } from 'react';
import './EndGameModal.css';
import ConfettiEffect from './ConfettiEffect';
import useSoundEffect from './useSoundEffect';
import { usePreferences } from '../hooks/usePreferences';

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

const feedbackIcons: Record<string, string> = {
  draw: '🤝',
  resign: '🏳️',
  timeout: '⏰',
  disconnect: '🔌',
  abandoned: '🚫',
  simultaneous: '⚖️',
  loss: '😞'
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
  const [prefs, setPrefs] = usePreferences();
  // Use fallback for prefers-reduced-motion in test environment
  let prefersReducedMotion = false;
  try {
    prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    prefersReducedMotion = false;
  }
  const modalRef = useRef<HTMLDivElement>(null);
  const playSound = useSoundEffect();

  // Accessibility: focus trap
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  // Play sound and show confetti on win
  useEffect(() => {
    if (outcome === 'win' && prefs.sound && !prefersReducedMotion) {
      playSound();
    }
  }, [outcome, prefs.sound, prefersReducedMotion, playSound]);

  // Mute toggle
  const handleMute = () => setPrefs({ ...prefs, sound: !prefs.sound });

  return (
    <div className="modal-backdrop endgame-modal-backdrop">
      <div
        className={`modal endgame-modal responsive-modal${prefersReducedMotion ? ' reduced-motion' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="endgame-title"
        tabIndex={0}
        ref={modalRef}
        data-prefers-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
      >
        <h2 id="endgame-title">
          {isSpectator
            ? `${player.displayName} vs ${opponent.displayName}`
            : outcomeMessages[outcome] || 'Game Over'}
        </h2>
        {isSpectator && outcomeMessages[outcome] && (
          <p className="endgame-outcome-spectator">{outcomeMessages[outcome]}</p>
        )}
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
        {/* Celebratory/feedback effects */}
        {outcome === 'win' && !prefersReducedMotion && prefs.animation && <ConfettiEffect />}
        {outcome !== 'win' && (
          <div data-testid="endgame-feedback" className="endgame-feedback">
            <span className="feedback-icon" aria-label={outcome}>{feedbackIcons[outcome] || '🎲'}</span>
          </div>
        )}
        {/* Mute button for accessibility */}
        <button
          data-testid="mute-sound"
          className="mute-sound-btn"
          aria-label={prefs.sound ? 'Mute sound' : 'Unmute sound'}
          onClick={handleMute}
        >
          {prefs.sound ? '🔊' : '🔇'}
        </button>
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
