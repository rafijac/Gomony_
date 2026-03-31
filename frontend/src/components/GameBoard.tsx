
import React, { useRef } from 'react';
import { useBoardKeyboardNavigation } from './hooks/useBoardKeyboardNavigation';
import { useBoardSizer } from './hooks/useBoardSizer';
import { useAIMoveAnimation } from './hooks/useAIMoveAnimation';
import { useCellSelection } from './hooks/useCellSelection';
import { useBoardDragAndDrop } from './hooks/useBoardDragAndDrop';
import FlyingPieceOverlay from './FlyingPieceOverlay';
import ReconnectSpectator from './ReconnectSpectator';
import PlayerSidebar from './PlayerSidebar';
import { useGame } from './GameContext';
import BoardGrid from './BoardGrid';
import { useState } from 'react';
import './GameBoard.css';

export const AI_MOVE_ANIMATION_DURATION = 900;
export const AI_MULTI_JUMP_DELAY = 200;

/**
 * GameBoard — thin orchestrator. All logic lives in hooks and subcomponents.
 */
export default function GameBoard({ Tooltip }: { Tooltip?: React.ComponentType<any> } = {}) {
  const {
    board, moveStack, resetGame, lastMessage, currentPlayer,
    pendingJump, gameMode, isThinking, setIsThinking, playerNumber,
    orientation, sessionExpired, setSessionExpired, setBoardStateFromAI,
  } = useGame();

  const boardAreaRef = useRef<HTMLDivElement>(null);
  const boardPx = useBoardSizer(boardAreaRef as React.RefObject<HTMLDivElement>);

  const { animateAIMove, aiMoveAnimating, aiMoveDest, flyingPiece, aiMultiJumpAnimating } =
    useAIMoveAnimation(board, setIsThinking, setBoardStateFromAI);

  const { selected, setSelected, canSelect, isPendingCell } =
    useCellSelection(board, pendingJump, gameMode, currentPlayer, playerNumber);

  const cellRefs = useRef<(HTMLDivElement | null)[][]>(Array.from({ length: 12 }, () => Array(12).fill(null)));
  const [focusCell, setFocusCell] = useState<{ x: number; y: number } | null>(null);
  const { handleCellKeyDown } = useBoardKeyboardNavigation(setFocusCell, cellRefs);
  cellRefs.current = Array.from({ length: 12 }, () => Array(12).fill(null));

  const handleCellClick = async (x: number, y: number) => {
    if (isThinking || aiMoveAnimating) return;
    if (selected) {
      if (selected.x === x && selected.y === y) { setSelected(null); return; }
      const result = await moveStack({ x: selected.x, y: selected.y }, { x, y });
      if (result?.valid && result.pendingJump) {
        // Auto-select the piece that must continue jumping so the player just clicks the destination
        setSelected({ y: result.pendingJump[0], x: result.pendingJump[1] });
      } else {
        setSelected(null);
        if (result?.valid && result.currentPlayer === 2 && gameMode === 'PC') {
          await animateAIMove();
        }
      }
    } else if (canSelect(x, y)) {
      setSelected({ x, y });
    }
  };

  const { handleDragStart, handleDrop } = useBoardDragAndDrop(
    isThinking, aiMoveAnimating, canSelect, moveStack, setSelected, gameMode, animateAIMove
  );

  // Always show the current player at the bottom
  // Flip the board if:
  // - Multiplayer: you are Player 1 (so your pieces are at the bottom)
  // - Multiplayer: you are Player 2 and orientation is 'north' (so your pieces are at the bottom)
  // - Single player: never flip (PC is always at top)
  let isFlipped = false;
  if (gameMode === 'MP') {
    if (playerNumber === 1) {
      isFlipped = true;
    } else if (playerNumber === 2 && orientation === 'north') {
      isFlipped = true;
    }
  } else if (gameMode === 'PC') {
    isFlipped = false;
  }
  const isAIMoveDest = (x: number, y: number) =>
    aiMoveAnimating && !!aiMoveDest && aiMoveDest.x === x && aiMoveDest.y === y;

  const showReconnect = sessionExpired;
  const showSpectator = gameMode === 'MP' && playerNumber == null;

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
              onReconnect={() => { setSessionExpired(false); window.location.reload(); }}
              spectatorMode={showSpectator}
              reconnectError={showReconnect ? 'Session expired or not found.' : undefined}
            />
          </div>
        </div>
      )}
      <div ref={boardAreaRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflow: 'visible' }}>
        <div className="board-perspective-wrapper">
          <BoardGrid
            board={board}
            selected={selected}
            isFlipped={isFlipped}
            isPendingCell={isPendingCell}
            isAIMoveDest={isAIMoveDest}
            flyingPiece={flyingPiece}
            aiMoveAnimating={aiMoveAnimating}
            aiMultiJumpAnimating={aiMultiJumpAnimating}
            Tooltip={Tooltip}
            cellRefs={cellRefs}
            focusCell={focusCell}
            handleCellClick={handleCellClick}
            handleDragStart={handleDragStart}
            handleDrop={handleDrop}
            handleCellKeyDown={handleCellKeyDown}
            boardPx={boardPx}
            // Only render stacks on dark squares
          >
            {flyingPiece && (
              <FlyingPieceOverlay
                piece={flyingPiece.piece} from={flyingPiece.from} to={flyingPiece.to}
                boardPx={boardPx} duration={AI_MOVE_ANIMATION_DURATION}
              />
            )}
          </BoardGrid>
        </div>
      </div>
      <PlayerSidebar
        currentPlayer={currentPlayer} gameMode={gameMode} isThinking={isThinking}
        lastMessage={lastMessage} pendingJump={pendingJump} onRestart={resetGame}
        Tooltip={Tooltip}
      />
    </div>
  );
}

