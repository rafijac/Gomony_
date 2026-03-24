import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import GameBoard from './GameBoard';
import { GameProvider, useGame } from './GameContext';

describe('GameBoard multiplayer orientation', () => {
	it('orients the board so the current player color is always at the bottom', async () => {
		// Simulate backend providing orientation and your_color
		const TestWrapper = ({ orientation, yourColor }: { orientation: 'south' | 'north', yourColor: 'white' | 'brown' }) => {
			const { setMultiplayerSession } = useGame();
			React.useEffect(() => {
				setMultiplayerSession({
					gameId: 'g1',
					sessionToken: 't1',
					playerNumber: yourColor === 'white' ? 1 : 2,
					orientation,
				});
			}, [orientation, yourColor]);
			return <GameBoard />;
		};
		// Render as white at south
		render(
			<GameProvider>
				<TestWrapper orientation="south" yourColor="white" />
			</GameProvider>
		);
		// Board should not be flipped (white at bottom)
		// (Test: cell at [11,1] should be a white piece)
		const cell = await screen.findByTestId('cell-1-11');
		expect(cell.innerHTML).toMatch(/disc/);
		// Render as brown at north
		render(
			<GameProvider>
				<TestWrapper orientation="north" yourColor="brown" />
			</GameProvider>
		);
		// Board should be flipped (brown at bottom)
		const flippedCell = await screen.findByTestId('cell-1-0');
		expect(flippedCell.innerHTML).toMatch(/disc/);
	});
});

describe('GameBoard session expiration', () => {
	it('shows a notification when session expires or connection is lost', async () => {
		// Render GameBoard in a context where sessionExpired and lastMessage are set
		const TestNotification = () => {
			const { setSessionExpired, setGameMode, setLastMessage } = useGame();
			React.useEffect(() => {
				setGameMode('MP');
				setSessionExpired(true);
				setLastMessage('Session expired or not found.');
			}, []);
			return <GameBoard />;
		};
		render(
			<GameProvider>
				<TestNotification />
			</GameProvider>
		);
		// Notification should appear with the error message
		expect(await screen.findByRole('alert')).toHaveTextContent('Session expired or not found.');
	});
});

describe('GameBoard accessibility', () => {
	it('should allow keyboard navigation between board cells (Tab/Arrow keys)', async () => {
		render(
			<GameProvider>
				<GameBoard />
			</GameProvider>
		);
		// Try to focus the first cell
		const firstCell = await screen.findByTestId('cell-1-11');
		firstCell.focus();
		expect(firstCell).toHaveFocus();
		// Simulate ArrowRight/ArrowDown key navigation (should move focus)
		// (This will fail until implemented)
		fireEvent.keyDown(firstCell, { key: 'ArrowRight' });
		// Expect focus to move to next cell (not implemented)
		const nextCell = await screen.findByTestId('cell-2-11');
		expect(nextCell).toHaveFocus();
	});

	it('should have correct ARIA roles and labels for board and cells', async () => {
		render(
			<GameProvider>
				<GameBoard />
			</GameProvider>
		);
		const board = screen.getByRole('grid');
		expect(board).toBeInTheDocument();
		const cell = await screen.findByTestId('cell-1-11');
		expect(cell).toHaveAttribute('role', 'gridcell');
		// Should have aria-label or aria-describedby for piece info
		expect(cell).toHaveAttribute('aria-label');
	});

	it('should show visible focus ring on cell when focused', async () => {
		render(
			<GameProvider>
				<GameBoard />
			</GameProvider>
		);
		const cell = await screen.findByTestId('cell-1-11');
		cell.focus();
		// This will fail until CSS/focus style is implemented
		expect(cell).toHaveClass('focus-visible');
	});
});

describe('GameBoard responsiveness', () => {
	it('should adapt board and sidebar layout for mobile screens', async () => {
		// Set window size to mobile
		window.innerWidth = 375;
		window.innerHeight = 667;
		window.dispatchEvent(new Event('resize'));
		render(
			<GameProvider>
				<GameBoard />
			</GameProvider>
		);
		// Board and sidebar should stack vertically or shrink appropriately
		const board = screen.getByRole('grid');
		const sidebar = screen.getByText(/Player 1|Player 2|Restart Game/);
		// This will fail until responsive CSS is implemented
		expect(board.parentElement).toHaveStyle({ flexDirection: 'column' });
		expect(sidebar).toBeVisible();
	});

	it('should allow touch interaction on board cells', async () => {
		render(
			<GameProvider>
				<GameBoard />
			</GameProvider>
		);
		const cell = await screen.findByTestId('cell-1-11');
		// Simulate touch event (will fail until implemented)
		fireEvent.touchStart(cell);
		fireEvent.touchEnd(cell);
		// Expect cell to be selected or move triggered (not implemented)
		expect(cell).toHaveClass('selected');
	});
});


// --- Onboarding, Help, and Tooltips (TDD Gate) ---
import App from '../App';
import { fireEvent } from '@testing-library/react';

describe('Onboarding, Help, and Tooltips', () => {
	it('shows onboarding overlay for first-time users', () => {
		// Simulate first-time user (localStorage not set)
		window.localStorage.removeItem('gomony_onboarded');
		render(
			<GameProvider>
				<App />
			</GameProvider>
		);
		expect(screen.getByText(/Welcome to Gomony/i)).toBeInTheDocument();
	});

	it('shows help modal when help button is clicked', () => {
		render(
			<GameProvider>
				<App />
			</GameProvider>
		);
		const helpBtn = screen.getByLabelText(/help/i);
		fireEvent.click(helpBtn);
		expect(screen.getByRole('dialog')).toHaveTextContent(/How to Play/i);
	});

	it('shows tooltips on key UI elements', async () => {
		render(
			<GameProvider>
				<App />
			</GameProvider>
		);
		const modeBtn = screen.getByLabelText(/select game mode/i);
		fireEvent.mouseOver(modeBtn);
		expect(await screen.findByText(/Choose how you want to play/i)).toBeInTheDocument();
	});
});
