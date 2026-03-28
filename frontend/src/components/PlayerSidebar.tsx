import React, { useState } from 'react';
import { PlayerCard } from './PlayerCard';
import ConfirmModal from './ConfirmModal';

interface PlayerSidebarProps {
  currentPlayer: number;
  gameMode: string;
  isThinking: boolean;
  lastMessage: string;
  pendingJump: [number, number] | null;
  onRestart: () => void;
  Tooltip?: React.ComponentType<any>;
}

const P1 = { label: 'Player 1', topColor: '#f0f0f0', bottomColor: '#1dbf6a' };
const P2_HUMAN = { label: 'Player 2', topColor: '#c4702e', bottomColor: '#1a1a1a' };
const P2_PC    = { label: 'PC',       topColor: '#c4702e', bottomColor: '#1a1a1a' };

export default function PlayerSidebar({
  currentPlayer, gameMode, isThinking, lastMessage, pendingJump, onRestart, Tooltip
}: PlayerSidebarProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const p2Info = gameMode === 'PC' ? P2_PC : P2_HUMAN;

  const restartBtn = (
    <button
      className="restart-btn"
      onClick={() => setShowConfirm(true)}
      disabled={isThinking}
      role="button"
      aria-label="Restart Game"
    >
      Restart Game
    </button>
  );

  return (
    <div className="player-sidebar">
      <PlayerCard {...P1} isActive={currentPlayer === 1} Tooltip={Tooltip} />
      <PlayerCard {...p2Info} isActive={currentPlayer === 2} isPC={gameMode === 'PC' && currentPlayer === 2} Tooltip={Tooltip} />
      {Tooltip ? (
        <Tooltip content="Restart the game from the initial state." ariaLabel="restart">
          {restartBtn}
        </Tooltip>
      ) : restartBtn}
      <ConfirmModal
        open={showConfirm}
        title="Restart Game?"
        message="Are you sure you want to restart the game? This will reset the board and erase all progress."
        confirmLabel="Restart"
        cancelLabel="Cancel"
        onConfirm={() => { setShowConfirm(false); onRestart(); }}
        onCancel={() => setShowConfirm(false)}
      />
      {lastMessage && (
        <div className="status-message" style={/unauthorized/i.test(lastMessage) ? { color: '#ff4d4f', fontWeight: 'bold' } : {}}>
          {lastMessage}
        </div>
      )}
      {pendingJump && (
        <div className="status-message" style={{ color: '#f0a500' }}>Jump again!</div>
      )}
      {gameMode === 'PC' && isThinking && (
        <div className="pc-thinking-indicator">PC is thinking...</div>
      )}
    </div>
  );
}
