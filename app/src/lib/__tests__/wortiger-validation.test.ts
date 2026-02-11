import { describe, expect, it, vi } from 'vitest';
import {
  buildWordSetFromResponse,
  fetchWordSetForLength,
  getLastUsedInfo,
  normalizeWortigerWord,
  validateAgainstWordList,
} from '$lib/games/wortiger-validation';

describe('wortiger-validation', () => {
  it('normalizes words (trim + lowercase)', () => {
    expect(normalizeWortigerWord('  ÄRGER ')).toBe('ärger');
  });

  it('returns null for empty value', () => {
    const result = getLastUsedInfo({
      games: [],
      level: 4,
      value: '   ',
    });
    expect(result).toBeNull();
  });

  it('returns count and most recent date for matches', () => {
    const result = getLastUsedInfo({
      games: [
        { id: 1, level: 4, solution: 'WORT', release_date: '2025-01-01' },
        { id: 2, level: 4, solution: 'wort', release_date: '2025-02-01' },
      ],
      level: 4,
      value: 'WORT',
    });

    expect(result).toEqual({ count: 2, lastDate: '2025-02-01' });
  });

  it('excludes current game id', () => {
    const result = getLastUsedInfo({
      games: [
        { id: 1, level: 4, solution: 'WORT', release_date: '2025-01-01' },
        { id: 2, level: 4, solution: 'WORT', release_date: '2025-02-01' },
      ],
      level: 4,
      value: 'WORT',
      excludeId: 2,
    });

    expect(result).toEqual({ count: 1, lastDate: '2025-01-01' });
  });

  it('filters by level length', () => {
    const result = getLastUsedInfo({
      games: [
        { id: 1, level: 3, solution: 'WORTS', release_date: '2025-01-01' }, // 5 letters
        { id: 2, level: 4, solution: 'WORT', release_date: '2025-02-01' }, // 4 letters
      ],
      level: 4,
      value: 'WORT',
    });

    expect(result).toEqual({ count: 1, lastDate: '2025-02-01' });
  });

  it('builds a normalized word set from response', () => {
    const set = buildWordSetFromResponse([{ word: 'WORT' }, { word: '  ÄRGER ' }]);
    expect(set.has('wort')).toBe(true);
    expect(set.has('ärger')).toBe(true);
  });

  it('validates against word list (must-exist)', () => {
    const wordSets: Record<number, Set<string>> = {
      4: new Set<string>(['wort']),
      5: new Set<string>(),
      6: new Set<string>(),
      7: new Set<string>(),
    };

    expect(
      validateAgainstWordList({ level: 4, value: 'WORT', wordSets, rule: 'must-exist' }),
    ).toBeNull();
    expect(
      validateAgainstWordList({ level: 4, value: 'FAIL', wordSets, rule: 'must-exist' }),
    ).toMatch(/nicht in der 4-Buchstaben-Wortliste/i);
  });

  it('blocks when word list is missing and policy is block', () => {
    const wordSets: Record<number, Set<string>> = {
      4: new Set<string>(),
      5: new Set<string>(),
      6: new Set<string>(),
      7: new Set<string>(),
    };

    expect(
      validateAgainstWordList({
        level: 4,
        value: 'WORT',
        wordSets,
        rule: 'must-exist',
      }),
    ).toMatch(/noch nicht geladen/i);
  });

  it('validates against word list (must-not-exist)', () => {
    const wordSets: Record<number, Set<string>> = {
      4: new Set<string>(['wort']),
      5: new Set<string>(),
      6: new Set<string>(),
      7: new Set<string>(),
    };

    expect(
      validateAgainstWordList({ level: 4, value: 'WORT', wordSets, rule: 'must-not-exist' }),
    ).toMatch(/existiert bereits in der 4-Buchstaben-Wortliste/i);
  });

  it('fetches word list for a length', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ word: 'WORT' }],
    });

    const set = await fetchWordSetForLength({
      apiBase: 'https://example.test',
      endpointName: 'wortliste',
      length: 4,
      fetchFn,
    });

    expect(fetchFn).toHaveBeenCalledWith(
      'https://example.test/wortliste_4?select=word',
    );
    expect(set.has('wort')).toBe(true);
  });
});
