import type { SpellingBeeSolutionItem } from "$types";
import { CONFIG_GAMES } from "$config/games.config";
import { buildQueryParams, pg, requestPostgrest } from '$lib/postgrest-client';

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
  try {
    // Remove solutions first since there is no DB cascade
    await deleteSpellingBeeSolutions(id);

    const { response } = await requestPostgrest<unknown>({
      baseUrl: CONFIG_GAMES['spelling-bee'].apiBase,
      path: CONFIG_GAMES['spelling-bee'].endpoints.games.name,
      method: 'DELETE',
      query: buildQueryParams([['id', pg.eq(id)]]),
      errorMessage: `Failed to delete Spelling Bee game with id: ${id}`,
    });

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

  const { response } = await requestPostgrest<unknown, typeof payload>({
    url: getSolutionsEndpointUrl(),
    method: 'POST',
    body: payload,
    errorMessage: `Failed to create spelling bee solutions for game ${gameId}`,
  });

  return response;
};

export const deleteSpellingBeeSolutions = async (gameId: number) => {
  const { response } = await requestPostgrest<unknown>({
    url: getSolutionsEndpointUrl(),
    method: 'DELETE',
    query: buildQueryParams([['game_id', pg.eq(gameId)]]),
    errorMessage: `Failed to delete spelling bee solutions for game ${gameId}`,
  });

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
