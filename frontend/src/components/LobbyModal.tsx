import { useState } from 'react';
import './LobbyModal.css';

interface LobbyModalProps {
  onCreate: (gameId: string, sessionToken: string, playerNumber: number, orientation: 'south' | 'north') => void;
  onJoin: (gameId: string, sessionToken: string, playerNumber: number, orientation: 'south' | 'north') => void;
  onCancel: () => void;
}

export default function LobbyModal({ onCreate, onJoin, onCancel }: LobbyModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8001/game/create', { method: 'POST' });
      const data = await res.json();
      if (data.game_id && data.session_token && data.player_number && data.orientation) {
        onCreate(data.game_id, data.session_token, data.player_number, data.orientation);
      } else {
        setError('Failed to create game.');
      }
    } catch (e) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) {
      setError('Enter a game code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8001/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: joinCode.trim() })
      });
      const data = await res.json();
      if (res.ok && data.game_id && data.session_token && data.player_number && data.orientation) {
        onJoin(data.game_id, data.session_token, data.player_number, data.orientation);
      } else {
        setError(data.error || 'Failed to join game.');
      }
    } catch (e) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Multiplayer Lobby</h2>
        <button className="modal-btn" onClick={handleCreate} disabled={loading}>
          Create New Game
        </button>
        <div className="join-section">
          <input
            type="text"
            placeholder="Enter game code to join"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            disabled={loading}
          />
          <button className="modal-btn" onClick={handleJoin} disabled={loading}>
            Join Game
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <button className="modal-btn cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
}
