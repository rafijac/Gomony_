
import axios from 'axios';

const getBaseURL = () => {
  // VITE_API_URL is injected at build time from the environment
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('onrender.com')) {
    return 'https://gomony-backend.onrender.com';
  }
  return 'http://localhost:8001';
};

export const api = axios.create({
  baseURL: getBaseURL(),
});

// Store session token for manual use (not via header)
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
// @ts-ignore: sessionToken is kept for future use
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
