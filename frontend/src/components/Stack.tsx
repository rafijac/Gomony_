import React from 'react';
import './GameBoard.css';

// Piece color mapping (matched to real Gomony board game pieces):
// 1: Player 1 normal face-up (cream white),  3: Player 1 king / accent (natural green)
// 2: Player 2 normal face-up (warm brown),   4: Player 2 king / accent (near black)
const pieceColors: Record<number, string> = {
  1: '#f2ede0',    // cream white  (P1 normal top — matches real white pieces)
  2: '#b8621a',    // caramel brown (P2 normal top — matches real brown pieces)
  3: '#5aaa58',    // natural green (P1 king / accent rim — matches real green band)
  4: '#1a0e05',    // near black   (P2 king / accent rim — matches real dark base)
};

interface StackProps {
  stack: number[];
  animating?: boolean;
}

// Vertical gap between stacked pieces (px)
const LAYER_OFFSET = 15;

export default function Stack({ stack, animating }: StackProps) {
  if (stack.length === 0) return null;

  return (
    <div className={`stack${animating ? ' ai-animating' : ''}`} data-animating={animating ? 'true' : undefined}>
      {stack.map((piece, i) => {
        const isKing = piece === 3 || piece === 4;

        // Non-king  → top face shows identity color, bottom accent peeks out
        // King      → flipped: king/accent color on top, identity on bottom
        let topColor: string, bottomColor: string;
        if (piece === 1) {
          topColor = pieceColors[1]; bottomColor = pieceColors[3]; // white / green
        } else if (piece === 2) {
          topColor = pieceColors[2]; bottomColor = pieceColors[4]; // brown / black
        } else if (piece === 3) {
          topColor = pieceColors[3]; bottomColor = pieceColors[1]; // green / white  (king)
        } else if (piece === 4) {
          topColor = pieceColors[4]; bottomColor = pieceColors[2]; // black / brown  (king)
        } else {
          topColor = '#888'; bottomColor = '#444';
        }

        const bottomPos = 2 + i * LAYER_OFFSET;
        const topPos    = bottomPos + 11; // 11px gap → clearly visible rim

        return (
          <React.Fragment key={i}>
            {/* Wider accent disc peeking out below */}
            <div
              className="disc disc-bottom"
              style={{
                '--disc-color': bottomColor,
                bottom: `${bottomPos}px`,
                zIndex: i * 2,
              } as React.CSSProperties}
            />
            {/* Narrower top disc — carries the face-up color (+ crown if king) */}
            <div
              className={`disc disc-top${isKing ? ' king' : ''}`}
              style={{
                '--disc-color': topColor,
                bottom: `${topPos}px`,
                zIndex: i * 2 + 1,
              } as React.CSSProperties}
            >
              {isKing && (
                <span className="king-crown" aria-label="King">♛</span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
