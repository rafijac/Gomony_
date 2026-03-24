import React from 'react';

interface NotificationProps {
  message: string;
  type: 'error' | 'info' | 'success' | 'warning';
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  return (
    <div role="alert" className={`notification notification-${type}`}
      aria-live="assertive" tabIndex={0}>
      {message}
    </div>
  );
};

export default Notification;
