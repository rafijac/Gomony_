import React from 'react';
import Stack from './Stack';

/**
 * BoardGrid renders the 12x12 board grid and all playable squares for Gomony.
 *
 * Responsibilities:
 * - Render the board grid as a 12x12 set of cells (only dark squares are playable)
 * - Handle orientation (flipping for player 2)
 * - Render each cell with ARIA roles for accessibility
 * - Pass stack data and cell state to each Stack component
 *
 * Props:
 * - board: 12x12 array of stacks (bottom→top)
 * - selected: { x, y } | null — currently selected cell
 * - isFlipped: boolean — whether to flip the board for player 2
 * - isPendingCell: (x: number, y: number) => boolean — returns true if cell is pending a jump
 * - isAIMoveDest: (x: number, y: number) => boolean — returns true if cell is AI move destination
 * - flyingPiece: { piece: number, from: {x: number, y: number}, to: {x: number, y: number} } | null
 * - aiMoveAnimating: boolean
 * - aiMultiJumpAnimating: boolean
 * - Tooltip: optional tooltip component
 * - cellRefs: ref array for focus management
 * - focusCell: { x, y } | null
 * - handleCellClick: (x: number, y: number) => void
 * - handleDragStart: (x: number, y: number) => (e: React.DragEvent) => void
 * - handleDrop: (x: number, y: number) => (e: React.DragEvent) => void
 * - handleCellKeyDown: (x: number, y: number) => (e: React.KeyboardEvent) => void
 * - boardPx: number (board size in px)
 *
 * Usage:
 * <BoardGrid ...props />
 */
type StackType = number[];
type FlyingPieceType = { piece: number, from: { x: number, y: number }, to: { x: number, y: number } } | null;
type BoardGridProps = {
  board: StackType[][];
  selected: { x: number; y: number } | null;
  isFlipped: boolean;
  isPendingCell: (x: number, y: number) => boolean;
  isAIMoveDest: (x: number, y: number) => boolean;
  flyingPiece: FlyingPieceType;
  aiMoveAnimating: boolean;
  aiMultiJumpAnimating: boolean;
  Tooltip?: React.ComponentType<any>;
  cellRefs: React.MutableRefObject<(HTMLDivElement | null)[][]>;
  focusCell: { x: number; y: number } | null;
  handleCellClick: (x: number, y: number) => void;
  handleDragStart: (x: number, y: number) => (e: React.DragEvent) => void;
  handleDrop: (x: number, y: number) => (e: React.DragEvent) => void;
  handleCellKeyDown: (x: number, y: number) => (e: React.KeyboardEvent) => void;
  boardPx: number;
  children?: React.ReactNode;
};

const BoardGrid: React.FC<BoardGridProps> = ({
  board,
  selected,
  isFlipped,
  isPendingCell,
  isAIMoveDest,
  flyingPiece,
  aiMoveAnimating,
  aiMultiJumpAnimating,
  Tooltip,
  cellRefs,
  focusCell,
  handleCellClick,
  handleDragStart,
  handleDrop,
  handleCellKeyDown,
  boardPx,
  children,
}) => {
  // Flip the board visually if needed
  const displayBoard = isFlipped ? [...board].slice().reverse().map(row => [...row].reverse()) : board;
  return (
    <div
      className="game-board"
      style={{ width: boardPx, height: boardPx }}
      role="grid"
      aria-label="Game board"
    >
      {displayBoard.map((row: StackType[], yIdx: number) =>
        row.map((stack: StackType, x: number) => {
          const y = isFlipped ? 11 - yIdx : yIdx;
          // Only render stacks and allow interaction on dark squares
          if ((x + y) % 2 !== 1) {
            return (
              <div
                key={`${x}-${y}`}
                className="cell light"
                data-light="true"
                data-row={y}
                data-col={x}
                role="gridcell"
                tabIndex={-1}
                aria-label={`Light square at ${x + 1},${y + 1}`}
                style={{ background: '#e9d7b2' }}
              />
            );
          }
          const isSelected = selected?.x === x && selected?.y === y;
          const isPending = isPendingCell(x, y);
          const animating = isAIMoveDest(x, y);
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
              className={`cell dark${isSelected ? ' selected' : ''}${focusCell && focusCell.x === x && focusCell.y === y ? ' focus-visible' : ''}${isPending ? ' pending-jump' : ''}${animating ? ' ai-animating' : ''}`}
              data-light="false"
              data-row={y}
              data-col={x}
              data-animating={animating ? 'true' : undefined}
              draggable={stack.length > 0 && !aiMoveAnimating && !aiMultiJumpAnimating}
              onDragStart={handleDragStart(x, y)}
              onClick={() => handleCellClick(x, y)}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop(x, y)}
              style={aiMoveAnimating || aiMultiJumpAnimating ? { pointerEvents: 'none', opacity: 0.7 } : {}}
              role="gridcell"
              tabIndex={0}
              aria-label={stack.length > 0 ? `Stack at ${x + 1},${y + 1}` : `Empty square at ${x + 1},${y + 1}`}
              onFocus={() => {}}
              onBlur={() => {}}
              onKeyDown={handleCellKeyDown(x, y)}
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
      {children}
    </div>
  );
};

export default BoardGrid;
