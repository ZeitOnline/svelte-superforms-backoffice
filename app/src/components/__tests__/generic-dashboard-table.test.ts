import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import GenericDashboardTable from '#components/GenericDashboardTable.svelte';
import { DEFAULT_SORT } from '#lib/game-table-utils.js';
import type {
  GameComplete,
  GameEckchenComplete,
  GameSpellingBeeComplete,
  GameType,
  GameWortgeflechtComplete,
} from '#types';

const gamesPage = {
  page: 1,
  pageSize: 10,
  total: 1,
  totalPages: 1,
  search: '',
  sort: DEFAULT_SORT,
  activeFilter: null,
};

const renderTable = (
  gameName: GameType,
  games: GameComplete[],
  latestActiveGameIds: number[] = [],
) => render(GenericDashboardTable, { games, gameName, gamesPage, latestActiveGameIds });

// A refresh while the dashboard is mounted keeps keyed rows with the same id; they must update in place.
describe('GenericDashboardTable row updates', () => {
  it('shows the live view link once a kept row becomes one of the latest active games', async () => {
    const game = { id: 1, name: 'Eckchen 1', release_date: '2026-10-01', active: true };
    const { rerender } = renderTable('eckchen', [game as GameEckchenComplete], []);

    expect(screen.queryByTitle('Das Spiel mit ID 1 im eckchen anschauen')).not.toBeInTheDocument();

    await rerender({ games: [{ ...game } as GameEckchenComplete], latestActiveGameIds: [1] });

    expect(screen.getByTitle('Das Spiel mit ID 1 im eckchen anschauen')).toBeInTheDocument();
  });

  it('updates the spelling bee solution summary for a kept row', async () => {
    const game = {
      id: 1,
      name: 'Spelling Bee 1',
      start_time: '2026-10-01T00:00:00',
      wordcloud: 'ABCDEFG',
      central_letter: 'A',
      other_letters: 'BCDEFG',
      game_solution: [{ solution: 'abba', points: 1 }],
    };
    const { rerender } = renderTable('spelling-bee', [game as unknown as GameSpellingBeeComplete]);

    expect(screen.getByText('(1 Lösungen)')).toBeInTheDocument();

    await rerender({
      games: [
        {
          ...game,
          game_solution: [
            { solution: 'abba', points: 1 },
            { solution: 'gabbed', points: 6 },
          ],
        } as unknown as GameSpellingBeeComplete,
      ],
    });

    expect(screen.getByText('(2 Lösungen)')).toBeInTheDocument();
    expect(screen.getByText('gabbed')).toBeInTheDocument();
  });

  it('shows the wortgeflecht word legend button once a kept row has words', async () => {
    const game = {
      id: 1,
      game_id: 'wg-1',
      name: 'Wortgeflecht 1',
      published_at: '2026-10-01T00:00:00',
      game_word: [],
    };
    const { rerender } = renderTable('wortgeflecht', [game as GameWortgeflechtComplete]);

    expect(screen.queryByLabelText('Wörter im Rätsel anzeigen')).not.toBeInTheDocument();

    await rerender({
      games: [{ ...game, game_word: [{ word: 'haus' }] } as GameWortgeflechtComplete],
    });

    expect(screen.getByLabelText('Wörter im Rätsel anzeigen')).toBeInTheDocument();
  });
});
