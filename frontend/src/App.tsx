
import React, { useEffect } from 'react';
import { GameProvider, useGame } from './components/GameContext';
import GameBoard from './components/GameBoard';
import ModeSelectModal from './components/ModeSelectModal';
import { setSessionToken } from './api';
import LobbyModal from './components/LobbyModal';
// import Notification from './components/Notification';
import ErrorBoundary from './components/ErrorBoundary';
import HelpModal from './components/HelpModal';
import Tooltip from './components/Tooltip';
import './App.css';

// AppContent is separated so it can use the GameContext
function AppContent() {
  const { gameMode, setGameMode, sessionToken, setMultiplayerSession, resetGame, gameId } = useGame();
  const [showModeModal, setShowModeModal] = React.useState(true);
  const [showLobby, setShowLobby] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [onboarded, setOnboarded] = React.useState(() => localStorage.getItem('gomony_onboarded') === '1');

  // Propagate session token to API module
  useEffect(() => {
    setSessionToken(sessionToken || null);
  }, [sessionToken]);

  // Show onboarding overlay for first-time users
  useEffect(() => {
    if (!onboarded && !showModeModal && !showLobby) {
      // Show onboarding overlay
      setShowHelp(true);
      localStorage.setItem('gomony_onboarded', '1');
      setOnboarded(true);
    }
  }, [onboarded, showModeModal, showLobby]);

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
        <Tooltip
          content="Show help and rules"
          ariaLabel="help"
          dismissKey="help_btn"
          disableAfterFirstUse={true}
        >
          <button
            className="help-btn"
            aria-label="help"
            style={{ marginLeft: 16, fontSize: '1.5rem', background: 'none', border: 'none', color: '#ffe082', cursor: 'pointer' }}
            onClick={() => setShowHelp(true)}
          >
            <span aria-label="help icon" role="img">❓</span>
          </button>
        </Tooltip>
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
          <GameBoard Tooltip={Tooltip} />
        </>
      )}
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
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

export default function App() {
  return (
    <GameProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </GameProvider>
  );
}
