import { CONFIG_GAMES } from '../../config/games.config';
import {
  buildQueryParams,
  parseContentRangeTotal,
  pg,
  requestPostgrest,
} from '$lib/postgrest-client';
import type { GameComplete, SortDirection } from '$types';
import { toCSV } from '$components/games/wortiger/utils';

/**
 * The characters per level in the Wortiger game.
 */
export const MAP_LEVEL_CHARACTERS: Record<number, number> = {
  1: 7,
  2: 6,
  3: 5,
  4: 4,
};

export const WORTIGER_LENGTHS = Object.values(MAP_LEVEL_CHARACTERS).sort((a, b) => a - b);

export const LENGTH_TO_LEVEL: Record<number, number> = Object.fromEntries(
  Object.entries(MAP_LEVEL_CHARACTERS).map(([level, length]) => [Number(length), Number(level)]),
);

export const isWortigerLength = (length: number): length is (typeof WORTIGER_LENGTHS)[number] =>
  WORTIGER_LENGTHS.includes(length);

const DEFAULT_WORTIGER_EXPORT_PAGE_SIZE = 1000;

const getWortigerWordTable = (length: number) =>
  `${CONFIG_GAMES.wortiger.endpoints.wordList!.name}_${length}`;

const normalizeWords = (data: Array<{ word: string }>) =>
  data
    .map(item => item.word)
    .filter((item): item is string => typeof item === 'string' && item.length > 0);

const deleteWortigerGameById = async (id: number) =>
  requestPostgrest<unknown>({
    baseUrl: CONFIG_GAMES.wortiger.apiBase,
    path: CONFIG_GAMES.wortiger.endpoints.games.name,
    method: 'DELETE',
    query: buildQueryParams([['id', pg.eq(id)]]),
    errorMessage: `Failed to delete Wortiger game with id: ${id}`,
  });

const updateWortigerGameById = async (id: number, data: Partial<GameComplete>) =>
  requestPostgrest<GameComplete[], Partial<GameComplete>>({
    baseUrl: CONFIG_GAMES.wortiger.apiBase,
    path: CONFIG_GAMES.wortiger.endpoints.games.name,
    method: 'PATCH',
    query: buildQueryParams([['id', pg.eq(id)]]),
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: `Failed to update game with id: ${id}`,
  });

const createWortigerGameRow = async (data: GameComplete) =>
  requestPostgrest<GameComplete[], GameComplete>({
    baseUrl: CONFIG_GAMES.wortiger.apiBase,
    path: CONFIG_GAMES.wortiger.endpoints.games.name,
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: 'Failed to create game',
  });

export const deleteWortigerGame = async (id: number) => {
  try {
    const { response } = await deleteWortigerGameById(id);

    console.log(`Successfully deleted Wortiger game with id: ${id}`);
    return response.statusText;
  } catch (error) {
    console.error('Error deleting Wortiger game:', error);
    throw error;
  }
};

export const updateWortigerGame = async ({
  gameId,
  data,
}: {
  gameId: number;
  data: Partial<GameComplete>;
}) => {
  const { data: updatedGame } = await updateWortigerGameById(gameId, data);
  return updatedGame;
};

export async function createWortigerGame(data: GameComplete): Promise<GameComplete[]> {
  const { data: game } = await createWortigerGameRow(data);
  return game;
}

export async function fetchWortigerGamesByLevels<T extends object>({
  levelIds,
  select,
  errorMessagePrefix = 'Failed to fetch existing Wortiger games for levels',
}: {
  levelIds: number[];
  select: string;
  errorMessagePrefix?: string;
}): Promise<T[]> {
  if (levelIds.length === 0) return [];

  const uniqueLevelIds = Array.from(new Set(levelIds));
  const { data } = await requestPostgrest<T[]>({
    baseUrl: CONFIG_GAMES.wortiger.apiBase,
    path: CONFIG_GAMES.wortiger.endpoints.games.name,
    query: buildQueryParams([
      ['select', select],
      ['level', pg.in(uniqueLevelIds)],
    ]),
    errorMessage: `${errorMessagePrefix} [${uniqueLevelIds.join(', ')}]`,
  });

  return data;
}

export async function fetchAllWortigerWordsForExport({
  length,
  search = '',
  direction = 'asc',
  pageSize = DEFAULT_WORTIGER_EXPORT_PAGE_SIZE,
}: {
  length: number;
  search?: string;
  direction?: SortDirection;
  pageSize?: number;
}) {
  const trimmedSearch = search.trim();
  const table = getWortigerWordTable(length);
  const normalizedPageSize = Math.max(1, pageSize);
  const rows: string[] = [];
  let offset = 0;

  while (true) {
    const { data, response } = await requestPostgrest<Array<{ word: string }>>({
      baseUrl: CONFIG_GAMES.wortiger.apiBase,
      path: table,
      query: buildQueryParams([
        ['select', 'word'],
        ['order', pg.order('word', direction)],
        ['limit', normalizedPageSize],
        ['offset', offset],
        ['word', trimmedSearch ? `ilike.*${trimmedSearch}*` : undefined],
      ]),
      headers: {
        Prefer: 'count=exact',
      },
    });

    rows.push(...normalizeWords(data));
    const total = parseContentRangeTotal(response, rows.length);
    if (rows.length >= total) break;
    offset += normalizedPageSize;
  }

  return rows;
}

export async function exportWortigerWordListCsv({
  length,
  search = '',
  direction = 'asc',
}: {
  length: number;
  search?: string;
  direction?: SortDirection;
}) {
  const exportWords = await fetchAllWortigerWordsForExport({
    length,
    search,
    direction,
  });
  const rows: string[][] = [['Wort'], ...exportWords.map(word => [word])];
  const csv = '\uFEFF' + toCSV(rows, ';');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wortiger_${length}.csv`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}
