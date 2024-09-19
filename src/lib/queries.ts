import type { Game, GameComplete, QuestionComplete } from "$types";

/**
 * Url to the backend cluster.
 * 
 * @author @witsch
 * @remarks For any questions or issues related to this URL, please contact @witsch.
 */
const BASE_URL = 'https://admin.spiele.devel.zeit.de/eckchen';

/**
 * Get all games from the backend.
 * @returns all games
 */
export const getAllGames = async () => {
    const response = await fetch(
        `${BASE_URL}/game`
    );
    const data = await response.json();
    return data
}

/**
 * Get the next available date for a game.
 * @returns the next available date for a game in string format
 */
export const getNextAvailableDateForGame = async () => {
    const response = await fetch(
        `${BASE_URL}/game?select=release_date&order=release_date.desc&limit=1`
    );
    const data = await response.json();
    return data[0].release_date;
}

/**
 * Get all the questions from a game by its id.
 * @param id - the id of the game
 * @returns all the questions from the game
 */
export const getAllQuestionsByGameId = async (id: number) => {
    const response = await fetch(
        `${BASE_URL}/game_question`
    );
    const data = await response.json();

    const questions = data.filter((question: any) => question.game_id === id);
    // console.log("questions", questions);
    return questions as QuestionComplete[]
}

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
    console.log("we want to delete the game with the id: ", id);


    // Step 1 - Delete the questions associated with the game
    const questions = await getAllQuestionsByGameId(id);

    if (questions.length > 0) {
        // Batch delete questions associated with the game
        const questionIds = questions.map(question => question.id);

        const responseQuestion = await fetch(`${BASE_URL}/game_question?id=in.(${questionIds.join(',')})`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!responseQuestion.ok) {
            throw new Error(`Failed to delete the questions for game with id: ${id}. Status: ${responseQuestion.status}`);
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
        console.error(`Failed to delete game_state entries for game with id: ${id}. Status: ${responseGameState.status}. Error: ${errorMessage}`);
        throw new Error(`Failed to delete game_state entries for game with id: ${id}. Status: ${responseGameState.status}. Error: ${errorMessage}`);
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
        console.error(`Failed to delete the game with id: ${id}. Status: ${responseGame.status}. Error: ${errorMessage}`);
        throw new Error(`Failed to delete the game with id: ${id}. Status: ${responseGame.status}. Error: ${errorMessage}`);
    }

    console.log(`Successfully deleted game with id: ${id}`);
    return responseGame.statusText;
}


/**
 * Updates or create a game by its id.
 * @param id the id of the game to be updated or created
 * @param data the data to be updated or created
 * @returns the updated or created game
 */
export const updateGame = async (id: number, data: any) => {
    // TODO: update the questions as well, here we receive only the previous ones
    const questions = await getAllQuestionsByGameId(id);

    if (questions.length > 0) {

        // 1 - update all the questions 
        // upsertData('game_question', questions);
    }

    console.log("adding the new game...", data);
    // 2 - update the game itself
    await upsertData('game', data);

    return data;
}

/**
 * Upsert data to a database
 * @param table - the table name
 * @param data - the data to be upserted
 */
const upsertData = async (table: string, data: any) => {
    console.log('this is the table: ', table);
    console.log('this is the data: ', data);

    if (table == "game") {
        // we need to remove the questions from the game data
        const questions = data.questions;
        delete data.questions;
        console.log('this is the data without questions: ', data);

        // we need to update the questions separately
        if (questions.length > 0) {
            // upsertData('game_question', questions);
        }
    }


    await fetch(`${BASE_URL}/${table}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(data)
    });
}