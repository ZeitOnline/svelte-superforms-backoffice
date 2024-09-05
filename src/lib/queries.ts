import type { QuestionComplete } from "$types";

/**
 * Url to the backend cluster.
 * 
 * @author @witsch
 * @remarks For any questions or issues related to this URL, please contact @witsch.
 */
const BASE_URL = 'https://admin.spiele.devel.zeit.de/eckchen';

export const getAllGames = async () => {
    const response = await fetch(
        `${BASE_URL}/game`
    );
    const data = await response.json();
    return data
}

export const getAllQuestionsByGameId = async (id: number) => {
    const response = await fetch(
        `${BASE_URL}/game_question`
    );
    const data = await response.json();

    const questions = data.filter((question: any) => question.game_id === id);
    // console.log("questions", questions);
    return questions as QuestionComplete[]
}

export const deleteGame = async (id: number) => {
    console.log("we want to delete the game with the id: ", id);
    const response = await fetch(`${BASE_URL}/game?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to delete the game with id: ${id}. Status: ${response.status}`);
    }

    return response.statusText;
}

export const updateGame = async (id: number, data: any) => {
    // TODO: update the questions as well, here we receive only the previous ones
    const questions = await getAllQuestionsByGameId(id);

    if(questions.length > 0) {

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