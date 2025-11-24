import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { CONFIG_GAMES } from '$config/games.config';
import { getAllGames } from '$lib/queries';

import type { LayoutLoad } from './$types';
import type { GameType, GameComplete } from '$types';

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

    return {
        gameType,
        generateGameForm,
        saveGameForm,
        games,
    };

}
