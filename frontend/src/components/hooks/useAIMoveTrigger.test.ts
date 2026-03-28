import { renderHook } from '@testing-library/react';
import { useAIMoveTrigger } from './useAIMoveTrigger';

describe('useAIMoveTrigger', () => {
  it('returns trigger function', () => {
    // TODO: Implement test logic for AI move trigger
    const { result } = renderHook(() => useAIMoveTrigger());
    expect(result.current).toHaveProperty('triggerAIMove');
  });
});
