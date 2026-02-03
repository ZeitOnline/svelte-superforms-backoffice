import { getByRole, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { MOCK_GAMES } from '../../data/mock';
import App from '$components/App.svelte';

vi.mock('$lib/queries', () => ({
  getAllGames: vi.fn().mockResolvedValue({ games: MOCK_GAMES.ECKCHEN, total: MOCK_GAMES.ECKCHEN.length }),
}));

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
  games: MOCK_GAMES.ECKCHEN,
  gamesPage: {
    page: 1,
    pageSize: 10,
    total: MOCK_GAMES.ECKCHEN.length,
    totalPages: 1,
    search: '',
    sort: 'dateDesc' as const,
    activeFilter: null,
  },
  latestActiveGameIds: MOCK_GAMES.ECKCHEN.map(game => game.id),
  gameType: 'eckchen' as const,
};

describe('App', () => {
  it('should render dashboard view when opening app', async () => {
    const { getByText } = render(App, {
      data: fakeData,
    });

    const dashboard = getByText('Dashboard');
    expect(dashboard).toBeDefined();
  });

  it('should render dashboard view with all the games (10 on the first page)', async () => {
    const { container } = render(App, {
      data: fakeData,
    });

    const table = getByRole(container, 'table');
    const tbody = table.querySelector('tbody');
    expect(tbody).toBeDefined();

    if (tbody) {
      const rows = tbody.children;
      expect(rows.length).toBe(2);
    }
  });
});
