
import React from 'react';
import './Tooltip.css';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  ariaLabel?: string;
  dismissKey?: string; // unique key for localStorage to persist dismissal
  disableAfterFirstUse?: boolean; // disables tooltip after first display
}

export default function Tooltip({ children, content, position = 'top', ariaLabel, dismissKey, disableAfterFirstUse }: TooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(() => {
    if (!dismissKey) return false;
    return localStorage.getItem('tooltip_dismissed_' + dismissKey) === '1';
  });
  const [disabled, setDisabled] = React.useState(() => {
    if (!disableAfterFirstUse) return false;
    return localStorage.getItem('tooltip_disabled_first_' + (dismissKey || 'default')) === '1';
  });

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dismissKey) {
      localStorage.setItem('tooltip_dismissed_' + dismissKey, '1');
      setDismissed(true);
      setVisible(false);
    }
  };

  const handleFirstShow = () => {
    setVisible(true);
    if (disableAfterFirstUse && !disabled) {
      localStorage.setItem('tooltip_disabled_first_' + (dismissKey || 'default'), '1');
      setDisabled(true);
    }
  };

  if (dismissed || disabled) {
    return <>{children}</>;
  }

  return (
    <span
      className={`tooltip-wrapper tooltip-${position}`}
      onMouseEnter={handleFirstShow}
      onMouseLeave={() => setVisible(false)}
      onFocus={handleFirstShow}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      aria-label={ariaLabel}
      style={{ outline: 'none' }}
    >
      {children}
      {visible && (
        <span className="tooltip-bubble" role="tooltip">
          <span>{content}</span>
          {dismissKey && (
            <button
              className="tooltip-dismiss-btn"
              aria-label="Dismiss tooltip"
              onClick={handleDismiss}
              tabIndex={0}
              type="button"
            >
              ×
            </button>
          )}
        </span>
      )}
    </span>
  );
}
