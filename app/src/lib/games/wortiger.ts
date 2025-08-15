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

export const deleteWortigerGame = async (id: number) => {
  console.log('Deleting Wortiger game with id:', id);
  const URL = `${CONFIG_GAMES['wortiger'].apiBase}/${CONFIG_GAMES['wortiger'].apiEndpoint}?id=eq.${id}`;

  try {
    // Wortiger games are simpler - just delete the game record itself
    // No associated questions or game_state to worry about
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
