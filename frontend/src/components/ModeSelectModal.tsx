import { useState } from 'react';
import './ModeSelectModal.css';

interface ModeSelectModalProps {
  onSelect: (mode: '2P' | 'PC' | 'MP') => void;
  showMultiplayer?: boolean;
}

/**
 * ModeSelectModal
 * Modal dialog for selecting game mode (2 Player, PC, or Multiplayer).
 */
export default function ModeSelectModal({ onSelect, showMultiplayer }: ModeSelectModalProps) {
  const [selected, setSelected] = useState<'2P' | 'PC' | 'MP'>('2P');

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Select Game Mode</h2>
        <div className="mode-options">
          <label>
            <input
              type="radio"
              name="mode"
              value="2P"
              checked={selected === '2P'}
              onChange={() => setSelected('2P')}
            />
            2 Player (Local)
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="PC"
              checked={selected === 'PC'}
              onChange={() => setSelected('PC')}
            />
            PC Mode (vs AI)
          </label>
          {showMultiplayer ? (
            <label>
              <input
                type="radio"
                name="mode"
                value="MP"
                checked={selected === 'MP'}
                onChange={() => setSelected('MP')}
              />
              Multiplayer (Online)
            </label>
          ) : null}
        </div>
        <button className="modal-btn" onClick={() => onSelect(selected)}>
          Start Game
        </button>
      </div>
    </div>
  );
}
