import { useState, useCallback } from 'react';
import { postAIMove } from '../../aiApi';
import { AI_MOVE_ANIMATION_DURATION, AI_MULTI_JUMP_DELAY } from '../GameBoard';

export interface FlyingPiece {
  piece: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export function useAIMoveAnimation(
  board: number[][][],
  setIsThinking: (b: boolean) => void,
  setBoardStateFromAI?: (r: { board?: number[][][]; current_player?: number; pending_jump?: [number, number] | null }) => void
) {
  const [aiMoveAnimating, setAIMoveAnimating] = useState(false);
  const [aiMoveDest, setAIMoveDest] = useState<{ x: number; y: number } | null>(null);
  const [flyingPiece, setFlyingPiece] = useState<FlyingPiece | null>(null);
  const [aiMultiJumpAnimating, setAIMultiJumpAnimating] = useState(false);

  const animateAIMove = useCallback(async () => {
    setIsThinking(true);
    setAIMoveAnimating(true);
    setAIMultiJumpAnimating(false);
    try {
      const aiResult = await postAIMove();
      const moves = (aiResult as any)?.moves;
      const move = aiResult?.move;
      if (Array.isArray(moves) && moves.length > 1) {
        setAIMultiJumpAnimating(true);
        for (let i = 0; i < moves.length; ++i) {
          const m = moves[i];
          const from = { x: m.start_pos[1], y: m.start_pos[0] };
          const to = { x: m.end_pos[1], y: m.end_pos[0] };
          setAIMoveDest(to);
          const movingPiece = board[from.y][from.x][board[from.y][from.x].length - 1] ?? 2;
          setFlyingPiece({ piece: movingPiece, from, to });
          // eslint-disable-next-line no-await-in-loop
          await new Promise(res => setTimeout(res, AI_MOVE_ANIMATION_DURATION));
          setFlyingPiece(null);
          setAIMoveDest(null);
          // eslint-disable-next-line no-await-in-loop
          if (i < moves.length - 1) await new Promise(res => setTimeout(res, AI_MULTI_JUMP_DELAY));
        }
        setAIMultiJumpAnimating(false);
        setAIMoveAnimating(false);
        if (setBoardStateFromAI) setBoardStateFromAI(aiResult);
      } else if (move) {
        const from = { x: move.start_pos[1], y: move.start_pos[0] };
        const to = { x: move.end_pos[1], y: move.end_pos[0] };
        setAIMoveDest(to);
        setAIMoveAnimating(true);
        const movingPiece = board[from.y][from.x][board[from.y][from.x].length - 1] ?? 2;
        setFlyingPiece({ piece: movingPiece, from, to });
        await new Promise(res => setTimeout(res, AI_MOVE_ANIMATION_DURATION));
        setFlyingPiece(null);
        setAIMoveAnimating(false);
        setAIMoveDest(null);
        if (setBoardStateFromAI) setBoardStateFromAI(aiResult);
      } else {
        if (setBoardStateFromAI) setBoardStateFromAI(aiResult);
      }
    } catch {
      // silent fail
    } finally {
      setIsThinking(false);
      setAIMoveAnimating(false);
      setAIMultiJumpAnimating(false);
    }
  }, [board, setIsThinking, setBoardStateFromAI]);

  return { animateAIMove, aiMoveAnimating, aiMoveDest, flyingPiece, aiMultiJumpAnimating };
}
