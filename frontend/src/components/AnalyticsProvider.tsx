import React, { createContext, useContext, useEffect, useRef } from 'react';

// --- Plausible/Umami config ---
const ANALYTICS_SRC = 'https://plausible.io/js/plausible.js'; // Change to Umami if needed
const ANALYTICS_DOMAIN = 'gomony.app'; // Update to your domain

function loadAnalyticsScript() {
  if (document.getElementById('gomony-analytics-script')) return;
  const script = document.createElement('script');
  script.id = 'gomony-analytics-script';
  script.src = ANALYTICS_SRC;
  script.async = true;
  script.setAttribute('data-domain', ANALYTICS_DOMAIN);
  document.body.appendChild(script);
}

function sendAnalyticsEvent(event: string, data?: Record<string, any>) {
  // Plausible: window.plausible('eventName', {props})
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible(event, data ? { props: data } : undefined);
  }
}

const AnalyticsContext = createContext({
  track: (_event: string, _data?: Record<string, any>) => {},
});

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const optOut = window.localStorage.getItem('gomony.analyticsOptOut') === 'true';
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!optOut && !scriptLoaded.current) {
      loadAnalyticsScript();
      scriptLoaded.current = true;
    }
  }, [optOut]);

  const value = {
    track: (event: string, data?: Record<string, any>) => {
      if (!optOut) {
        sendAnalyticsEvent(event, data);
      }
    },
  };
  return (
    <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
  );
};

export function useAnalytics() {
  return useContext(AnalyticsContext);
}
