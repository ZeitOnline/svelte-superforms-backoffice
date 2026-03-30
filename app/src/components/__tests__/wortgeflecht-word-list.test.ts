import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WortgeflechtWordList from '$components/games/wortgeflecht/WortgeflechtWordList.svelte';

const makeJsonResponse = (data: unknown, contentRange: string) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'content-range': contentRange,
    },
  });

const toAlphaSuffix = (value: number) => {
  const first = String.fromCharCode(97 + Math.floor(value / 26));
  const second = String.fromCharCode(97 + (value % 26));
  return `${first}${second}`;
};

const createWords = (start: number, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    word: `probewort${toAlphaSuffix(start + index)}`,
  }));

const getCalledUrl = (fetchMock: ReturnType<typeof vi.fn>, callIndex: number) => {
  const [url] = fetchMock.mock.calls[callIndex] ?? [];
  return new URL(String(url), 'http://localhost');
};

describe('WortgeflechtWordList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('loads the first 50 dictionary words with pagination metadata', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(makeJsonResponse(createWords(0, 50), '0-49/104'));

    vi.stubGlobal('fetch', fetchMock);

    render(WortgeflechtWordList);

    await screen.findByText('1-50 von 104 Wörtern');

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const calledUrl = getCalledUrl(fetchMock, 0);
    expect(calledUrl.pathname).toBe('/backoffice/api/wortgeflecht/dictionary_read');
    expect(calledUrl.searchParams.get('select')).toBe('word');
    expect(calledUrl.searchParams.get('order')).toBe('sort_key.asc,word.asc');
    expect(calledUrl.searchParams.get('limit')).toBe('50');
    expect(calledUrl.searchParams.get('offset')).toBe('0');
  });

  it('searches across all dictionary words and resets to page 1', async () => {
    vi.useFakeTimers();

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(makeJsonResponse(createWords(0, 50), '0-49/104'))
      .mockResolvedValueOnce(makeJsonResponse(createWords(50, 50), '50-99/104'))
      .mockResolvedValueOnce(makeJsonResponse([{ word: 'wasser' }, { word: 'wandel' }], '0-1/2'));

    vi.stubGlobal('fetch', fetchMock);

    render(WortgeflechtWordList);

    await screen.findByText('1-50 von 104 Wörtern');

    await fireEvent.click(screen.getByLabelText('Next page'));
    await screen.findByText('51-100 von 104 Wörtern');

    await fireEvent.input(screen.getByLabelText('Nach Wörtern suchen'), {
      target: { value: 'wa' },
    });
    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(screen.getByText('2 Treffer')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const calledUrl = getCalledUrl(fetchMock, 2);
    expect(calledUrl.searchParams.get('offset')).toBe('0');
    expect(calledUrl.searchParams.get('limit')).toBe('50');
    expect(calledUrl.searchParams.get('word')).toBe('ilike.*wa*');
  });
});
