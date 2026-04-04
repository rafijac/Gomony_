import React from 'react';
import { api, postMove, setSessionToken as setApiSessionToken } from '../../api';
import type { MoveResult, MoveResponse } from '../GameContextTypes';

interface UseMoveStackParams {
  board: number[][][];
  currentPlayer: number;
  pendingJump: [number, number] | null;
  gameMode: '2P' | 'PC' | 'MP';
  gameId: string | null;
  sessionToken: string | null;
  playerNumber: number | null;
  setBoard: React.Dispatch<React.SetStateAction<number[][][]>>;
  setCurrentPlayer: React.Dispatch<React.SetStateAction<number>>;
  setPendingJump: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  setLastMessage: React.Dispatch<React.SetStateAction<string>>;
  setSessionToken: React.Dispatch<React.SetStateAction<string | null>>;
  setSessionExpired: React.Dispatch<React.SetStateAction<boolean>>;
  setOrientation: React.Dispatch<React.SetStateAction<'south' | 'north'>>;
  setPlayerNumber: React.Dispatch<React.SetStateAction<number | null>>;
  setCurrentTurnColor: React.Dispatch<React.SetStateAction<string | undefined>>;
  setStartingColor: React.Dispatch<React.SetStateAction<string | undefined>>;
  setYourColor: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function applyMoveResponse(
  result: MoveResponse,
  params: Pick<UseMoveStackParams, 'setBoard' | 'setCurrentPlayer' | 'setPendingJump' | 'setLastMessage' | 'setSessionToken' | 'setOrientation' | 'setPlayerNumber' | 'setCurrentTurnColor' | 'setStartingColor' | 'setYourColor'> & { sessionToken: string | null; currentPlayer: number; pendingJump: [number, number] | null }
): MoveResult {
  if (result.session_token && result.session_token !== params.sessionToken) {
    params.setSessionToken(result.session_token);
    setApiSessionToken(result.session_token);
  }
  if (result.orientation) params.setOrientation(result.orientation);
  if (result.player_number) params.setPlayerNumber(result.player_number);
  if (result.current_turn_color) params.setCurrentTurnColor(result.current_turn_color);
  if (result.starting_color) params.setStartingColor(result.starting_color);
  if (result.your_color) params.setYourColor(result.your_color);

  if (result.valid) {
    if (result.board) params.setBoard(result.board);
    const newPlayer = result.current_player ?? params.currentPlayer;
    if (result.current_player != null) params.setCurrentPlayer(newPlayer);
    const pj = result.pending_jump ?? null;
    params.setPendingJump(pj);
    params.setLastMessage(result.reason || '');
    return { valid: true, pendingJump: pj, currentPlayer: newPlayer };
  } else {
    params.setLastMessage(`Invalid: ${result.reason}`);
    return { valid: false, pendingJump: params.pendingJump, currentPlayer: params.currentPlayer };
  }
}

export function useMoveStack(p: UseMoveStackParams) {
  const moveStack = async (
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): Promise<MoveResult | null> => {
    try {
      if (p.gameMode === 'MP' && p.gameId && p.sessionToken && p.playerNumber) {
        const res = await api.post<MoveResponse>(`/game/${p.gameId}/move`, {
            start_pos: [from.y, from.x],
            end_pos: [to.y, to.x],
            player: p.playerNumber,
            session_token: p.sessionToken,
          }).catch((err: { response?: { status?: number; data?: { error?: string } } }) => {
            const status = err?.response?.status;
            const apiError = err?.response?.data?.error;
            if (status === 410 || status === 404) {
              p.setSessionExpired(true);
              p.setLastMessage('Session expired or not found.');
            } else if (typeof apiError === 'string' && apiError) {
              p.setLastMessage(`Invalid: ${apiError}`);
            } else {
              p.setLastMessage('Could not complete the move.');
            }
            return null;
          });
        if (!res) return null;
        const result: MoveResponse = res.data;
        return applyMoveResponse(result, p);
      } else {
        const result: MoveResponse = await postMove({
          current_state: p.board,
          start_pos: [from.y, from.x],
          end_pos: [to.y, to.x],
          session_token: p.sessionToken || undefined,
        });
        return applyMoveResponse(result, p);
      }
    } catch {
      p.setLastMessage('Could not reach the backend server.');
      return null;
    }
  };

  return { moveStack };
}
