
import React from 'react';
import './Tooltip.css';

/**
 * TooltipProps
 * @param dismissKey If provided, makes the tooltip dismissible. The tooltip will not reappear if localStorage.getItem('tooltip_dismissed_' + dismissKey) === '1'.
 *                  Use a versioned key (e.g., 'gomony_tooltip_dismissed_v1') to allow future content changes to reset dismissal.
 * @param disableAfterFirstUse If true, disables tooltip after first display (one-time tip).
 */
interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  ariaLabel?: string;
  dismissKey?: string; // unique versioned key for localStorage to persist dismissal
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
              aria-label="Don't show this tooltip again"
              onClick={handleDismiss}
              tabIndex={0}
              type="button"
              title="Don't show this tooltip again"
              autoFocus={false}
            >
              × <span className="sr-only">Don't show again</span>
            </button>
          )}
        </span>
      )}
    </span>
  );
}
