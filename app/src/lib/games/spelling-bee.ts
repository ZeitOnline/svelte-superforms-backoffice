import type { SpellingBeeSolutionItem } from "$types";
import { CONFIG_GAMES } from "$config/games.config";

export const DEFAULT_SPELLING_BEE_SOLUTION = {
  solution: '',
  points: 0,
  solution_type: '',
  solution_explanation: '',
};

const getSolutionsEndpointUrl = () => {
  const solutionsEndpoint = CONFIG_GAMES['spelling-bee'].endpoints.solutions?.name;
  if (!solutionsEndpoint) {
    throw new Error('Solutions endpoint is not configured for spelling-bee.');
  }

  return `${CONFIG_GAMES['spelling-bee'].apiBase}/${solutionsEndpoint}`;
};

const normalizeSolutionValue = (solution: string) => solution.trim().toUpperCase();

export const deleteSpellingBeeGame = async (id: number) => {
  const URL = `${CONFIG_GAMES['spelling-bee'].apiBase}/${CONFIG_GAMES['spelling-bee'].endpoints.games.name}?id=eq.${id}`;

  try {
    // Remove solutions first since there is no DB cascade
    await deleteSpellingBeeSolutions(id);

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

export const createSpellingBeeSolutions = async (
  gameId: number,
  solutions: SpellingBeeSolutionItem,
) => {
  const payload = solutions.map(({ solution, points, solution_type, solution_explanation }) => ({
    solution: normalizeSolutionValue(solution),
    points,
    solution_type,
    solution_explanation,
    game_id: gameId,
  }));

  const response = await fetch(getSolutionsEndpointUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(
      `Failed to create spelling bee solutions for game ${gameId}. Status: ${response.status}. Error: ${errorMessage}`,
    );
  }

  return response;
};

export const deleteSpellingBeeSolutions = async (gameId: number) => {
  const response = await fetch(`${getSolutionsEndpointUrl()}?game_id=eq.${gameId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(
      `Failed to delete spelling bee solutions for game ${gameId}. Status: ${response.status}. Error: ${errorMessage}`,
    );
  }

  return response;
};

export const replaceSpellingBeeSolutions = async (
  gameId: number,
  solutions: SpellingBeeSolutionItem,
) => {
  await deleteSpellingBeeSolutions(gameId);

  if (!solutions?.length) {
    return [];
  }

  return createSpellingBeeSolutions(gameId, solutions);
};
