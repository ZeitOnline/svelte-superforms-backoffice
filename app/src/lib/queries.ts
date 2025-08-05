import { MOCK_GAMES } from '$data/mock';
import type { Game, GameComplete, QuestionComplete } from '$types';

/**
 * Url to the backend cluster.
 *
 * @author @witsch
 * @remarks For any questions or issues related to this URL, please contact @witsch.
 */
const BASE_URL = '/eckchen/api';

/**
 * Get all games from the backend.
 * @returns all games
 */
export const getAllGames = async () => {
  const response = MOCK_GAMES;
  return response as GameComplete[];
};

/**
 * Get the next available date for a game.
 * @returns the next available date for a game in string format
 */
export const getNextAvailableDateForGame = async () => {
  const response = await fetch(
    `${BASE_URL}/game?select=release_date&order=release_date.desc&limit=1`,
  );
  const data = await response.json();

  // if latest available date is in the past, return today's date
  const isDateInThePast = data[0].release_date < new Date().toISOString().split('T')[0];
  if (isDateInThePast) {
    return new Date().toISOString().split('T')[0];
  }

  return data[0].release_date;
};

/**
 * Get all the questions from a game by its id.
 * @param id - the id of the game
 * @returns all the questions from the game
 */
export const getAllQuestionsByGameId = async (id: number) => {
  const response = await fetch(`${BASE_URL}/game_question?game_id=eq.${id}`);
  const data = await response.json();
  return data as QuestionComplete[];
};

/**
 * deletes a game by its id along with all the questions associated with it and the game_state.
 * @param id the id of the game to be deleted
 * @returns the status of the deletion
 */
export const deleteGame = async (id: number) => {
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

    const responseQuestion = await fetch(
      `${BASE_URL}/game_question?id=in.(${questionIds.join(',')})`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!responseQuestion.ok) {
      throw new Error(
        `Failed to delete the questions for game with id: ${id}. Status: ${responseQuestion.status}`,
      );
    }

    console.log(`Deleted ${questions.length} questions associated with game id: ${id}`);
  }

  // Step 2: Fetch and delete related entries in the game_state table
  const responseGameState = await fetch(`${BASE_URL}/game_state?game_id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!responseGameState.ok) {
    const errorMessage = await responseGameState.text();
    console.error(
      `Failed to delete game_state entries for game with id: ${id}. Status: ${responseGameState.status}. Error: ${errorMessage}`,
    );
    throw new Error(
      `Failed to delete game_state entries for game with id: ${id}. Status: ${responseGameState.status}. Error: ${errorMessage}`,
    );
  }

  console.log(`Deleted game_state entries associated with game id: ${id}`);

  // Step 3 - Delete the game itself
  // Before deleting the game, check if there are other related resources
  console.log(`Attempting to delete the game with id: ${id}`);

  const responseGame = await fetch(`${BASE_URL}/game?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!responseGame.ok) {
    const errorMessage = await responseGame.text(); // Get more detailed error message if available
    console.error(
      `Failed to delete the game with id: ${id}. Status: ${responseGame.status}. Error: ${errorMessage}`,
    );
    throw new Error(
      `Failed to delete the game with id: ${id}. Status: ${responseGame.status}. Error: ${errorMessage}`,
    );
  }

  console.log(`Successfully deleted game with id: ${id}`);
  return responseGame.statusText;
};

/**
 * Updates a game by its id.
 * @param id - the id of the game to be updated
 * @param data - the data to be updated
 * @returns the updated game
 */
export const updateGame = async (id: number, data: GameComplete) => {
  try {
    const response = await fetch(`${BASE_URL}/game?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update game with id: ${id}. Status: ${response.status}`);
    }

    const updatedGame = await response.json();
    return updatedGame;
  } catch (error) {
    console.error('Failed to update the game', error);
    throw error;
  }
};

/**
 * Create a game.
 * @param data the data to be created
 * @returns the created game
 */
export async function createGame(data: Game): Promise<GameComplete[]> {
  const game = await fetch(`${BASE_URL}/game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });
  return await game.json();
}

/**
 * Updates game questions.
 * @param questions the questions to be updated
 * @returns the status of the update
 */
export async function updateGameQuestions(questions: QuestionComplete[]): Promise<Response[]> {
  const updateQuestions = questions.map(async question => {
    const response = await fetch(`${BASE_URL}/game_question?id=eq.${question.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(question),
    });

    if (!response.ok) {
      throw new Error(`Failed to update question with id: ${question.id}`);
    }
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
export async function createGameQuestions(data: Game): Promise<Response> {
  const { questions } = data;
  const gameQuestions = await fetch(`${BASE_URL}/game_question`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(questions),
  });
  return gameQuestions;
}
