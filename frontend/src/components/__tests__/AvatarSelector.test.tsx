
import { render, screen, fireEvent } from '@testing-library/react';
import AvatarSelector from '../AvatarSelector';
import { AVATAR_PRESETS } from '../../assets/avatars/presets';
import { vi } from 'vitest';

describe('AvatarSelector', () => {
  it('renders all preset avatars with unique alt text', () => {
    render(<AvatarSelector value={AVATAR_PRESETS[0]} onChange={() => {}} />);
    AVATAR_PRESETS.forEach((url, idx) => {
      const img = screen.getByAltText(`Avatar ${idx + 1}`);
      expect(img).toHaveAttribute('src', url);
    });
  });

  it('calls onChange when an avatar is clicked', () => {
    const handleChange = vi.fn();
    render(<AvatarSelector value={AVATAR_PRESETS[1]} onChange={handleChange} />);
    const imgs = screen.getAllByRole('img');
    fireEvent.click(imgs[2]);
    expect(handleChange).toHaveBeenCalledWith(AVATAR_PRESETS[2]);
  });

  it('disables avatar selection after game start', () => {
    render(<AvatarSelector value={AVATAR_PRESETS[0]} onChange={() => {}} editingLocked={true} />);
    const imgs = screen.getAllByRole('img');
    imgs.forEach(img => {
      expect(img).toHaveAttribute('aria-disabled', 'true');
      expect(img).toHaveStyle('cursor: not-allowed');
    });
  });
});
