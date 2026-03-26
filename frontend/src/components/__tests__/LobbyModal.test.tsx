import { render, screen, fireEvent } from '@testing-library/react';
import LobbyModal from '../LobbyModal';
import { AVATAR_PRESETS } from '../../assets/avatars/presets';
import { vi } from 'vitest';

describe('LobbyModal', () => {
  it('renders avatar and name selection before game start', () => {
    render(<LobbyModal onCreate={vi.fn()} onJoin={vi.fn()} onCancel={vi.fn()} editingLocked={false} />);
    // AvatarSelector images should be present (using role)
    const avatarImgs = screen.getAllByRole('img');
    expect(avatarImgs.length).toBeGreaterThanOrEqual(AVATAR_PRESETS.length);
    const srcs = avatarImgs.map(img => img.getAttribute('src'));
    AVATAR_PRESETS.forEach(url => expect(srcs).toContain(url));
    // Name input should be present and not disabled
    const nameInput = screen.getByPlaceholderText(/enter your name/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).not.toBeDisabled();
  });

  it('locks avatar and name editing after game start', () => {
    render(<LobbyModal onCreate={vi.fn()} onJoin={vi.fn()} onCancel={vi.fn()} editingLocked={true} />);
    // AvatarSelector images should have aria-disabled
    const avatarImgs = screen.getAllByRole('img');
    avatarImgs.forEach(img => {
      expect(img).toHaveAttribute('aria-disabled', 'true');
    });
    // Name input should be disabled
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeDisabled();
  });

  it('shows fallback/migration for legacy users', () => {
    // Simulate legacy user: no avatar/name props (editingLocked defaults to false)
    render(<LobbyModal onCreate={vi.fn()} onJoin={vi.fn()} onCancel={vi.fn()} />);
    // Should show avatar images (from AvatarSelector)
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    // Name input should be present and empty
    expect(screen.getByPlaceholderText(/enter your name/i)).toHaveValue('');
  });
});
