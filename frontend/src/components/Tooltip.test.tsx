import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Tooltip from './Tooltip';

describe('Tooltip dismiss/hide logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows tooltip on hover and hides on mouse leave', () => {
    render(
      <Tooltip content="Test tooltip"> <button>Hover me</button> </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover me'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Test tooltip');
    fireEvent.mouseLeave(screen.getByText('Hover me'));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('can be permanently dismissed and does not show again after dismiss', () => {
    render(
      <Tooltip content="Dismiss me" dismissKey="test_tooltip"> <button>Hover</button> </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Dismiss me');
    // Simulate dismiss button click
    fireEvent.click(screen.getByLabelText('Dismiss tooltip'));
    expect(screen.queryByRole('tooltip')).toBeNull();
    // Tooltip should not show again after dismiss
    fireEvent.mouseEnter(screen.getByText('Hover'));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
