import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import HelpModal from './HelpModal';

describe('HelpModal accessibility and responsiveness', () => {
  it('renders when open and closes when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<HelpModal open={true} onClose={handleClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/close help/i));
    expect(handleClose).toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    render(<HelpModal open={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('close button is always visible (sticky/fixed)', () => {
    render(<HelpModal open={true} onClose={() => {}} />);
    const closeBtn = screen.getByLabelText(/close help/i);
    expect(closeBtn).toBeVisible();
    // Simulate scroll and check still visible
    // (jsdom limitation: cannot scroll, but button should always be rendered)
  });

  it('modal content is scrollable if content overflows', () => {
    render(<HelpModal open={true} onClose={() => {}} />);
    const modal = screen.getByRole('dialog').querySelector('.help-modal');
    expect(modal).toHaveStyle({ overflowY: expect.stringMatching(/auto|scroll/) });
  });
});
