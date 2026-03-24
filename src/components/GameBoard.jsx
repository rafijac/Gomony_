import React from 'react';
import { useGame } from './GameContext';
import Stack from './Stack';
import './GameBoard.css';

export default function GameBoard() {
  const { board, moveStack } = useGame();

  // Drag-and-drop handlers
  const handleDragStart = (fromX, fromY) => (e) => {
    e.dataTransfer.setData('fromX', fromX);
    e.dataTransfer.setData('fromY', fromY);
  };

  const handleDrop = (toX, toY) => (e) => {
    const fromX = parseInt(e.dataTransfer.getData('fromX'));
    const fromY = parseInt(e.dataTransfer.getData('fromY'));
    if (!isNaN(fromX) && !isNaN(fromY)) {
      moveStack({ x: fromX, y: fromY }, { x: toX, y: toY });
    }
  };

  return (
    <div className="game-board">
      {board.map((row, y) =>
        row.map((stack, x) => (
          <div
            key={`${x}-${y}`}
            className="cell"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop(x, y)}
          >
            <div
              draggable={stack.length > 0}
              onDragStart={handleDragStart(x, y)}
            >
              <Stack stack={stack} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
