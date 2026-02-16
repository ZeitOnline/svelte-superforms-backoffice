import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWortgeflechtLettersByGameId,
  sortWortgeflechtRowsByWordThenLetter,
  type WortgeflechtLetterRow,
} from '$lib/games/wortgeflecht';

describe('wortgeflecht helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sorts rows by word then letter (and then coordinates)', () => {
    const input: WortgeflechtLetterRow[] = [
      { word: 'Wasser', letter: 'r', cx: 7, cy: 1 },
      { word: 'besen', letter: 'e', cx: 4, cy: 6 },
      { word: 'wasser', letter: 'a', cx: 6, cy: 1 },
      { word: 'Besen', letter: 'b', cx: 5, cy: 5 },
      { word: 'besen', letter: 'e', cx: 6, cy: 6 },
    ];

    const sorted = sortWortgeflechtRowsByWordThenLetter(input);

    expect(sorted).toEqual([
      { word: 'Besen', letter: 'b', cx: 5, cy: 5 },
      { word: 'besen', letter: 'e', cx: 4, cy: 6 },
      { word: 'besen', letter: 'e', cx: 6, cy: 6 },
      { word: 'wasser', letter: 'a', cx: 6, cy: 1 },
      { word: 'Wasser', letter: 'r', cx: 7, cy: 1 },
    ]);
  });

  it('fetches and flattens game letters, returning sorted rows', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 11,
          word: 'wasser',
          game_letter: [
            { letter: 's', cx: 8, cy: 2 },
            { letter: 'a', cx: 6, cy: 1 },
          ],
        },
        {
          id: 10,
          word: 'besen',
          game_letter: [
            { letter: 'e', cx: 4, cy: 6 },
            { letter: 'b', cx: 5, cy: 5 },
          ],
        },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);

    const rows = await fetchWortgeflechtLettersByGameId('00000000-0000-0000-0000-000000000001');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/game_word?game_id=eq.00000000-0000-0000-0000-000000000001'),
      {
        method: 'GET',
        headers: expect.any(Headers),
        body: undefined,
      },
    );
    expect(rows).toEqual([
      { word: 'besen', letter: 'b', cx: 5, cy: 5 },
      { word: 'besen', letter: 'e', cx: 4, cy: 6 },
      { word: 'wasser', letter: 'a', cx: 6, cy: 1 },
      { word: 'wasser', letter: 's', cx: 8, cy: 2 },
    ]);
  });
});
