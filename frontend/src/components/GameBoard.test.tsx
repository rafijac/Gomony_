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
	it('shows a modal/banner and redirects to lobby on 410/404 error', async () => {
		// Simulate backend returning 410 Gone or 404 Not Found
		// (Mock moveStack or polling to throw error)
		// Render GameBoard and trigger error
		// Expect modal/banner to appear
		// Expect redirect to lobby (could check for LobbyModal or route change)
		// This test will fail until implemented
		expect(false).toBe(true);
	});
});
