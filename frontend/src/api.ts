
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8001',
});

// Store session token for manual use (not via header)
let sessionToken: string | null = null;
export function setSessionToken(token: string | null) {
  sessionToken = token;
}


export interface MoveRequest {
  current_state: number[][][];
  start_pos: [number, number];
  end_pos: [number, number];
  session_token?: string;
}


export interface MoveResponse {
  valid: boolean;
  reason: string;
  board?: number[][][];
  current_player?: number;
  pending_jump?: [number, number] | null;
  player_number?: number;
  orientation?: 'south' | 'north';
  session_token?: string;
}

export const postMove = (payload: MoveRequest): Promise<MoveResponse> =>
  api.post<MoveResponse>('/move', payload).then((r) => r.data);
