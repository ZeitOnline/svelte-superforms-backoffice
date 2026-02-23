import { SHOULD_DELETE_STATE } from '$lib/queries';
import { Orientation, type GameComplete, type GameEckchen, type Question, type QuestionComplete } from '$types';
import { CONFIG_GAMES } from '../../config/games.config';
import { buildQueryParams, pg, requestPostgrest } from '$lib/postgrest-client';

export function serializeRow(row: string[] | number[]): Question {
  return {
    nr: Number(row[0]),
    question: String(row[1]),
    answer: String(row[2]),
    xc: Number(row[3]),
    yc: Number(row[4]),
    direction: row[5] as Orientation,
    description: String(row[6]),
  };
}

export const DEFAULT_ECKCHEN_QUESTION = [
  '1',
  'Beispiel Frage',
  'Beispiel Antwort',
  '1',
  '1',
  Orientation.HORIZONTAL,
  'Ich bin so arm, ich habe nur X und Y',
];

const deleteQuestionsByIds = async (id: number, questionIds: number[]) =>
  requestPostgrest<unknown>({
    baseUrl: CONFIG_GAMES['eckchen'].apiBase,
    path: 'game_question',
    method: 'DELETE',
    query: buildQueryParams([['id', `in.(${questionIds.join(',')})`]]),
    errorMessage: `Failed to delete questions for game ${id}`,
  });

const deleteGameStateByGameId = async (id: number) =>
  requestPostgrest<unknown>({
    baseUrl: CONFIG_GAMES['eckchen'].apiBase,
    path: 'game_state',
    method: 'DELETE',
    query: buildQueryParams([['game_id', pg.eq(id)]]),
    errorMessage: `Failed to delete game_state entries for game ${id}`,
  });

const deleteGameById = async (id: number) =>
  requestPostgrest<unknown>({
    baseUrl: CONFIG_GAMES['eckchen'].apiBase,
    path: 'game',
    method: 'DELETE',
    query: buildQueryParams([['id', pg.eq(id)]]),
    errorMessage: `Failed to delete game with id: ${id}`,
  });

const fetchQuestionsByGameId = async (id: number) =>
  requestPostgrest<QuestionComplete[]>({
    baseUrl: CONFIG_GAMES['eckchen'].apiBase,
    path: 'game_question',
    query: buildQueryParams([['game_id', pg.eq(id)]]),
    errorMessage: `Failed to fetch questions for game ${id}`,
  });

const updateQuestionById = async (question: QuestionComplete) =>
  requestPostgrest<unknown, QuestionComplete>({
    baseUrl: CONFIG_GAMES['eckchen'].apiBase,
    path: 'game_question',
    method: 'PATCH',
    query: buildQueryParams([['id', pg.eq(question.id)]]),
    headers: {
      Prefer: 'return=representation',
    },
    body: question,
    errorMessage: `Failed to update question with id: ${question.id}`,
  });

const createQuestions = async (questions: GameEckchen['questions']) =>
  requestPostgrest<unknown, GameEckchen['questions']>({
    baseUrl: CONFIG_GAMES['eckchen'].apiBase,
    path: 'game_question',
    method: 'POST',
    body: questions,
    errorMessage: 'Failed to create game questions',
  });

const updateEckchenGameById = async (id: number, data: Partial<GameComplete>) =>
  requestPostgrest<GameComplete[], Partial<GameComplete>>({
    baseUrl: CONFIG_GAMES.eckchen.apiBase,
    path: CONFIG_GAMES.eckchen.endpoints.games.name,
    method: 'PATCH',
    query: buildQueryParams([['id', pg.eq(id)]]),
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: `Failed to update game with id: ${id}`,
  });

const createEckchenGameRow = async (data: GameComplete) =>
  requestPostgrest<GameComplete[], GameComplete>({
    baseUrl: CONFIG_GAMES.eckchen.apiBase,
    path: CONFIG_GAMES.eckchen.endpoints.games.name,
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: 'Failed to create game',
  });

/**
 * Get all the questions from a game by its id.
 * @param id - the id of the game
 * @returns all the questions from the game
 */
export const getAllQuestionsByGameId = async (id: number) => {
  try {
    const { data } = await fetchQuestionsByGameId(id);

    return data as QuestionComplete[];
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const deleteEckchenGame = async (id: number) => {
  // We need to do 3 things here:
  // 1 - delete the questions associated with the game
  // 2 - delete the game state
  // 3 - delete the game itself

  // TODO: this needs to be done in CASCADE in the backend
  console.log('we want to delete the game with the id: ', id);

  // Step 1 - Delete the questions associated with the game
  const questions = await getAllQuestionsByGameId(id);

  if (questions.length > 0) {
    // Batch delete questions associated with the game
    const questionIds = questions.map(question => question.id);

    await deleteQuestionsByIds(id, questionIds);

    console.log(`Deleted ${questions.length} questions associated with game id: ${id}`);
  }

  if (SHOULD_DELETE_STATE) {
    // Step 2: Fetch and delete related entries in the game_state table
    await deleteGameStateByGameId(id);
    console.log(`Deleted game_state entries associated with game id: ${id}`);
  }

  // Step 3 - Delete the game itself
  // Before deleting the game, check if there are other related resources
  console.log(`Attempting to delete the game with id: ${id}`);

  const { response: responseGame } = await deleteGameById(id);

  console.log(`Successfully deleted game with id: ${id}`);
  return responseGame.statusText;
};

/**
 * Updates game questions.
 * @param questions the questions to be updated
 * @returns the status of the update
 */
export async function updateGameQuestions(questions: QuestionComplete[]): Promise<Response[]> {
  const updateQuestions = questions.map(async question => {
    const { response } = await updateQuestionById(question);
    return response;
  });

  const responses = await Promise.all(updateQuestions);

  return responses;
}

/**
 * Create game questions.
 * @param data the data for the game questions
 * @returns the created game questions
 */
export async function createGameQuestions(data: GameEckchen): Promise<Response> {
  const { questions } = data;
  const { response: gameQuestions } = await createQuestions(questions);
  return gameQuestions;
}

export const updateEckchenGame = async ({
  gameId,
  data,
}: {
  gameId: number;
  data: Partial<GameComplete>;
}) => {
  const { data: updatedGame } = await updateEckchenGameById(gameId, data);
  return updatedGame;
};

export async function createEckchenGame(data: GameComplete): Promise<GameComplete[]> {
  const { data: game } = await createEckchenGameRow(data);
  return game;
}

export async function getResultBodyForGame(id: number, game: GameEckchen, resultsDataBody: string[][]) {
  const questions = await getAllQuestionsByGameId(id);
  game.questions = questions;
  resultsDataBody = questions.map((question: QuestionComplete) => {
    return [
      String(question.nr),
      String(question.question),
      String(question.answer),
      String(question.xc),
      String(question.yc),
      String(question.direction),
      String(question.description),
    ];
  });

  return resultsDataBody;

}
