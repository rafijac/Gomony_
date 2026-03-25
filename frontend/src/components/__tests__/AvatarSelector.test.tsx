import { render, screen, fireEvent } from '@testing-library/react';
import AvatarSelector from '../AvatarSelector';
import { AVATAR_PRESETS } from '../../assets/avatars/presets';

describe('AvatarSelector', () => {
  it('renders all preset avatars', () => {
    render(<AvatarSelector value={AVATAR_PRESETS[0]} onChange={() => {}} />);
    AVATAR_PRESETS.forEach((url) => {
      expect(screen.getByAltText('Avatar')).toHaveAttribute('src', url);
    });
  });

  it('calls onChange when an avatar is clicked', () => {
    const handleChange = jest.fn();
    render(<AvatarSelector value={AVATAR_PRESETS[1]} onChange={handleChange} />);
    const imgs = screen.getAllByAltText('Avatar');
    fireEvent.click(imgs[2]);
    expect(handleChange).toHaveBeenCalledWith(AVATAR_PRESETS[2]);
  });
});
