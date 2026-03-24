
import React, { useEffect } from 'react';
import { GameProvider, useGame } from './components/GameContext';
import GameBoard from './components/GameBoard';
import ModeSelectModal from './components/ModeSelectModal';
import { setSessionToken } from './api';
import LobbyModal from './components/LobbyModal';
import Notification from './components/Notification';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// AppContent is separated so it can use the GameContext
function AppContent() {
  const { gameMode, setGameMode, sessionToken, setMultiplayerSession, resetGame, lastMessage, sessionExpired } = useGame();
  const [showModeModal, setShowModeModal] = React.useState(true);
  const [showLobby, setShowLobby] = React.useState(false);

  // Propagate session token to API module
  useEffect(() => {
    setSessionToken(sessionToken || null);
  }, [sessionToken]);

  // Show mode selection modal at game start
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

  // Multiplayer lobby handlers
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

  // Handler for clicking the Gomony icon to return to lobby
  const handleGomonyClick = () => {
    setShowModeModal(true);
    setShowLobby(false);
  };

  return (
    <div className="app-wrapper">
      <div className="gomony-banner">
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
        <div className="gomony-banner-info">
          <div className="gomony-banner-company">GOMONY</div>
          <div className="gomony-banner-address">9011 Cliffwood Drive &bull; Houston, Texas 77096</div>
          <div className="gomony-banner-copyright">COPYRIGHT 1979 &nbsp; Harvey S. Klein &nbsp; Patent Pending</div>
        </div>
      </div>
      {/* Notification for errors and session expiration (REMOVED: now only in sidebar) */}
      {showModeModal && <ModeSelectModal onSelect={handleSelect} showMultiplayer />}
      {showLobby && <LobbyModal onCreate={handleCreate} onJoin={handleJoin} onCancel={handleCancelLobby} />}
      {/* Show game code if in multiplayer mode and gameId is set */}
      {!showModeModal && !showLobby && (
        <>
          {gameMode === 'MP' && (
            <div style={{ textAlign: 'center', margin: '1rem 0', color: '#1dbf6a', fontWeight: 600 }}>
              Share this game code: <span style={{ fontFamily: 'monospace', fontSize: '1.2em' }}>{useGame().gameId}</span>
            </div>
          )}
          <GameBoard />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </GameProvider>
  );
}
