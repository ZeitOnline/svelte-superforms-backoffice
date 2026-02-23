import type { GameComplete, SpellingBeeSolutionItem } from "$types";
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

const deleteSpellingBeeGameById = async (id: number) =>
  requestPostgrest<unknown>({
    baseUrl: CONFIG_GAMES['spelling-bee'].apiBase,
    path: CONFIG_GAMES['spelling-bee'].endpoints.games.name,
    method: 'DELETE',
    query: buildQueryParams([['id', pg.eq(id)]]),
    errorMessage: `Failed to delete Spelling Bee game with id: ${id}`,
  });

const insertSpellingBeeSolutions = async (
  gameId: number,
  payload: Array<{
    solution: string;
    points: number;
    solution_type: string;
    solution_explanation: string;
    game_id: number;
  }>,
) =>
  requestPostgrest<unknown, typeof payload>({
    url: getSolutionsEndpointUrl(),
    method: 'POST',
    body: payload,
    errorMessage: `Failed to create spelling bee solutions for game ${gameId}`,
  });

const deleteSpellingBeeSolutionsByGameId = async (gameId: number) =>
  requestPostgrest<unknown>({
    url: getSolutionsEndpointUrl(),
    method: 'DELETE',
    query: buildQueryParams([['game_id', pg.eq(gameId)]]),
    errorMessage: `Failed to delete spelling bee solutions for game ${gameId}`,
  });

const updateSpellingBeeGameById = async (id: number, data: Partial<GameComplete>) =>
  requestPostgrest<GameComplete[], Partial<GameComplete>>({
    baseUrl: CONFIG_GAMES['spelling-bee'].apiBase,
    path: CONFIG_GAMES['spelling-bee'].endpoints.games.name,
    method: 'PATCH',
    query: buildQueryParams([['id', pg.eq(id)]]),
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: `Failed to update game with id: ${id}`,
  });

const createSpellingBeeGameRow = async (data: GameComplete) =>
  requestPostgrest<GameComplete[], GameComplete>({
    baseUrl: CONFIG_GAMES['spelling-bee'].apiBase,
    path: CONFIG_GAMES['spelling-bee'].endpoints.games.name,
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: 'Failed to create game',
  });

export const deleteSpellingBeeGame = async (id: number) => {
  try {
    // Remove solutions first since there is no DB cascade
    await deleteSpellingBeeSolutions(id);

    const { response } = await deleteSpellingBeeGameById(id);

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

  const { response } = await insertSpellingBeeSolutions(gameId, payload);

  return response;
};

export const deleteSpellingBeeSolutions = async (gameId: number) => {
  const { response } = await deleteSpellingBeeSolutionsByGameId(gameId);

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

export const updateSpellingBeeGame = async ({
  gameId,
  data,
}: {
  gameId: number;
  data: Partial<GameComplete>;
}) => {
  const { data: updatedGame } = await updateSpellingBeeGameById(gameId, data);
  return updatedGame;
};

export async function createSpellingBeeGame(data: GameComplete): Promise<GameComplete[]> {
  const { data: game } = await createSpellingBeeGameRow(data);
  return game;
}
