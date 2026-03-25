
import { useEffect, useState } from 'react';
import { GameProvider, useGame } from './components/GameContext';
import GameBoard from './components/GameBoard';
import ModeSelectModal from './components/ModeSelectModal';
import { setSessionToken } from './api';
import LobbyModal from './components/LobbyModal';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <GameProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </GameProvider>
  );
}

export default App;

function AppContent() {
  const { gameMode, setGameMode, sessionToken, setMultiplayerSession, resetGame, gameId } = useGame();
  const [showModeModal, setShowModeModal] = useState(true);
  const [showLobby, setShowLobby] = useState(false);
  // ...existing code...

  useEffect(() => {
    setSessionToken(sessionToken || null);
  }, [sessionToken]);

  const handleSelect = (mode: '2P' | 'PC' | 'MP') => {
    if (mode === 'MP') {
      setShowLobby(true);
      setShowModeModal(false);
    } else {
      resetGame();
      setGameMode(mode);
      setShowModeModal(false);
    }
  };

  const handleCreate = (gameId: string, sessionToken: string, playerNumber: number, orientation: 'south' | 'north') => {
    setMultiplayerSession({ gameId, sessionToken, playerNumber, orientation });
    setShowLobby(false);
    setShowModeModal(false);
  };
  const handleJoin = (gameId: string, sessionToken: string, playerNumber: number, orientation: 'south' | 'north') => {
    setMultiplayerSession({ gameId, sessionToken, playerNumber, orientation });
    setShowLobby(false);
    setShowModeModal(false);
  };
  const handleCancelLobby = () => {
    setShowLobby(false);
    setShowModeModal(true);
  };

  const handleGomonyClick = () => {
    setShowModeModal(true);
    setShowLobby(false);
  };

  const isPlaying = !showModeModal && !showLobby;

  return (
    <div className="app-wrapper">
      <div className="app-top-bar">
        <div className="gomony-banner gomony-banner--compact">
          <div
            className="gomony-banner-logo-box"
            style={{ cursor: 'pointer' }}
            title="Back to Lobby"
            onClick={handleGomonyClick}
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleGomonyClick(); }}
            role="button"
            aria-label="Back to Lobby"
          >
            <span className="gomony-banner-title">GOMONY<sup className="gomony-copyright-sup">©</sup></span>
          </div>
        </div>
        {/* ...existing code... */}
      </div>
      {showModeModal && <ModeSelectModal onSelect={handleSelect} showMultiplayer />}
      {showLobby && <LobbyModal onCreate={handleCreate} onJoin={handleJoin} onCancel={handleCancelLobby} />}
      {isPlaying && (
        <>
          {gameMode === 'MP' && (
            <div style={{ textAlign: 'center', margin: '0.5rem 0', color: '#7a2418', fontWeight: 600 }}>
              Share this game code: <span style={{ fontFamily: 'monospace', fontSize: '1.2em' }}>{gameId}</span>
            </div>
          )}
          <GameBoard />
        </>
      )}
      {/* HelpModal removed */}
      <footer className="app-footer">
        <span className="app-footer-name">GOMONY</span>
        <span className="app-footer-sep">&bull;</span>
        <span>9011 Cliffwood Drive &bull; Houston, Texas 77096</span>
        <span className="app-footer-sep">&bull;</span>
        <span>COPYRIGHT 1979 &nbsp; Harvey S. Klein &nbsp; Patent Pending</span>
      </footer>
    </div>
  );
}
