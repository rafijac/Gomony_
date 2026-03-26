import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameBoard from '../GameBoard';

describe('GameBoard accessibility', () => {
  // Polyfill ResizeObserver for test environment
  beforeAll(() => {
    global.ResizeObserver =
      global.ResizeObserver ||
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
  });
  it('renders the board with role="grid" and all cells with role="gridcell"', () => {
    render(<GameBoard />);
    const board = screen.getByRole('grid');
    expect(board).toBeInTheDocument();
    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('all interactive cells are focusable and navigable by keyboard', async () => {
    render(<GameBoard />);
    const user = userEvent.setup();
    const cells = screen.getAllByRole('gridcell');
    // Try to tab to the first cell
    await user.tab();
    expect(document.activeElement).toBe(cells[0]);
    // Arrow navigation (simulate right arrow)
    await user.keyboard('{ArrowRight}');
    // Focus should move to the next cell
    expect(document.activeElement).toBe(cells[1]);
  });

  it('restart button has role="button" and is accessible by keyboard', async () => {
    render(<GameBoard />);
    const user = userEvent.setup();
    const restartBtn = screen.getByRole('button', { name: /restart/i });
    expect(restartBtn).toBeInTheDocument();
    await user.tab(); // focus first element
    await user.tab(); // focus restart button
    expect(document.activeElement).toBe(restartBtn);
  });
});
