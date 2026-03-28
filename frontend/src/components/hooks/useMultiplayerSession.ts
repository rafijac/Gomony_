import { useState, useCallback } from 'react';

export function useMultiplayerSession() {
  const [session, setSession] = useState(null);
  const joinSession = useCallback((sessionId: string) => {
    // TODO: Implement join session logic
    setSession({ id: sessionId });
  }, []);
  return { session, joinSession };
}
