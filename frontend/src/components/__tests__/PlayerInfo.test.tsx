import { render, screen } from '@testing-library/react';
import PlayerInfo from '../PlayerInfo';

describe('PlayerInfo', () => {
  it('renders name and avatar', () => {
    render(<PlayerInfo name="Alice" avatarUrl="/assets/avatars/avatar2.png" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    const img = screen.getByAltText('Alice');
    expect(img).toHaveAttribute('src', '/assets/avatars/avatar2.png');
  });

  it('falls back to default avatar and name', () => {
    render(<PlayerInfo name="" avatarUrl="" />);
    expect(screen.getByText('Player')).toBeInTheDocument();
    const img = screen.getByAltText('Player');
    expect(img).toHaveAttribute('src', '/assets/avatars/avatar1.png');
  });
});
