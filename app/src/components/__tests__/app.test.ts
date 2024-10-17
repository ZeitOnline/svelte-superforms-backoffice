import { getByRole, render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import App from '$components/App.svelte';
import { getAllGames } from '$lib/queries';

const fakeData = {
    generateGameForm: {
        id: 'generate-game-form',
        valid: true,
        posted: false,
        errors: {},
        data: {
            csv: null as unknown as File, // Mock a File object
        },
    },
    saveGameForm: {
        id: 'save-game-form',
        valid: true,
        posted: false,
        errors: {},
        data: {
            published: false,
            release_date: '',
            name: '',
            questions: [], // Empty array as per your test
        },
    },
    games: await getAllGames()
}

describe('App', () => {
    it('should render dashboard view when opening app', async () => {
      const { getByText } = render(App, {
        data: fakeData
      });
  
      const dashboard = getByText('Dashboard');
      expect(dashboard).toBeDefined();
    });

    it('should render dashboard view with all the games (10 on the first page)', async () => {
        const { container } = render(App, {
          data: fakeData
        });
    
        const table = getByRole(container, 'table');
        const tbody = table.querySelector('tbody');
        expect(tbody).toBeDefined();

        if (tbody) {
            const rows = tbody.children;
            expect(rows.length).toBe(10);
        }
    });
});