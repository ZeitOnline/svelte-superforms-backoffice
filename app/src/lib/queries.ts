import type { ActiveFilter, GameComplete, GameType, SortOption } from '$types';
import { DEFAULT_SORT } from '$lib/game-table-utils';
import type { LoadEvent } from '@sveltejs/kit';
import { CONFIG_GAMES } from '../config/games.config';
import { deleteEckchenGame } from './games/eckchen';
import { deleteWortgeflechtGame } from './games/wortgeflecht';
import { deleteWortigerGame, LENGTH_TO_LEVEL } from './games/wortiger';
import { deleteSpellingBeeGame } from './games/spelling-bee';
import { buildQueryParams, pg, PostgrestError, requestPostgrest } from './postgrest-client';

/**
 * Mock configuration to skip the deletion of game_state.
 * We do not have game_state in the mock data.
 */
export const SHOULD_DELETE_STATE = false;

const getPostgrestErrorMessage = (error: unknown) => {
  if (error instanceof PostgrestError) {
    if (
      error.details &&
      typeof error.details === 'object' &&
      'message' in error.details &&
      typeof (error.details as { message?: unknown }).message === 'string'
    ) {
      return (error.details as { message: string }).message;
    }
    if (typeof error.details === 'string') {
      return error.details;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
};

const setOrderParam = ({
  params,
  gameName,
  sort,
}: {
  params: URLSearchParams;
  gameName: GameType;
  sort: SortOption;
}) => {
  const sortableColumn = CONFIG_GAMES[gameName].table.columns.find(col => col.sortable);
  const dateField = CONFIG_GAMES[gameName].endpoints.games.releaseDateField;
  const releaseDatePart = `${dateField}.desc`;

  let orderParam = releaseDatePart;
  if (sort === 'az' && sortableColumn) {
    orderParam = `${sortableColumn.key}.asc`;
  } else if (sort === 'za' && sortableColumn) {
    orderParam = `${sortableColumn.key}.desc`;
  } else if (sort === 'dateAsc') {
    orderParam = `${dateField}.asc`;
  } else if (sort === 'dateDesc') {
    orderParam = `${dateField}.desc`;
  }

  params.set('order', orderParam);
};

const setActiveParam = ({
  params,
  gameName,
  activeFilter,
}: {
  params: URLSearchParams;
  gameName: GameType;
  activeFilter: ActiveFilter;
}) => {
  const hasActiveColumn = CONFIG_GAMES[gameName].table.columns.some(col => col.key === 'active');
  if (!hasActiveColumn) return;

  if (activeFilter === 'active') {
    params.set('active', 'eq.true');
  } else if (activeFilter === 'notActive') {
    params.set('active', 'eq.false');
  }
};

const setSearchParam = ({
  params,
  gameName,
  search,
}: {
  params: URLSearchParams;
  gameName: GameType;
  search: string;
}) => {
  const trimmedSearch = search.trim();
  if (!trimmedSearch) return;

  const searchableColumns = CONFIG_GAMES[gameName].table.columns.filter(col => col.searchable);
  const numericColumns = new Set(['id', 'level']);
  const dateColumns = new Set(['release_date', 'start_time', 'published_at']);
  const spellingBeeSolutionColumn = 'game_solution.solution';

  const isNumeric = /^[0-9]+$/.test(trimmedSearch);
  const isDateLike = /^[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(trimmedSearch);

  const filters: string[] = [];

  for (const column of searchableColumns) {
    const key = column.key;
    if (numericColumns.has(key)) {
      if (isNumeric) {
        filters.push(`${key}.eq.${trimmedSearch}`);
      }
      continue;
    }

    if (dateColumns.has(key)) {
      if (isDateLike) {
        filters.push(`${key}.eq.${trimmedSearch}`);
      }
      continue;
    }

    filters.push(`${key}.ilike.*${trimmedSearch}*`);
  }

  if (gameName === 'spelling-bee') {
    filters.push(
      `and(${spellingBeeSolutionColumn}=ilike.*${trimmedSearch}*,game_solution.points=eq.12)`,
    );
  }

  if (filters.length > 0) {
    params.set('or', `(${filters.join(',')})`);
  }
};

const setWortigerLevelParam = ({
  params,
  gameName,
  levelLength,
}: {
  params: URLSearchParams;
  gameName: GameType;
  levelLength: number | null;
}) => {
  if (gameName !== 'wortiger' || !levelLength) return;
  const level = LENGTH_TO_LEVEL[levelLength];
  if (!level) return;
  params.set('level', `eq.${level}`);
};

/**
 * Get all games from the backend.
 * @returns all games
 */
export const getAllGames = async ({
  gameName,
  fetch,
  page = 1,
  pageSize = 10,
  search = '',
  sort = DEFAULT_SORT,
  activeFilter = null,
  levelLength = null,
}: {
  gameName: GameType;
  fetch: LoadEvent['fetch'];
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: SortOption;
  activeFilter?: ActiveFilter;
  levelLength?: number | null;
}) => {
  const trimmedSearch = search.trim();
  const useSpellingBeeSearchRpc =
    gameName === 'spelling-bee' && !!trimmedSearch;

  // If this is spelling-bee, embed solutions directly
  const selectParam =
    gameName === 'spelling-bee'
      ? 'id,name,start_time,wordcloud,game_solution(solution,points,solution_type,solution_explanation)'
      : '*';

  const baseUrl = useSpellingBeeSearchRpc
    ? `${CONFIG_GAMES[gameName].apiBase}/rpc/search_spelling_bee`
    : `${CONFIG_GAMES[gameName].apiBase}/${CONFIG_GAMES[gameName].endpoints.games.name}`;
  const offset = (page - 1) * pageSize;

  const params = new URLSearchParams();
  params.set('select', selectParam);
  params.set('limit', String(pageSize));
  params.set('offset', String(offset));
  if (useSpellingBeeSearchRpc) {
    params.set('term', trimmedSearch);
  }

  setOrderParam({ params, gameName, sort });
  setActiveParam({ params, gameName, activeFilter });
  setWortigerLevelParam({ params, gameName, levelLength });

  if (!useSpellingBeeSearchRpc) {
    setSearchParam({ params, gameName, search });
  }

  const { data, response } = await requestPostgrest<GameComplete[]>({
    fetchFn: fetch,
    url: baseUrl,
    query: params,
    headers: {
      Prefer: 'count=exact',
    },
    errorMessage: `Failed to fetch ${gameName} games`,
  });
  const contentRange = response.headers.get('content-range');
  let total = data.length;
  if (contentRange) {
    const [, totalStr] = contentRange.split('/');
    const parsed = Number(totalStr);
    if (Number.isFinite(parsed)) {
      total = parsed;
    }
  }

  return { games: data, total };
};

export const getLatestActiveGameIds = async ({
  gameName,
  fetch,
  limit = 20,
}: {
  gameName: GameType;
  fetch: LoadEvent['fetch'];
  limit?: number;
}) => {
  const hasActiveColumn = CONFIG_GAMES[gameName].table.columns.some(col => col.key === 'active');
  if (!hasActiveColumn) {
    return [];
  }
  const baseUrl = `${CONFIG_GAMES[gameName].apiBase}/${CONFIG_GAMES[gameName].endpoints.games.name}`;
  const dateField = CONFIG_GAMES[gameName].endpoints.games.releaseDateField;
  const params = buildQueryParams([
    ['select', 'id'],
    ['active', pg.eq(true)],
    ['order', pg.order(dateField, 'desc')],
    ['limit', limit],
  ]);
  const { data } = await requestPostgrest<Array<{ id: number }>>({
    fetchFn: fetch,
    url: baseUrl,
    query: params,
    errorMessage: `Failed to fetch latest active ${gameName} games`,
  });
  return data.map(row => row.id);
};

/**
 * deletes a game by its id along with all the questions associated with it and the game_state.
 * @param id the id of the game to be deleted
 * @returns the status of the deletion
 */
export const deleteGame = async (gameName: GameType, id: number) => {
  if (gameName === 'eckchen') {
    return deleteEckchenGame(id);
  } else if (gameName === 'wortiger') {
    return deleteWortigerGame(id);
  } else if (gameName === 'spelling-bee') {
    return deleteSpellingBeeGame(id);
  } else if (gameName === 'wortgeflecht') {
    return deleteWortgeflechtGame(id);
  } else {
    throw new Error(`Unsupported game type: ${gameName}`);
  }
};

/**
 * Updates a game by its id.
 * @param id - the id of the game to be updated
 * @param data - the data to be updated
 * @returns the updated game
 */
export const updateGame = async ({
  gameName,
  gameId: id,
  data,
}: {
  gameName: GameType;
  gameId: number;
  data: Partial<GameComplete>;
}) => {
  try {
    const { data: updatedGame } = await requestPostgrest<GameComplete[]>({
      baseUrl: `${CONFIG_GAMES[gameName].apiBase}/${CONFIG_GAMES[gameName].endpoints.games.name}`,
      method: 'PATCH',
      query: buildQueryParams([['id', pg.eq(id)]]),
      headers: {
        Prefer: 'return=representation',
      },
      body: data,
      errorMessage: `Failed to update game with id: ${id}`,
    });
    return updatedGame;
  } catch (error) {
    console.error('Failed to update the game', error);
    throw error;
  }
};

/**
 * Create a game.
 * @param gameName - the game type
 * @param data - the data to be created
 * @returns the created game
 */
export async function createGame({
  gameName,
  data,
}: {
  gameName: GameType;
  data: GameComplete;
}): Promise<GameComplete[]> {
  const { data: game } = await requestPostgrest<GameComplete[]>({
    baseUrl: `${CONFIG_GAMES[gameName].apiBase}/${CONFIG_GAMES[gameName].endpoints.games.name}`,
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: 'Failed to create game',
  });
  return game;
}

/**
 * Bulk insert games using PostgREST (JSON array).
 * Returns the inserted rows (Prefer: return=representation).
 * Optionally pass on_conflict columns if you want upsert.
 */
export async function createGamesBulk({
  gameName,
  rows,
  onConflict, // e.g. 'release_date,level'
}: {
  gameName: GameType;
  rows: Array<Partial<GameComplete> & Record<string, unknown>>;
  onConflict?: string;
}) {
  try {
    const { data } = await requestPostgrest<Array<Partial<GameComplete> & Record<string, unknown>>>({
      baseUrl: `${CONFIG_GAMES[gameName].apiBase}/${CONFIG_GAMES[gameName].endpoints.games.name}`,
      method: 'POST',
      query: onConflict ? buildQueryParams([['on_conflict', onConflict]]) : undefined,
      headers: {
        // Use `resolution=merge-duplicates` to upsert instead of insert-only
        // Remove it if you want pure inserts that error on duplicates.
        Prefer: onConflict
          ? 'resolution=merge-duplicates,return=representation'
          : 'return=representation',
      },
      body: rows,
      errorMessage: 'Bulk insert failed',
    });
    return data;
  } catch (error) {
    if (error instanceof PostgrestError) {
      throw new Error(`Bulk insert failed (${error.status}): ${getPostgrestErrorMessage(error)}`);
    }
    throw error;
  }
}

/**
 * Get the next available date for a game.
 * @param gameName - the game type
 * @returns the next available date for a game in string format
 */
export const getNextAvailableDateForGame = async (gameName: GameType, apiBaseUrl?: string) => {
  const baseUrl = apiBaseUrl || CONFIG_GAMES[gameName].apiBase;
  const dateField = CONFIG_GAMES[gameName].endpoints.games.releaseDateField;
  const { data } = await requestPostgrest<Array<Record<string, string>>>({
    baseUrl,
    path: CONFIG_GAMES[gameName].endpoints.games.name,
    query: buildQueryParams([
      ['select', dateField],
      ['order', pg.order(dateField, 'desc')],
      ['limit', 1],
    ]),
    errorMessage: `Failed to fetch next available date for ${gameName}`,
  });

  if (!data?.length) {
    return new Date().toISOString().split('T')[0];
  }

  const lastFieldValue = data[0][dateField];

  const lastDateString =
    gameName === 'spelling-bee' ? lastFieldValue.split('T')[0] : lastFieldValue;

  const today = new Date().toISOString().split('T')[0];
  const isDateInThePast = lastDateString < today;

  if (isDateInThePast) {
    return today;
  }

  return lastDateString;
};
