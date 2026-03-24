
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from './GameContext';
import Stack from './Stack';
import { useNavigate } from 'react-router-dom';
// Animation duration for AI piece movement (ms)
export const AI_MOVE_ANIMATION_DURATION = 1200;

import './GameBoard.css';


/**
 * GameBoard handles board rendering, user moves, and PC mode AI integration.
 */
export default function GameBoard() {
  const {
    board,
    moveStack,
    triggerAIMove,
    resetGame,
    lastMessage,
    currentPlayer,
    pendingJump,
    gameMode,
    isThinking,
    orientation,
    playerNumber,
    sessionExpired,
    setSessionExpired,
  } = useGame();
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const navigate = useNavigate ? useNavigate() : (() => {});

  // ── Dynamic board sizing ──────────────────────────────────────────────────
  // rotateX(42deg) + perspective(1100px) causes the board's visual bottom to
  // appear LOWER than its CSS height. Exact formula:
  //   visual_height = H * cos(θ) * P / (P − H * sin(θ))
  // Inverted to find the CSS H that fits a given available_height:
  //   H = avail * P / (P * cos(θ) + avail * sin(θ))
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const [boardPx, setBoardPx] = useState(480);

  useEffect(() => {
    const el = boardAreaRef.current;
    if (!el) return;
    const P = 1100;
    const theta = 42 * Math.PI / 180;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      const availH = height - 32; // buffer for near-edge bottom border
      const fromH = (availH * P) / (P * cosT + availH * sinT);
      const fromW = width * 0.97;
      setBoardPx(Math.max(200, Math.min(fromH, fromW)));
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  // Returns true if the cell at (x, y) is the mandatory piece to move during multi-jump
  const isPendingCell = (x: number, y: number) =>
    pendingJump !== null && pendingJump[0] === y && pendingJump[1] === x;

  // Returns true if the player can select a cell (owns the top piece)
  const canSelect = (x: number, y: number): boolean => {
    const stack = board[y][x];
    if (!stack.length) return false;
    const top = stack[stack.length - 1];
    // In PC mode, only player 1's pieces are selectable
    if (gameMode === 'PC' && (top === 2 || top === 4)) return false;
    // In MP mode, only allow moves for your own pieces and only on your turn
    if (gameMode === 'MP') {
      if (!playerNumber) return false;
      const own = playerNumber === 1 ? [1, 3] : [2, 4];
      if (!own.includes(top)) return false;
      // Only allow moves if it's your turn
      if (currentPlayer !== playerNumber) return false;
    }
    // During a multi-jump, only the pending piece is selectable
    if (pendingJump && !isPendingCell(x, y)) return false;
    return true;
  };

  const handleCellClick = async (x: number, y: number) => {
    if (isThinking) return;

    if (selected) {
      if (selected.x === x && selected.y === y) {
        setSelected(null);
        return;
      }
      // Attempt the move
      const result = await moveStack({ x: selected.x, y: selected.y }, { x, y });
      setSelected(null);
      // Trigger AI if it's now player 2's turn, no pending jump, and in PC mode
      if (result?.valid && !result.pendingJump && result.currentPlayer === 2 && gameMode === 'PC') {
        await triggerAIMove();
      }
    } else if (canSelect(x, y)) {
      setSelected({ x, y });
    }
  };

  const handleDragStart = (fromX: number, fromY: number) => (e: React.DragEvent) => {
    if (isThinking || !canSelect(fromX, fromY)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('fromX', String(fromX));
    e.dataTransfer.setData('fromY', String(fromY));
  };

  const handleDrop = (toX: number, toY: number) => async (e: React.DragEvent) => {
    if (isThinking) return;
    const fromX = parseInt(e.dataTransfer.getData('fromX'));
    const fromY = parseInt(e.dataTransfer.getData('fromY'));
    if (!isNaN(fromX) && !isNaN(fromY)) {
      const result = await moveStack({ x: fromX, y: fromY }, { x: toX, y: toY });
      setSelected(null);
      if (result?.valid && !result.pendingJump && result.currentPlayer === 2 && gameMode === 'PC') {
        await triggerAIMove();
      }
    }
  };

  const p1 = { label: 'Player 1', topColor: '#f0f0f0', bottomColor: '#1dbf6a' };
  const p2 = { label: gameMode === 'PC' ? 'PC' : 'Player 2', topColor: '#c4702e', bottomColor: '#1a1a1a' };


  // Flip the board for player 2 (orientation: 'north')
  const isFlipped = orientation === 'north';
  const displayBoard = isFlipped ? [...board].slice().reverse().map(row => [...row].reverse()) : board;

  // Helper: is this cell the destination of the last AI move?
  // (Not implemented: lastMove/isAIMove not in context)
  const isAIMoveDest = (_x: number, _y: number) => false;

  const renderPlayerCard = (p: 1 | 2) => {
    const info = p === 1 ? p1 : p2;
    const isActive = currentPlayer === p;
    return (
      <div key={p} className={`player-card${isActive ? ' active' : ''}`}>
        <span className="player-card-label">{info.label}</span>
        <div className="player-swatch">
          <div className="player-swatch-top"  style={{ background: info.topColor }} />
          <div className="player-swatch-bottom" style={{ background: info.bottomColor }} />
        </div>
        {isActive && <span className="player-card-turn">{p === 2 && gameMode === 'PC' ? 'Thinking...' : 'Your Turn'}</span>}
      </div>
    );
  };

  // Session expiration modal/banner and redirect
  useEffect(() => {
    if (sessionExpired) {
      setShowSessionModal(true);
      setTimeout(() => {
        setShowSessionModal(false);
        setSessionExpired(false);
        navigate('/lobby');
      }, 2500);
    }
  }, [sessionExpired, setSessionExpired, navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', alignItems: 'stretch' }}>
      {showSessionModal && (
        <div className="session-expired-modal">
          <div className="modal-content">
            <h2>Session Expired</h2>
            <p>Your game session has expired or was not found. Redirecting to lobby...</p>
          </div>
        </div>
      )}
      {/* ── Center: board only ── */}
      <div
        ref={boardAreaRef}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden' }}
      >
        <div className="board-perspective-wrapper">
          <div className="game-board" style={{ width: boardPx, height: boardPx }}>
            {displayBoard.map((row, yIdx) =>
              row.map((stack, x) => {
                const y = isFlipped ? 11 - yIdx : yIdx;
                const isSelected = selected?.x === x && selected?.y === y;
                const isPending = isPendingCell(x, y);
                const animating = isAIMoveDest(x, y);
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`cell${isSelected ? ' selected' : ''}${isPending ? ' pending-jump' : ''}${animating ? ' ai-animating' : ''}`}
                    data-light={(x + y) % 2 === 0 ? 'true' : 'false'}
                    data-row={y}
                    data-col={x}
                    data-animating={animating ? 'true' : undefined}
                    draggable={stack.length > 0 && !isThinking}
                    onDragStart={handleDragStart(x, y)}
                    onClick={() => handleCellClick(x, y)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop(x, y)}
                    style={isThinking ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                  >
                    <Stack stack={stack} animating={animating} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Right sidebar: both players + restart + status ── */}
      <div className="player-sidebar">
        {renderPlayerCard(1)}
        {renderPlayerCard(2)}
        <button
          className="restart-btn"
          onClick={resetGame}
          disabled={isThinking}
        >
          Restart Game
        </button>
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
    </div>
  );
}
