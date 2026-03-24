import React, { useEffect, useRef } from 'react';
import './GameBoard.css';

// Piece color mapping (same as Stack)
const pieceColors = {
  1: '#f2ede0',
  2: '#b8621a',
  3: '#5aaa58',
  4: '#1a0e05',
};

const LAYER_OFFSET = 15;

export default function FlyingPieceOverlay({ piece, from, to, boardPx, boardRef, duration }) {
  const overlayRef = useRef(null);
  // Calculate cell size and positions
  const cellSize = boardPx / 12;
  const getPos = (cell) => ({
    x: cell.x * cellSize + cellSize / 2,
    y: cell.y * cellSize + cellSize / 2,
  });
  const fromPos = getPos(from);
  const toPos = getPos(to);
  // Animate with CSS transform
  useEffect(() => {
    if (!overlayRef.current) return;
    overlayRef.current.style.transform = `translate(${fromPos.x}px, ${fromPos.y}px)`;
    overlayRef.current.style.transition = 'none';
    // Force reflow
    void overlayRef.current.offsetWidth;
    overlayRef.current.style.transition = `transform ${duration}ms cubic-bezier(0.4,0,0.2,1)`;
    overlayRef.current.style.transform = `translate(${toPos.x}px, ${toPos.y}px)`;
  }, [fromPos.x, fromPos.y, toPos.x, toPos.y, duration]);

  // Piece rendering (same as Stack, but only top disc)
  let topColor, bottomColor, isKing;
  isKing = piece === 3 || piece === 4;
  if (piece === 1) {
    topColor = pieceColors[1]; bottomColor = pieceColors[3];
  } else if (piece === 2) {
    topColor = pieceColors[2]; bottomColor = pieceColors[4];
  } else if (piece === 3) {
    topColor = pieceColors[3]; bottomColor = pieceColors[1];
  } else if (piece === 4) {
    topColor = pieceColors[4]; bottomColor = pieceColors[2];
  } else {
    topColor = '#888'; bottomColor = '#444';
  }

  return (
    <div
      ref={overlayRef}
      className="flying-piece-overlay"
      style={{
        position: 'absolute',
        left: 0, top: 0,
        width: cellSize, height: cellSize,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <div className="disc disc-bottom" style={{ '--disc-color': bottomColor, bottom: 2, zIndex: 0, position: 'absolute', width: '96%', left: '2%', height: '48%' }} />
      <div className={`disc disc-top${isKing ? ' king' : ''}`} style={{ '--disc-color': topColor, bottom: 13, zIndex: 1, position: 'absolute', width: '82%', left: '9%', height: '52%' }}>
        {isKing && <span className="king-crown" aria-label="King">♛</span>}
      </div>
    </div>
  );
}