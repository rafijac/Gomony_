
import { api } from './api';


export interface AIMoveRequest {
  depth?: number;
  session_token?: string;
}


export interface AIMoveResponse {
  valid: boolean;
  reason: string;
  move?: {
    start_pos: [number, number];
    end_pos: [number, number];
  };
  board?: number[][][];
  current_player?: number;
  pending_jump?: [number, number] | null;
  player_number?: number;
  orientation?: 'south' | 'north';
  session_token?: string;
}

export const postAIMove = (payload: AIMoveRequest = {}): Promise<AIMoveResponse> =>
  api.post<AIMoveResponse>('/move/pc', payload).then((r) => r.data);
