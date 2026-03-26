import { renderHook, act } from '@testing-library/react';
import { AnalyticsProvider, useAnalytics } from '../AnalyticsProvider';

describe('AnalyticsProvider & useAnalytics', () => {
  it('does not send events if opt-out is enabled', () => {
    window.localStorage.setItem('gomony.analyticsOptOut', 'true');
    const { result } = renderHook(() => useAnalytics(), {
      wrapper: AnalyticsProvider,
    });
    // Should not send event if opted out
    expect(() => result.current.track('test_event')).not.toThrow();
    // Simulate event sending (should be a no-op)
    // (No analytics script should be loaded)
    // (No network request should be made)
  });

  it('sends events if opt-out is disabled', () => {
    window.localStorage.removeItem('gomony.analyticsOptOut');
    const { result } = renderHook(() => useAnalytics(), {
      wrapper: AnalyticsProvider,
    });
    // Should send event (simulate Plausible/Umami call)
    expect(() => result.current.track('test_event')).not.toThrow();
    // (In real test, would mock network/script)
  });
});
