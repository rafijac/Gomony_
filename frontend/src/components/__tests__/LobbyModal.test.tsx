import { render, screen, fireEvent } from '@testing-library/react';
import LobbyModal from '../LobbyModal';
import { AVATAR_PRESETS } from '../../assets/avatars/presets';

describe('LobbyModal', () => {
  it('renders avatar and name selection before game start', () => {
    render(<LobbyModal onCreate={jest.fn()} onJoin={jest.fn()} onCancel={jest.fn()} editingLocked={false} />);
    // AvatarSelector should be present
    AVATAR_PRESETS.forEach((url) => {
      expect(screen.getAllByAltText('Avatar').map(img => img.getAttribute('src'))).toContain(url);
    });
    // Name input should be present
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
  });

  it('locks avatar and name editing after game start', () => {
    render(<LobbyModal onCreate={jest.fn()} onJoin={jest.fn()} onCancel={jest.fn()} editingLocked={true} />);
    // AvatarSelector should be disabled
    screen.getAllByAltText('Avatar').forEach(img => {
      expect(img).toHaveAttribute('aria-disabled', 'true');
    });
    // Name input should be disabled
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeDisabled();
  });

  it('shows fallback/migration for legacy users', () => {
    // Simulate legacy user: no avatar/name props
    render(<LobbyModal onCreate={jest.fn()} onJoin={jest.fn()} onCancel={jest.fn()} />);
    // Should show default avatar and name
    expect(screen.getByAltText('Avatar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your name/i)).toHaveValue('');
  });
});
