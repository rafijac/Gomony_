import { flushSync } from 'react-dom';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { api, setSessionToken as setApiSessionToken } from '../api';
import { postAIMove } from '../aiApi';
import { initialBoard, type GameContextValue } from './GameContextTypes';
import { useMoveStack } from './hooks/useMoveStack';

export const GameContext = createContext<GameContextValue & { endState?: any }>({
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
  endState: undefined,
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [board, setBoard] = useState<number[][][]>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [pendingJump, setPendingJump] = useState<[number, number] | null>(null);
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
  const [endState, setEndState] = useState<any>(undefined);
  const didMountReset = React.useRef(false);

  const setBoardStateFromAI = useCallback((aiResult: { board?: number[][][]; current_player?: number; pending_jump?: [number, number] | null; game_over?: boolean; end_reason?: string; winner?: any }) => {
    if (aiResult.board) setBoard(aiResult.board);
    if (aiResult.current_player != null) setCurrentPlayer(aiResult.current_player);
    setPendingJump(aiResult.pending_jump ?? null);
    if (aiResult.game_over) {
      setEndState({ game_over: aiResult.game_over, end_reason: aiResult.end_reason, winner: aiResult.winner });
    }
  }, []);

  const setMultiplayerSession = useCallback((session: {
    gameId: string; sessionToken: string; playerNumber: number; orientation: 'south' | 'north';
    current_turn_color?: string; starting_color?: string; your_color?: string;
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
  }, []);

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
      flushSync(() => {
        if (aiResult.board) setBoard(aiResult.board);
        if (aiResult.current_player != null) setCurrentPlayer(aiResult.current_player);
        setPendingJump(aiResult.pending_jump ?? null);
      });
      if (aiResult.reason) setLastMessage(aiResult.reason);
    } catch {
      setLastMessage('Could not reach the backend server.');
    } finally {
      setIsThinking(false);
    }
  }, []);

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
          flushSync(() => {
            if (data.board) setBoard(data.board);
            if (data.current_player != null) setCurrentPlayer(data.current_player);
            setPendingJump(data.pending_jump ?? null);
            if (data.current_turn_color) setCurrentTurnColor(data.current_turn_color);
            if (data.starting_color) setStartingColor(data.starting_color);
            if (data.your_color) setYourColor(data.your_color);
          });
          if (data.game_over) {
            setEndState({
              game_over: data.game_over,
              end_reason: data.end_reason,
              winner: data.winner
            });
          }
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

  const { moveStack } = useMoveStack({
    board, currentPlayer, pendingJump, gameMode, gameId, sessionToken, playerNumber,
    setBoard, setCurrentPlayer, setPendingJump, setLastMessage, setSessionToken,
    setSessionExpired, setOrientation, setPlayerNumber,
    setCurrentTurnColor, setStartingColor, setYourColor,
  });

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
      endState,
      setBoardStateFromAI,
    }}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook to use GameContext
export function useGame() {
  const context = React.useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
