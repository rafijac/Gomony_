export const initialBoard: number[][][] = Array.from({ length: 12 }, (_, row) =>
  Array.from({ length: 12 }, (_, col) => {
    const isDark = (row + col) % 2 === 1;
    if (isDark && row <= 3) return [1];   // Player 1 (white) — top 4 rows
    if (isDark && row >= 8) return [2];   // Player 2 (brown) — bottom 4 rows
    return [];
  })
);

export interface MoveResult {
  valid: boolean;
  pendingJump: [number, number] | null;
  currentPlayer: number;
}

export interface MoveResponse {
  valid: boolean;
  pending_jump?: [number, number] | null;
  current_player?: number;
  board?: number[][][];
  reason?: string;
  session_token?: string;
  orientation?: 'south' | 'north';
  player_number?: number;
  current_turn_color?: string;
  starting_color?: string;
  your_color?: string;
}

export interface GameContextValue {
  board: number[][][];
  currentPlayer: number;
  pendingJump: [number, number] | null;
  moveStack: (from: { x: number; y: number }, to: { x: number; y: number }) => Promise<MoveResult | null>;
  triggerAIMove: () => Promise<void>;
  resetGame: () => Promise<void>;
  lastMessage: string;
  gameMode: '2P' | 'PC' | 'MP';
  setGameMode: (mode: '2P' | 'PC' | 'MP') => void;
  isThinking: boolean;
  setIsThinking: (thinking: boolean) => void;
  playerNumber: number | null;
  orientation: 'south' | 'north';
  sessionToken: string | null;
  gameId: string | null;
  setMultiplayerSession: (session: {
    gameId: string;
    sessionToken: string;
    playerNumber: number;
    orientation: 'south' | 'north';
    current_turn_color?: string;
    starting_color?: string;
    your_color?: string;
  }) => void;
  currentTurnColor?: string;
  startingColor?: string;
  yourColor?: string;
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
  setBoardStateFromAI?: (aiResult: {
    board?: number[][][];
    current_player?: number;
    pending_jump?: [number, number] | null;
  }) => void;
}
