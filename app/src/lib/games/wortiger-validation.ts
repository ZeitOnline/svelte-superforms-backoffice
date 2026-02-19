import { MAP_LEVEL_CHARACTERS } from '$lib/games/wortiger';
import { buildQueryParams, requestPostgrest } from '$lib/postgrest-client';
import type { GameWortiger } from '$types';

export type WordListRule = 'must-exist' | 'must-not-exist';

export type LastUsedInfo = {
  count: number;
  lastDate?: string;
};

export const normalizeWortigerWord = (value: string) => value.trim().toLocaleLowerCase('de-DE');

const levelToLength = (level: number) => MAP_LEVEL_CHARACTERS[level];

export function validateAgainstWordList(options: {
  level: number;
  value: string;
  wordSets: Record<number, Set<string>>;
  rule: WordListRule;
}): string | null {
  const v = (options.value ?? '').trim();
  if (!v) return null;

  const length = levelToLength(options.level);
  if (!length) return null;

  const set = options.wordSets[length];
  if (!set || set.size === 0) {
    return `❌ Wortliste für ${length} Buchstaben ist noch nicht geladen`;
  }

  const exists = set.has(normalizeWortigerWord(v));
  if (options.rule === 'must-exist' && !exists) {
    return `❌ „${v}“ ist nicht in der ${length}-Buchstaben-Wortliste`;
  }
  if (options.rule === 'must-not-exist' && exists) {
    return `❌ „${v}“ existiert bereits in der ${length}-Buchstaben-Wortliste`;
  }
  return null;
}

export function buildWordSetFromResponse(rows: Array<{ word?: string }>): Set<string> {
  const set = new Set<string>();
  for (const row of rows) {
    if (row?.word) {
      set.add(normalizeWortigerWord(row.word));
    }
  }
  return set;
}

export async function fetchWordSetForLength(options: {
  apiBase: string;
  endpointName: string;
  length: number;
  fetchFn?: typeof fetch;
}): Promise<Set<string>> {
  const { data } = await requestPostgrest<Array<{ word?: string }>>({
    fetchFn: options.fetchFn,
    baseUrl: options.apiBase,
    path: `${options.endpointName}_${options.length}`,
    query: buildQueryParams([['select', 'word']]),
    errorMessage: `Fetch failed for ${options.length}`,
  });
  return buildWordSetFromResponse(data);
}

export function getLastUsedInfo(options: {
  games: Array<GameWortiger & { id?: number }>;
  level: number;
  value: string;
  excludeId?: number;
}): LastUsedInfo | null {
  const v = (options.value ?? '').trim();
  if (!v) return null;

  const length = levelToLength(options.level);
  let count = 0;
  let lastDate: string | undefined;

  for (const g of options.games) {
    if (options.excludeId && g.id === options.excludeId) continue;
    if (length && (g.solution ?? '').trim().length !== length) continue;
    if (normalizeWortigerWord(g.solution ?? '') !== normalizeWortigerWord(v)) continue;

    count += 1;
    if (g.release_date && (!lastDate || g.release_date > lastDate)) {
      lastDate = g.release_date;
    }
  }

  if (count === 0) return null;
  return { count, lastDate };
}
