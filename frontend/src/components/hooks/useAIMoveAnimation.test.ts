import { renderHook } from '@testing-library/react';
import { useAIMoveAnimation } from './useAIMoveAnimation';

describe('useAIMoveAnimation', () => {
  it('returns animation state and trigger', () => {
    // TODO: Implement test logic for AI move animation
    const { result } = renderHook(() => useAIMoveAnimation());
    expect(result.current).toHaveProperty('isAnimating');
    expect(result.current).toHaveProperty('triggerAnimation');
  });
});
