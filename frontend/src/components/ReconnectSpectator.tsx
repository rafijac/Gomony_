
// import React from 'react';

interface Props {
  reconnectAvailable?: boolean;
  onReconnect?: () => void;
  spectatorMode?: boolean;
  reconnectError?: string;
}

export default function ReconnectSpectator({ reconnectAvailable, onReconnect, spectatorMode, reconnectError }: Props) {
  if (reconnectAvailable) {
    return (
      <div>
        <p>Reconnect to your game?</p>
        <button onClick={onReconnect}>Reconnect</button>
        {reconnectError && <div style={{ color: 'red' }}>{reconnectError}</div>}
      </div>
    );
  }
  if (spectatorMode) {
    return <div>Spectating game...</div>;
  }
  return null;
}
