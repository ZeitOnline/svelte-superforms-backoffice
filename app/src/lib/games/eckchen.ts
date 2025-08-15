import { SHOULD_DELETE_STATE } from '$lib/queries';
import { Orientation, type GameEckchen, type Question, type QuestionComplete } from '$types';
import { CONFIG_GAMES } from '../../config/games.config';

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

/**
 * Get all the questions from a game by its id.
 * @param id - the id of the game
 * @returns all the questions from the game
 */
export const getAllQuestionsByGameId = async (id: number) => {
  const URL = `${CONFIG_GAMES['eckchen'].apiBase}/game_question?game_id=eq.${id}`;

  try {
    const response = await fetch(URL);
    const data = await response.json();

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

    const responseQuestion = await fetch(
      `${CONFIG_GAMES['eckchen'].apiBase}/game_question?id=in.(${questionIds.join(',')})`,
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

  if (SHOULD_DELETE_STATE) {
    // Step 2: Fetch and delete related entries in the game_state table
    const responseGameState = await fetch(
      `${CONFIG_GAMES['eckchen'].apiBase}/game_state?game_id=eq.${id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

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
  }

  // Step 3 - Delete the game itself
  // Before deleting the game, check if there are other related resources
  console.log(`Attempting to delete the game with id: ${id}`);

  const responseGame = await fetch(`${CONFIG_GAMES['eckchen'].apiBase}/game?id=eq.${id}`, {
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
 * Updates game questions.
 * @param questions the questions to be updated
 * @returns the status of the update
 */
export async function updateGameQuestions(questions: QuestionComplete[]): Promise<Response[]> {
  const updateQuestions = questions.map(async question => {
    const response = await fetch(
      `${CONFIG_GAMES['eckchen'].apiBase}/game_question?id=eq.${question.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(question),
      },
    );

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
export async function createGameQuestions(data: GameEckchen): Promise<Response> {
  const { questions } = data;
  const gameQuestions = await fetch(`${CONFIG_GAMES['eckchen'].apiBase}/game_question`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(questions),
  });
  return gameQuestions;
}
