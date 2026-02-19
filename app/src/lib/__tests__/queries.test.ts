import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAllGames } from '$lib/queries';

const makeJsonResponse = (data: unknown, contentRange?: string) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      ...(contentRange ? { 'content-range': contentRange } : {}),
    },
  });

const getCalledUrl = (fetchMock: ReturnType<typeof vi.fn>) => {
  const [url] = fetchMock.mock.calls[0] ?? [];
  return new URL(String(url), 'http://localhost');
};

describe('queries.getAllGames', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds params for normal search + sort', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse([{ id: 1 }], '0-0/42'));

    const result = await getAllGames({
      gameName: 'eckchen',
      fetch: fetchMock as unknown as typeof fetch,
      page: 2,
      pageSize: 10,
      search: 'abc',
      sort: 'az',
    });

    const calledUrl = getCalledUrl(fetchMock);
    expect(calledUrl.pathname).toBe('/backoffice/api/eckchen/game');
    expect(calledUrl.searchParams.get('select')).toBe('*');
    expect(calledUrl.searchParams.get('limit')).toBe('10');
    expect(calledUrl.searchParams.get('offset')).toBe('10');
    expect(calledUrl.searchParams.get('order')).toBe('name.asc');
    expect(calledUrl.searchParams.get('or')).toBe('(name.ilike.*abc*)');
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const requestHeaders = requestInit?.headers as Headers | undefined;
    expect(requestInit?.method).toBe('GET');
    expect(requestHeaders?.get('Prefer')).toBe('count=exact');
    expect(result).toEqual({ games: [{ id: 1 }], total: 42 });
  });

  it('uses spelling-bee RPC path and term when searching', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse([{ id: 7 }], '0-0/1'));

    await getAllGames({
      gameName: 'spelling-bee',
      fetch: fetchMock as unknown as typeof fetch,
      search: 'Biene',
      sort: 'dateDesc',
    });

    const calledUrl = getCalledUrl(fetchMock);
    expect(calledUrl.pathname).toBe('/backoffice/api/spelling-bee/rpc/search_spelling_bee');
    expect(calledUrl.searchParams.get('term')).toBe('Biene');
    expect(calledUrl.searchParams.get('or')).toBeNull();
    expect(calledUrl.searchParams.get('select')).toContain('game_solution');
  });

  it('applies active filter when active column exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse([{ id: 1 }], '0-0/1'));

    await getAllGames({
      gameName: 'eckchen',
      fetch: fetchMock as unknown as typeof fetch,
      activeFilter: 'active',
    });

    const calledUrl = getCalledUrl(fetchMock);
    expect(calledUrl.searchParams.get('active')).toBe('eq.true');
  });

  it('applies level filter for wortiger from levelLength', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse([{ id: 3 }], '0-0/1'));

    await getAllGames({
      gameName: 'wortiger',
      fetch: fetchMock as unknown as typeof fetch,
      levelLength: 4,
    });

    const calledUrl = getCalledUrl(fetchMock);
    expect(calledUrl.searchParams.get('level')).toBe('eq.4');
  });
});
