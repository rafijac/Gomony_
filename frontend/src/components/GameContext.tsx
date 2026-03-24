import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, postMove, setSessionToken as setApiSessionToken } from '../api';
import { postAIMove } from '../aiApi';

const initialBoard: number[][][] = Array.from({ length: 12 }, (_, row) =>
  Array.from({ length: 12 }, (_, col) => {
    const isDark = (row + col) % 2 === 1;
    if (isDark && row <= 3) return [1];   // Player 1 (white) — top 4 rows
    if (isDark && row >= 8) return [2];   // Player 2 (brown) — bottom 4 rows
    return [];
  })
);

interface MoveResult {
  valid: boolean;
  pendingJump: [number, number] | null;
  currentPlayer: number;
}

interface GameContextValue {
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
    gameId: string,
    sessionToken: string,
    playerNumber: number,
    orientation: 'south' | 'north',
    current_turn_color?: string,
    starting_color?: string,
    your_color?: string,
  }) => void;
  currentTurnColor?: string;
  startingColor?: string;
  yourColor?: string;
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
  setBoardStateFromAI?: (aiResult: { board?: number[][][]; current_player?: number; pending_jump?: [number, number] | null }) => void;
}

const GameContext = createContext<GameContextValue>({
  board: initialBoard,
  currentPlayer: 1,
  pendingJump: null,
  moveStack: async () => null,
  triggerAIMove: async () => {},
  resetGame: async () => {},
  lastMessage: '',
  gameMode: '2P',
  setGameMode: () => {},
  isThinking: false,
  setIsThinking: () => {},
  playerNumber: null,
  orientation: 'south',
  sessionToken: null,
  gameId: null,
  setMultiplayerSession: () => {},
  currentTurnColor: undefined,
  startingColor: undefined,
  yourColor: undefined,
  sessionExpired: false,
  setSessionExpired: () => {},
});
interface MoveResponse {
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


export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [board, setBoard] = useState<number[][][]>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [pendingJump, setPendingJump] = useState<[number, number] | null>(null);
  const didMountReset = React.useRef(false);

  // Set board state from AI response (defined after state so setters are in scope)
  const setBoardStateFromAI = useCallback((aiResult: { board?: number[][][]; current_player?: number; pending_jump?: [number, number] | null }) => {
    if (aiResult.board) setBoard(aiResult.board);
    if (aiResult.current_player != null) setCurrentPlayer(aiResult.current_player);
    setPendingJump(aiResult.pending_jump ?? null);
  }, []); 
  const [lastMessage, setLastMessage] = useState('');
  const [gameMode, setGameMode] = useState<'2P' | 'PC' | 'MP'>('2P');
  const [isThinking, setIsThinking] = useState(false);
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<'south' | 'north'>('south');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentTurnColor, setCurrentTurnColor] = useState<string | undefined>(undefined);
  const [startingColor, setStartingColor] = useState<string | undefined>(undefined);
  const [yourColor, setYourColor] = useState<string | undefined>(undefined);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Set multiplayer session state from lobby or backend
  const setMultiplayerSession = useCallback((session: {
    gameId: string,
    sessionToken: string,
    playerNumber: number,
    orientation: 'south' | 'north',
    current_turn_color?: string,
    starting_color?: string,
    your_color?: string,
  }) => {
    setGameId(session.gameId);
    setSessionToken(session.sessionToken);
    setApiSessionToken(session.sessionToken);
    setPlayerNumber(session.playerNumber);
    setOrientation(session.orientation);
    setGameMode('MP');
    setLastMessage('');
    if (session.current_turn_color) setCurrentTurnColor(session.current_turn_color);
    if (session.starting_color) setStartingColor(session.starting_color);
    if (session.your_color) setYourColor(session.your_color);
    // Optionally: fetch initial board state for this session
  }, []);

  // On mount, reset backend to ensure frontend and backend are in sync.
  // Guard with ref to prevent React StrictMode double-invoke from resetting mid-game.
  useEffect(() => {
    if (didMountReset.current) return;
    didMountReset.current = true;
    setSessionToken(null);
    setApiSessionToken(null);
    setPlayerNumber(null);
    setOrientation('south');
    setGameId(null);
    setGameMode('2P');
    api.post<{ board: number[][][]; current_player: number }>('/reset').then(res => {
      setBoard(res.data.board);
      setCurrentPlayer(res.data.current_player);
      setPendingJump(null);
    }).catch(() => {});
  }, []);

  const triggerAIMove = useCallback(async () => {
    setIsThinking(true);
    try {
      const aiResult = await postAIMove();
      if (aiResult.board) setBoard(aiResult.board);
      if (aiResult.current_player != null) setCurrentPlayer(aiResult.current_player);
      setPendingJump(aiResult.pending_jump ?? null);
      if (aiResult.reason) setLastMessage(aiResult.reason);
    } catch {
      setLastMessage('Could not reach the backend server.');
    } finally {
      setIsThinking(false);
    }
  }, []);

  // Multiplayer polling for board sync
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (gameMode === 'MP' && gameId && sessionToken && playerNumber) {
      const poll = async () => {
        try {
          const res = await fetch(`http://localhost:8001/game/${gameId}/state`);
          if (res.status === 410 || res.status === 404) {
            setSessionExpired(true);
            setLastMessage('Session expired or not found.');
            return;
          }
          const data = await res.json();
          if (data.board) setBoard(data.board);
          if (data.current_player != null) setCurrentPlayer(data.current_player);
          setPendingJump(data.pending_jump ?? null);
          if (data.current_turn_color) setCurrentTurnColor(data.current_turn_color);
          if (data.starting_color) setStartingColor(data.starting_color);
          if (data.your_color) setYourColor(data.your_color);
        } catch {
          setLastMessage('Lost connection to server.');
        }
      };
      poll();
      interval = setInterval(poll, 2500);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [gameMode, gameId, sessionToken, playerNumber]);

  const resetGame = useCallback(async () => {
    try {
      const res = await api.post<{ board: number[][][]; current_player: number; player_number?: number; orientation?: 'south' | 'north'; session_token?: string }>('/reset');
      setBoard(res.data.board);
      setCurrentPlayer(res.data.current_player);
      setPendingJump(null);
      setLastMessage('');
      if (res.data.player_number) setPlayerNumber(res.data.player_number);
      if (res.data.orientation) setOrientation(res.data.orientation);
      if (res.data.session_token) setSessionToken(res.data.session_token);
    } catch {
      setLastMessage('Could not reset the game.');
    }
  }, []);

  const moveStack = async (from: { x: number; y: number }, to: { x: number; y: number }): Promise<MoveResult | null> => {
    try {
      if (gameMode === 'MP' && gameId && sessionToken && playerNumber) {
        // Multiplayer move
        const res = await fetch(`http://localhost:8001/game/${gameId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_pos: [from.y, from.x],
            end_pos: [to.y, to.x],
            player: playerNumber,
            session_token: sessionToken,
          })
        });
        if (res.status === 410 || res.status === 404) {
          setSessionExpired(true);
          setLastMessage('Session expired or not found.');
          return null;
        }
        const result: MoveResponse = await res.json();
        if (result.session_token && result.session_token !== sessionToken) {
          setSessionToken(result.session_token);
          setApiSessionToken(result.session_token);
        }
        if (result.orientation) setOrientation(result.orientation);
        if (result.player_number) setPlayerNumber(result.player_number);
        if (result.current_turn_color) setCurrentTurnColor(result.current_turn_color);
        if (result.starting_color) setStartingColor(result.starting_color);
        if (result.your_color) setYourColor(result.your_color);
        if (result.valid) {
          if (result.board) setBoard(result.board);
          const newPlayer = result.current_player ?? currentPlayer;
          if (result.current_player != null) setCurrentPlayer(newPlayer);
          const pj = result.pending_jump ?? null;
          setPendingJump(pj);
          setLastMessage(result.reason || '');
          return { valid: true, pendingJump: pj, currentPlayer: newPlayer };
        } else {
          setLastMessage(`Invalid: ${result.reason}`);
          return { valid: false, pendingJump: pendingJump, currentPlayer };
        }
      } else {
        // Local/PC move
        const result: MoveResponse = await postMove({
          current_state: board,
          start_pos: [from.y, from.x],
          end_pos: [to.y, to.x],
          session_token: sessionToken || undefined,
        });
        if (result.session_token && result.session_token !== sessionToken) {
          setSessionToken(result.session_token);
          setApiSessionToken(result.session_token);
        }
        if (result.orientation) setOrientation(result.orientation);
        if (result.player_number) setPlayerNumber(result.player_number);
        if (result.current_turn_color) setCurrentTurnColor(result.current_turn_color);
        if (result.starting_color) setStartingColor(result.starting_color);
        if (result.your_color) setYourColor(result.your_color);
        if (result.valid) {
          if (result.board) setBoard(result.board);
          const newPlayer = result.current_player ?? currentPlayer;
          if (result.current_player != null) setCurrentPlayer(newPlayer);
          const pj = result.pending_jump ?? null;
          setPendingJump(pj);
          setLastMessage(result.reason || '');
          return { valid: true, pendingJump: pj, currentPlayer: newPlayer };
        } else {
          setLastMessage(`Invalid: ${result.reason}`);
          return { valid: false, pendingJump: pendingJump, currentPlayer };
        }
      }
    } catch (err: any) {
      setLastMessage('Could not reach the backend server.');
      return null;
    }
  };

  return (
    <GameContext.Provider value={{
      board,
      currentPlayer,
      pendingJump,
      moveStack,
      triggerAIMove,
      resetGame,
      lastMessage,
      gameMode,
      setGameMode,
      isThinking,
      setIsThinking,
      playerNumber,
      orientation,
      sessionToken,
      gameId,
      setMultiplayerSession,
      currentTurnColor,
      startingColor,
      yourColor,
      sessionExpired,
      setSessionExpired,
      setBoardStateFromAI,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
