import { useState } from 'react';
import { api } from '../api';
import './LobbyModal.css';
import AvatarSelector from './AvatarSelector';
import { AVATAR_PRESETS } from '../assets/avatars/presets';

interface LobbyModalProps {
  onCreate: (gameId: string, sessionToken: string, playerNumber: number, orientation: 'south' | 'north') => void;
  onJoin: (gameId: string, sessionToken: string, playerNumber: number, orientation: 'south' | 'north') => void;
  onCancel: () => void;
  editingLocked?: boolean;
}

export default function LobbyModal({ onCreate, onJoin, onCancel, editingLocked = false }: LobbyModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [playerName, setPlayerName] = useState('');

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/game/create');
      const data = res.data;
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
      const res = await api.post('/game/join', { game_id: joinCode.trim() }).catch((err) => err?.response ?? null);
      const data = res?.data;
      if (res?.status < 400 && data?.game_id && data?.session_token && data?.player_number && data?.orientation) {
        onJoin(data.game_id, data.session_token, data.player_number, data.orientation);
      } else {
        setError(data?.error || 'Failed to join game.');
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
        <div className="lobby-profile-section">
          <AvatarSelector value={selectedAvatar} onChange={setSelectedAvatar} editingLocked={editingLocked} />
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            disabled={editingLocked || loading}
            aria-label="Display name"
          />
        </div>
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
