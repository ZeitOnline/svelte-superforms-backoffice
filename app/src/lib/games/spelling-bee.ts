import { CONFIG_GAMES } from "$config/games.config";

export const DEFAULT_SPELLING_BEE_SOLUTION = [
  '',
  'Beispiel Lösung',
  'Dies ist eine Beispiel Erklärung'
]

export const deleteSpellingBeeGame = async (id: number) => {
  const URL = `${CONFIG_GAMES['spelling-bee'].apiBase}/${CONFIG_GAMES['spelling-bee'].endpoints.games.name}?id=eq.${id}`;

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
        `Failed to delete Spelling Bee game with id: ${id}. Status: ${response.status}. Error: ${errorMessage}`,
      );
      throw new Error(
        `Failed to delete Spelling Bee game with id: ${id}. Status: ${response.status}. Error: ${errorMessage}`,
      );
    }

    console.log(`Successfully deleted Spelling Bee game with id: ${id}`);
    return response.statusText;
  } catch (error) {
    console.error('Error deleting Spelling Bee game:', error);
    throw error;
  }
};
