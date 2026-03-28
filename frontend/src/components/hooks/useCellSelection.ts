import { useState, useCallback } from 'react';

export function useCellSelection(
  board: number[][][],
  pendingJump: [number, number] | null,
  gameMode: string,
  currentPlayer: number,
  playerNumber: number | null
) {
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);

  const isPendingCell = useCallback((x: number, y: number): boolean =>
    pendingJump !== null && pendingJump[0] === y && pendingJump[1] === x,
    [pendingJump]
  );

  const canSelect = useCallback((x: number, y: number): boolean => {
    const stack = board[y][x];
    if (!stack.length) return false;
    const top = stack[stack.length - 1];
    if (gameMode === 'PC' && (top === 2 || top === 4)) return false;
    if (gameMode === 'MP') {
      if (!playerNumber) return false;
      const own = playerNumber === 1 ? [1, 3] : [2, 4];
      if (!own.includes(top)) return false;
      if (currentPlayer !== playerNumber) return false;
    }
    if (pendingJump && !isPendingCell(x, y)) return false;
    return true;
  }, [board, gameMode, playerNumber, currentPlayer, pendingJump, isPendingCell]);

  return { selected, setSelected, canSelect, isPendingCell };
}
