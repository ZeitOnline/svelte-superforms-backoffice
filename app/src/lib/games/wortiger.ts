import { CONFIG_GAMES } from '../../config/games.config';
import { buildQueryParams, pg, requestPostgrest } from '$lib/postgrest-client';

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

export const deleteWortigerGame = async (id: number) => {
  try {
    const { response } = await requestPostgrest<unknown>({
      baseUrl: CONFIG_GAMES['wortiger'].apiBase,
      path: CONFIG_GAMES['wortiger'].endpoints.games.name,
      method: 'DELETE',
      query: buildQueryParams([['id', pg.eq(id)]]),
      errorMessage: `Failed to delete Wortiger game with id: ${id}`,
    });

    console.log(`Successfully deleted Wortiger game with id: ${id}`);
    return response.statusText;
  } catch (error) {
    console.error('Error deleting Wortiger game:', error);
    throw error;
  }
};
