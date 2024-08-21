import type { QuestionComplete } from "$types";

export const getAllGames = async () => {
    const response = await fetch('https://admin.spiele.devel.zeit.de/eckchen/game');
    const data = await response.json();
    return data
}

export const getAllQuestionsByGameId = async (id: string) => {
    const response = await fetch(`https://admin.spiele.devel.zeit.de/eckchen/game_question`);
    const data = await response.json();

    const questions = data.filter((question: any) => question.game_id === id);
    // console.log("questions", questions);
    return questions as QuestionComplete[]
}

export const deleteGame = async (id: string) => {
    // console.log("id", id);
    const response = await fetch(`https://admin.spiele.devel.zeit.de/eckchen/game?id=eq.${id}`, {
        method: 'DELETE'
    });

    return response.json();
}

export const updateGame = async (id: string, data: any) => {
    // TODO: update the questions as well, here we receive only the previous ones
    const questions = await getAllQuestionsByGameId(id);

    // 1 - update all the questions 
    upsertData('game_question', questions);

    // 2 - update the game itself
    upsertData('game', data);

    return data;
}

/**
 * Upsert data to a database
 * @param table - the table name
 * @param data - the data to be upserted
 */
const upsertData = async (table: string, data: any) => {
    await fetch(`https://admin.spiele.devel.zeit.de/eckchen/${table}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(data)
    });
}