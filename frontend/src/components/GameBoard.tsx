
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ConfirmModal from './ConfirmModal';
import FlyingPieceOverlay from './FlyingPieceOverlay';
import ReconnectSpectator from './ReconnectSpectator';
import { useGame } from './GameContext';
import Stack from './Stack';
// import { useNavigate } from 'react-router-dom';
import { postAIMove } from '../aiApi';
// Animation duration for AI piece movement (ms)
export const AI_MOVE_ANIMATION_DURATION = 900; // ms, easy to tune
export const AI_MULTI_JUMP_DELAY = 200; // ms between jumps
//

import './GameBoard.css';

// Keyboard navigation helpers
const getNextCell = (x: number, y: number, key: string): [number, number] => {
  switch (key) {
    case 'ArrowUp': return [x, Math.max(0, y - 1)];
    case 'ArrowDown': return [x, Math.min(11, y + 1)];
    case 'ArrowLeft': return [Math.max(0, x - 1), y];
    case 'ArrowRight': return [Math.min(11, x + 1), y];
    default: return [x, y];
  }
};


/**
 * GameBoard handles board rendering, user moves, and PC mode AI integration.
 */
// Accept Tooltip as prop for onboarding
export default function GameBoard({ Tooltip }: { Tooltip?: React.ComponentType<any> } = {}) {
  const {
    board,
    moveStack,
    resetGame,
    lastMessage,
    currentPlayer,
    pendingJump,
    gameMode,
    isThinking,
    setIsThinking,
    orientation,
    playerNumber,
    sessionExpired,
    setSessionExpired,
    setBoardStateFromAI,
    // yourColor, // unused
  } = useGame();
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);
  // For keyboard navigation: track focused cell
  const [focusedCell, setFocusedCell] = useState<{ x: number; y: number } | null>(null);
  // Ref to all cell elements for focus management
  const cellRefs = useRef<(HTMLDivElement | null)[][]>([]);
  // const [showSessionModal, setShowSessionModal] = useState(false); // unused
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  // For AI move animation
  const [aiMoveAnimating, setAIMoveAnimating] = useState(false);
  const [aiMultiJumpStep, setAIMultiJumpStep] = useState(0); // which jump in sequence
  const [aiMoveDest, setAIMoveDest] = useState<{ x: number; y: number } | null>(null);
  const [flyingPiece, setFlyingPiece] = useState<{ piece: number, from: {x: number, y: number}, to: {x: number, y: number} } | null>(null);
  const [aiMultiJumpAnimating, setAIMultiJumpAnimating] = useState(false); // for testability
  // const navigate = useNavigate ? useNavigate() : (() => {}); // unused

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
      const topBuf = 48;  // space above board for tall stacks (kings)
      const botBuf = 140;  // space below: perspective overflow (~80px) + visible padding (~60px)
      const availH = height - topBuf - botBuf;
      const fromH = (availH * P) / (P * cosT + availH * sinT);
      const fromW = width * 0.97;
      setBoardPx(Math.max(200, Math.min(fromH, fromW)));
    };
    // @ts-ignore
    const ro = new (window.ResizeObserver || (globalThis as any).ResizeObserver)(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  // Keyboard navigation: move focus with arrow keys
  const handleBoardKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!focusedCell) return;
    let { x, y } = focusedCell;
    if (e.key === 'ArrowRight') {
      x = (x + 1) % 12;
    } else if (e.key === 'ArrowLeft') {
      x = (x + 11) % 12;
    } else if (e.key === 'ArrowDown') {
      y = (y + 1) % 12;
    } else if (e.key === 'ArrowUp') {
      y = (y + 11) % 12;
    } else {
      return;
    }
    e.preventDefault();
    setFocusedCell({ x, y });
    // Focus the new cell
    const ref = cellRefs.current[y]?.[x];
    if (ref) ref.focus();
  }, [focusedCell]);

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
    if (isThinking || aiMoveAnimating) return;

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
        await animateAIMove();
      }
    } else if (canSelect(x, y)) {
      setSelected({ x, y });
    }
  };

  // Animate the AI move: fetch move, update board, then highlight destination
  // Animate a multi-jump AI move (moves array)
  const animateAIMove = async () => {
    setIsThinking(true);
    setAIMoveAnimating(true);
    setAIMultiJumpAnimating(false);
    setAIMultiJumpStep(0);
    try {
      const aiResult = await postAIMove();
      // Multi-jump: moves array
      const moves = aiResult?.moves;
      if (Array.isArray(moves) && moves.length > 1) {
        setAIMultiJumpAnimating(true);
        for (let i = 0; i < moves.length; ++i) {
          setAIMultiJumpStep(i);
          const move = moves[i];
          const from = { x: move.start_pos[1], y: move.start_pos[0] };
          const to = { x: move.end_pos[1], y: move.end_pos[0] };
          setAIMoveDest(to);
          // Defensive: get moving piece from current board
          const movingPiece = board[from.y][from.x][board[from.y][from.x].length - 1] ?? 2;
          setFlyingPiece({ piece: movingPiece, from, to });
          // Wait for animation
          // eslint-disable-next-line no-await-in-loop
          await new Promise(res => setTimeout(res, AI_MOVE_ANIMATION_DURATION));
          setFlyingPiece(null);
          setAIMoveDest(null);
          // Small delay between jumps
          // eslint-disable-next-line no-await-in-loop
          if (i < moves.length - 1) await new Promise(res => setTimeout(res, AI_MULTI_JUMP_DELAY));
        }
        setAIMultiJumpAnimating(false);
        setAIMoveAnimating(false);
        setAIMultiJumpStep(0);
        // After all jumps, update board state
        if (setBoardStateFromAI) setBoardStateFromAI(aiResult);
      } else if (aiResult && aiResult.move) {
        // Single move fallback
        const from = { x: aiResult.move.start_pos[1], y: aiResult.move.start_pos[0] };
        const to = { x: aiResult.move.end_pos[1], y: aiResult.move.end_pos[0] };
        setAIMoveDest(to);
        setAIMoveAnimating(true);
        const movingPiece = board[from.y][from.x][board[from.y][from.x].length - 1] ?? 2;
        setFlyingPiece({ piece: movingPiece, from, to });
        await new Promise(res => setTimeout(res, AI_MOVE_ANIMATION_DURATION));
        setFlyingPiece(null);
        setAIMoveAnimating(false);
        setAIMoveDest(null);
        if (setBoardStateFromAI) setBoardStateFromAI(aiResult);
      } else {
        // fallback: just update board
        if (setBoardStateFromAI) setBoardStateFromAI(aiResult);
      }
    } catch {
      // silent fail
    } finally {
      setIsThinking(false);
      setAIMoveAnimating(false);
      setAIMultiJumpAnimating(false);
      setAIMultiJumpStep(0);
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
    if (isThinking || aiMoveAnimating) return;
    const fromX = parseInt(e.dataTransfer.getData('fromX'));
    const fromY = parseInt(e.dataTransfer.getData('fromY'));
    if (!isNaN(fromX) && !isNaN(fromY)) {
      const result = await moveStack({ x: fromX, y: fromY }, { x: toX, y: toY });
      setSelected(null);
      if (result?.valid && !result.pendingJump && result.currentPlayer === 2 && gameMode === 'PC') {
        await animateAIMove();
      }
    }
  };

  const p1 = { label: 'Player 1', topColor: '#f0f0f0', bottomColor: '#1dbf6a' };
  const p2 = { label: gameMode === 'PC' ? 'PC' : 'Player 2', topColor: '#c4702e', bottomColor: '#1a1a1a' };


  // Flip the board for player 2 (orientation: 'north')
  const isFlipped = orientation === 'north';
  const displayBoard = isFlipped ? [...board].slice().reverse().map(row => [...row].reverse()) : board;

  // Helper: is this cell the destination of the last AI move?
  const isAIMoveDest = (x: number, y: number) => {
    if (!aiMoveAnimating || !aiMoveDest) return false;
    return aiMoveDest.x === x && aiMoveDest.y === y;
  };
  // Helper: is this cell the source of the last AI move?
  //

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


  // Show reconnect/spectator UI if session expired or in spectator mode
  const showReconnect = sessionExpired;
  const showSpectator = gameMode === 'MP' && playerNumber == null;

  // Focus management for board cells
  const cellRefs = useRef<(HTMLDivElement | null)[][]>(Array.from({ length: 12 }, () => Array(12).fill(null)));
  const [focusCell, setFocusCell] = useState<{ x: number; y: number } | null>(null);

  // Keyboard handler for board navigation
  const handleCellKeyDown = (x: number, y: number) => (e: React.KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      const [nx, ny] = getNextCell(x, y, e.key);
      const next = cellRefs.current[ny]?.[nx];
      if (next) {
        next.focus();
        setFocusCell({ x: nx, y: ny });
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCellClick(x, y);
    }
  };

  // Initialize cellRefs on each render
  cellRefs.current = Array.from({ length: 12 }, () => Array(12).fill(null));

  // Always render ARIA roles for accessibility, regardless of Tooltip
  return (
    <div
      style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0, minWidth: 0, width: '100%', height: '100%', overflow: 'hidden', alignItems: 'stretch' }}
      data-testid={aiMultiJumpAnimating ? 'ai-multijump-animating' : undefined}
    >
      {(showReconnect || showSpectator) && (
        <div className="session-expired-modal">
          <div className="modal-content">
            <ReconnectSpectator
              reconnectAvailable={showReconnect}
              onReconnect={() => {
                setSessionExpired(false);
                window.location.reload();
              }}
              spectatorMode={showSpectator}
              reconnectError={showReconnect ? 'Session expired or not found.' : undefined}
            />
          </div>
        </div>
      )}
      {/* ── Center: board only ── */}
      <div
        ref={boardAreaRef}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflow: 'visible' }}
      >
        <div className="board-perspective-wrapper">
          <div
            className="game-board"
            style={{ width: boardPx, height: boardPx }}
            role="grid"
            aria-label="Game board"
          >
            {displayBoard.map((row, yIdx) =>
              row.map((stack, x) => {
                const y = isFlipped ? 11 - yIdx : yIdx;
                const isSelected = selected?.x === x && selected?.y === y;
                const isPending = isPendingCell(x, y);
                const animating = isAIMoveDest(x, y);
                const isSpectator = gameMode === 'MP' && playerNumber == null;
                const tabIndex = isSpectator ? -1 : 0;
                let stackToShow = stack;
                if (aiMoveAnimating && flyingPiece) {
                  if ((flyingPiece.from.x === x && flyingPiece.from.y === y) || (flyingPiece.to.x === x && flyingPiece.to.y === y)) {
                    stackToShow = stack.slice(0, -1);
                  }
                }
                const cellDiv = (
                  <div
                    key={`${x}-${y}`}
                    ref={el => { cellRefs.current[y][x] = el; }}
                    className={`cell${isSelected ? ' selected' : ''}${focusCell && focusCell.x === x && focusCell.y === y ? ' focus-visible' : ''}${isPending ? ' pending-jump' : ''}${animating ? ' ai-animating' : ''}`}
                    data-light={(x + y) % 2 === 0 ? 'true' : 'false'}
                    data-row={y}
                    data-col={x}
                    data-animating={animating ? 'true' : undefined}
                    draggable={stack.length > 0 && !isThinking && !aiMoveAnimating && !aiMultiJumpAnimating}
                    onDragStart={handleDragStart(x, y)}
                    onClick={() => handleCellClick(x, y)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop(x, y)}
                    style={isThinking || aiMoveAnimating || aiMultiJumpAnimating ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                    role="gridcell"
                    tabIndex={tabIndex}
                    aria-label={stack.length > 0 ? `Stack at ${x + 1},${y + 1}` : `Empty square at ${x + 1},${y + 1}`}
                    onFocus={() => setFocusCell({ x, y })}
                    onBlur={() => setFocusCell(null)}
                    onKeyDown={handleCellKeyDown(x, y)}
                    aria-disabled={isSpectator}
                  >
                    <Stack stack={stackToShow} animating={animating} />
                  </div>
                );
                if (Tooltip) {
                  return (
                    <Tooltip
                      key={`${x}-${y}`}
                      content={
                        stack.length > 0
                          ? isPending
                            ? 'This stack must jump again!'
                            : <>
                                Click or drag to move this stack.<br />
                                <span style={{ fontSize: '0.93em', color: '#ffe082', display: 'block', marginTop: 2 }}>
                                  <strong>Tip:</strong> You can dismiss this tooltip with the button.
                                </span>
                              </>
                          : 'Empty square. Only dark squares are playable.'
                      }
                      ariaLabel={stack.length > 0 ? 'stack' : 'empty square'}
                      dismissKey={stack.length > 0 && !isPending ? 'gomony_tooltip_dismissed_v1' : undefined}
                    >
                      {cellDiv}
                    </Tooltip>
                  );
                }
                return cellDiv;
              })
            )}
            {/* Flying piece overlay */}
            {flyingPiece && (
              <FlyingPieceOverlay
                piece={flyingPiece.piece}
                from={flyingPiece.from}
                to={flyingPiece.to}
                boardPx={boardPx}
                duration={AI_MOVE_ANIMATION_DURATION}
              />
            )}
          </div>
        )}
        </div>
      </div>
      </div>

      {/* ── Right sidebar: both players + restart + status ── */}
      <div className="player-sidebar">
        {Tooltip ? (
          <Tooltip content="Player info. The highlighted player moves next." ariaLabel="player info">
            {renderPlayerCard(1)}
          </Tooltip>
        ) : renderPlayerCard(1)}
        {Tooltip ? (
          <Tooltip content="Player info. The highlighted player moves next." ariaLabel="player info">
            {renderPlayerCard(2)}
          </Tooltip>
        ) : renderPlayerCard(2)}
        {Tooltip ? (
          <Tooltip content="Restart the game from the initial state." ariaLabel="restart">
            <button
              className="restart-btn"
              onClick={() => setShowRestartConfirm(true)}
              disabled={isThinking}
            >
              Restart Game
            </button>
          </Tooltip>
        ) : (
          <button
            className="restart-btn"
            onClick={() => setShowRestartConfirm(true)}
            disabled={isThinking}
            role="button"
            aria-label="Restart Game"
          >
            Restart Game
          </button>
        )}
        <ConfirmModal
          open={showRestartConfirm}
          title="Restart Game?"
          message="Are you sure you want to restart the game? This will reset the board and erase all progress."
          confirmLabel="Restart"
          cancelLabel="Cancel"
          onConfirm={() => { setShowRestartConfirm(false); resetGame(); }}
          onCancel={() => setShowRestartConfirm(false)}
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
    </div>
  );
}
