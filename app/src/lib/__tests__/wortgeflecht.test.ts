import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createWortgeflechtDictionaryWord,
  deleteWortgeflechtDictionaryWord,
  fetchWortgeflechtDictionaryPage,
  fetchWortgeflechtDictionaryWords,
  fetchWortgeflechtLettersByGameId,
  replaceWortgeflechtLettersByGameId,
  sortWortgeflechtRowsByWordThenLetter,
  type WortgeflechtLetterRow,
  updateWortgeflechtDictionaryWord,
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

  it('fetches wortgeflecht dictionary words sorted alphabetically', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([{ word: 'zebra' }, { word: 'ähre' }, { word: 'apfel' }, { word: '' }]),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const words = await fetchWortgeflechtDictionaryWords();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/dictionary_read?select=word&order=sort_key.asc%2Cword.asc'),
      {
        method: 'GET',
        headers: expect.any(Headers),
        body: undefined,
      },
    );
    expect(words).toEqual(['ähre', 'apfel', 'zebra']);
  });

  it('fetches wortgeflecht dictionary pages with count-aware search params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ word: 'wortalpha' }, { word: 'wortbeta' }]), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-range': '100-101/145',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchWortgeflechtDictionaryPage({
      page: 2,
      pageSize: 50,
      search: 'wort',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '/dictionary_read?select=word&order=sort_key.asc%2Cword.asc&limit=50&offset=50&word=ilike.*wort*',
      ),
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers),
      }),
    );
    expect(result).toEqual({
      words: ['wortalpha', 'wortbeta'],
      total: 145,
    });
  });

  it('normalizes dictionary words to lowercase before inserting them', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ word: 'süßlich' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const word = await createWortgeflechtDictionaryWord('SÜẞLICH');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/dictionary'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ word: 'süßlich' }),
      }),
    );
    expect(word).toBe('süßlich');
  });

  it('normalizes dictionary words before updating them', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ word: 'süßholz' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const word = await updateWortgeflechtDictionaryWord({
      oldWord: 'SÜẞLICH',
      nextWord: 'SÜẞHOLZ',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/dictionary?word=eq.s%C3%BC%C3%9Flich'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ word: 'süßholz' }),
      }),
    );
    expect(word).toBe('süßholz');
  });

  it('normalizes dictionary words before deleting them', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await deleteWortgeflechtDictionaryWord('SÜẞLICH');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/dictionary?word=eq.s%C3%BC%C3%9Flich'),
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });

  it('normalizes words to lowercase before inserting wortgeflecht rows', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 21, word: 'süßlich' }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await replaceWortgeflechtLettersByGameId({
      gameId: '00000000-0000-0000-0000-000000000001',
      rows: [
        { word: 'SÜẞLICH', letter: 's', cx: 1, cy: 1 },
        { word: 'SÜẞLICH', letter: 'ü', cx: 1, cy: 2 },
      ],
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/game_word'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify([
          {
            game_id: '00000000-0000-0000-0000-000000000001',
            word: 'süßlich',
          },
        ]),
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('/game_letter'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify([
          { word_id: 21, letter: 's', cx: 1, cy: 1 },
          { word_id: 21, letter: 'ü', cx: 1, cy: 2 },
        ]),
      }),
    );
  });
});
