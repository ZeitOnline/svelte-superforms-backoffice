import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { CONFIG_GAMES } from '$config/games.config';
import { getAllGames } from '$lib/queries';

import type { LayoutLoad } from './$types';
import type { GameType, GameComplete, GameSpellingBeeComplete } from '$types';
import { getAllGameSolutions, groupSolutionsByGameId } from '$lib/games/spelling-bee';

export const ssr = false;

export const load: LayoutLoad = async ({ url, fetch }) => {
    // We extract the game type after base path
    const gameType = url.pathname.split('/')[2] as GameType;

    // Only run for game routes
    if (!CONFIG_GAMES[gameType]) {
        return {};
    }

    const { schemas } = CONFIG_GAMES[gameType];

    const generateGameForm = await superValidate(zod4(schemas.generateGameSchema));
    const saveGameForm = await superValidate(zod4(schemas.saveGameFormSchema));

    const games: GameComplete[] = await getAllGames({
        gameName: gameType,
        fetch
    });

    if (gameType === 'spelling-bee') {
        const solutions = await getAllGameSolutions({ gameName: gameType, fetch });
        const groupedSolutions = groupSolutionsByGameId(solutions);

        games.forEach((game) => {
            const gameSolutions = groupedSolutions[game.id] || [];
            (game as GameSpellingBeeComplete).solutions_count = gameSolutions.length;
        });
    }

    return {
        gameType,
        generateGameForm,
        saveGameForm,
        games,
    };

}
