import { describe, expect, it, vi } from 'vitest';
import { buildQueryParams, requestPostgrest } from '$lib/postgrest-client';

describe('postgrest-client', () => {
  it('returns parsed JSON data on success', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const { data } = await requestPostgrest<Array<{ id: number }>>({
      fetchFn,
      baseUrl: '/api',
      path: 'game',
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(data).toEqual([{ id: 1 }]);
  });

  it('returns undefined data for 204 responses', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    const { data } = await requestPostgrest<void>({
      fetchFn,
      baseUrl: '/api',
      path: 'game',
      method: 'DELETE',
    });

    expect(data).toBeUndefined();
  });

  it('throws PostgrestError with JSON message/details', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'constraint failed', code: '23505' }), {
        status: 409,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(
      requestPostgrest({
        fetchFn,
        baseUrl: '/api',
        path: 'game',
        method: 'POST',
        body: { id: 1 },
        errorMessage: 'Insert failed',
      }),
    ).rejects.toMatchObject({
      name: 'PostgrestError',
      status: 409,
      message: 'constraint failed',
    });
  });

  it('throws PostgrestError with text fallback message', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('db unavailable', { status: 503 }));

    await expect(
      requestPostgrest({
        fetchFn,
        baseUrl: '/api',
        path: 'game',
        errorMessage: 'Request failed',
      }),
    ).rejects.toMatchObject({
      name: 'PostgrestError',
      status: 503,
      message: 'db unavailable',
    });
  });

  it('builds URL from base/path/query and allows url override', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
      )
      .mockResolvedValueOnce(
        new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
      );

    const query = buildQueryParams([
      ['select', 'id,name'],
      ['limit', 10],
      ['offset', 0],
      ['skip', undefined],
    ]);

    await requestPostgrest({
      fetchFn,
      baseUrl: 'https://example.test/api/',
      path: '/games',
      query,
    });

    expect(fetchFn).toHaveBeenNthCalledWith(
      1,
      'https://example.test/api/games?select=id%2Cname&limit=10&offset=0',
      expect.objectContaining({ method: 'GET' }),
    );

    await requestPostgrest({
      fetchFn,
      url: 'https://override.test/items',
      baseUrl: 'https://ignored.test',
      path: 'ignored',
    });

    expect(fetchFn).toHaveBeenNthCalledWith(
      2,
      'https://override.test/items',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
