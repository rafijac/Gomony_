import React, { createContext, useContext, useState } from 'react';

// Example initial state: 12x12 array of stacks
const initialBoard = Array.from({ length: 12 }, () =>
  Array.from({ length: 12 }, () => [])
);

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [board, setBoard] = useState(initialBoard);

  // Example moveStack function
  const moveStack = (from, to) => {
    setBoard(prev => {
      const newBoard = prev.map(row => row.map(cell => [...cell]));
      newBoard[to.y][to.x] = [...newBoard[to.y][to.x], ...newBoard[from.y][from.x]];
      newBoard[from.y][from.x] = [];
      return newBoard;
    });
  };

  return (
    <GameContext.Provider value={{ board, moveStack }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
