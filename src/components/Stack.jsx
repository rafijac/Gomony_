import React from 'react';
import './GameBoard.css';

const playerColors = {
  1: '#e74c3c', // Red
  2: '#3498db', // Blue
  3: '#2ecc71', // Green
  4: '#f1c40f', // Yellow
  // Add more as needed
};

export default function Stack({ stack }) {
  return (
    <div className="stack">
      {stack.map((playerId, idx) => (
        <div
          key={idx}
          className="disc"
          style={{
            background: playerColors[playerId] || '#ccc',
            top: idx * 16, // vertical overlap
            zIndex: stack.length - idx,
          }}
        />
      ))}
    </div>
  );
}
