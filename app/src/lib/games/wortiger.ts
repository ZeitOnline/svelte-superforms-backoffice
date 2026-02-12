import { CONFIG_GAMES } from '../../config/games.config';

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
  const URL = `${CONFIG_GAMES['wortiger'].apiBase}/${CONFIG_GAMES['wortiger'].endpoints.games.name}?id=eq.${id}`;

  try {
    const response = await fetch(URL, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(
        `Failed to delete Wortiger game with id: ${id}. Status: ${response.status}. Error: ${errorMessage}`,
      );
      throw new Error(
        `Failed to delete Wortiger game with id: ${id}. Status: ${response.status}. Error: ${errorMessage}`,
      );
    }

    console.log(`Successfully deleted Wortiger game with id: ${id}`);
    return response.statusText;
  } catch (error) {
    console.error('Error deleting Wortiger game:', error);
    throw error;
  }
};
