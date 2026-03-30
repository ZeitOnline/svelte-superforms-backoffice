import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WortigerWordList from '$components/games/wortiger/WortigerWordList.svelte';

const makeJsonResponse = (data: unknown, contentRange: string) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'content-range': contentRange,
    },
  });

const createWords = (start: number, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    word: `w${String(start + index).padStart(3, '0')}`,
  }));

const getCalledUrl = (fetchMock: ReturnType<typeof vi.fn>, callIndex: number) => {
  const [url] = fetchMock.mock.calls[callIndex] ?? [];
  return new URL(String(url), 'http://localhost');
};

describe('WortigerWordList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('loads the first 50 words with count-aware pagination', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(makeJsonResponse(createWords(0, 50), '0-49/250'));

    vi.stubGlobal('fetch', fetchMock);

    render(WortigerWordList);

    await screen.findByText('1-50 von 250 Wörtern mit 4 Buchstaben');

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const calledUrl = getCalledUrl(fetchMock, 0);
    expect(calledUrl.pathname).toBe('/backoffice/api/wortiger/wortliste_read_4');
    expect(calledUrl.searchParams.get('select')).toBe('word');
    expect(calledUrl.searchParams.get('order')).toBe('sort_key.asc,word.asc');
    expect(calledUrl.searchParams.get('limit')).toBe('50');
    expect(calledUrl.searchParams.get('offset')).toBe('0');

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const requestHeaders = requestInit?.headers as Headers | undefined;
    expect(requestHeaders?.get('Prefer')).toBe('count=exact');
  });

  it('requests the next page with the correct offset', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(makeJsonResponse(createWords(0, 50), '0-49/250'))
      .mockResolvedValueOnce(makeJsonResponse(createWords(50, 50), '50-99/250'));

    vi.stubGlobal('fetch', fetchMock);

    render(WortigerWordList);

    await screen.findByText('1-50 von 250 Wörtern mit 4 Buchstaben');

    await fireEvent.click(screen.getByLabelText('Next page'));

    await screen.findByText('51-100 von 250 Wörtern mit 4 Buchstaben');

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const calledUrl = getCalledUrl(fetchMock, 1);
    expect(calledUrl.searchParams.get('offset')).toBe('50');
    expect(calledUrl.searchParams.get('limit')).toBe('50');
  });

  it('searches across all words and resets pagination to the first page', async () => {
    vi.useFakeTimers();

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(makeJsonResponse(createWords(0, 50), '0-49/250'))
      .mockResolvedValueOnce(makeJsonResponse(createWords(50, 50), '50-99/250'))
      .mockResolvedValueOnce(makeJsonResponse([{ word: 'wolf' }, { word: 'woge' }], '0-1/2'));

    vi.stubGlobal('fetch', fetchMock);

    render(WortigerWordList);

    await screen.findByText('1-50 von 250 Wörtern mit 4 Buchstaben');

    await fireEvent.click(screen.getByLabelText('Next page'));
    await screen.findByText('51-100 von 250 Wörtern mit 4 Buchstaben');

    await fireEvent.input(screen.getByLabelText('Nach Wörtern suchen'), {
      target: { value: 'wo' },
    });
    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(screen.getByText('2 Treffer in der 4-Buchstaben-Liste')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const calledUrl = getCalledUrl(fetchMock, 2);
    expect(calledUrl.searchParams.get('offset')).toBe('0');
    expect(calledUrl.searchParams.get('limit')).toBe('50');
    expect(calledUrl.searchParams.get('word')).toBe('ilike.*wo*');
  });
});
