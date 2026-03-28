import { useCallback } from 'react';

// Helper for next cell calculation
const getNextCell = (x: number, y: number, key: string): [number, number] => {
  switch (key) {
    case 'ArrowUp': return [x, Math.max(0, y - 1)];
    case 'ArrowDown': return [x, Math.min(11, y + 1)];
    case 'ArrowLeft': return [Math.max(0, x - 1), y];
    case 'ArrowRight': return [Math.min(11, x + 1), y];
    default: return [x, y];
  }
};

export function useBoardKeyboardNavigation(setFocusCell: (cell: { x: number; y: number }) => void, cellRefs: React.MutableRefObject<(HTMLDivElement | null)[][]>) {
  // Returns a handler for a given cell
  const handleCellKeyDown = useCallback((x: number, y: number) => (e: React.KeyboardEvent) => {
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
      // The actual move/cell click handler should be called in the component
    }
  }, [setFocusCell, cellRefs]);
  return { handleCellKeyDown };
}
