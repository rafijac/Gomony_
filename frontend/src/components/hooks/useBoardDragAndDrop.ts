import { useCallback } from 'react';

export function useBoardDragAndDrop(
  isThinking: boolean,
  aiMoveAnimating: boolean,
  canSelect: (x: number, y: number) => boolean,
  moveStack: (from: { x: number; y: number }, to: { x: number; y: number }) => Promise<any>,
  setSelected: (v: { x: number; y: number } | null) => void,
  gameMode: string,
  animateAIMove: () => Promise<void>
) {
  const handleDragStart = useCallback((fromX: number, fromY: number) => (e: React.DragEvent) => {
    if (isThinking || !canSelect(fromX, fromY)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('fromX', String(fromX));
    e.dataTransfer.setData('fromY', String(fromY));
  }, [isThinking, canSelect]);

  const handleDrop = useCallback((toX: number, toY: number) => async (e: React.DragEvent) => {
    if (isThinking || aiMoveAnimating) return;
    const fromX = parseInt(e.dataTransfer.getData('fromX'));
    const fromY = parseInt(e.dataTransfer.getData('fromY'));
    if (!isNaN(fromX) && !isNaN(fromY)) {
      const result = await moveStack({ x: fromX, y: fromY }, { x: toX, y: toY });
      if (result?.valid && result.pendingJump) {
        setSelected({ y: result.pendingJump[0], x: result.pendingJump[1] });
      } else {
        setSelected(null);
        if (result?.valid && result.currentPlayer === 2 && gameMode === 'PC') {
          await animateAIMove();
        }
      }
    }
  }, [isThinking, aiMoveAnimating, moveStack, setSelected, gameMode, animateAIMove]);

  return { handleDragStart, handleDrop };
}
