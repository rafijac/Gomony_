import React from 'react';

export interface NotificationProps {
  message: string;
  type?: 'error' | 'info' | 'success' | 'warning';
  details?: string;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type = 'info', details, onClose }) => {
  if (!message) return null;
  return (
    <div role="alert" className={`notification notification-${type}`} aria-live="assertive" tabIndex={0}>
      <span>{message}</span>
      {details && <pre className="notification-details">{details}</pre>}
      {onClose && <button onClick={onClose} aria-label="Close notification">×</button>}
    </div>
  );
};

export default Notification;
