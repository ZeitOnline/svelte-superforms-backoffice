import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { CONFIG_GAMES } from '$config/games.config';
import { getAllGames, getLatestActiveGameIds } from '$lib/queries';

import type { LayoutLoad } from './$types';
import type { GameType } from '$types';
import { DEFAULT_SORT, isActiveFilterOption, isSortOption } from '$lib/game-table-utils';

export const ssr = false;

export const load: LayoutLoad = async ({ url, fetch }) => {
    // We extract the game type after base path
    const gameType = url.pathname.split('/')[2] as GameType;

    // Only run for game routes
    const config = CONFIG_GAMES[gameType];
    if (!config) {
        return {};
    }

    const { schemas } = config;

    const pageParam = url.searchParams.get('page');
    const searchParam = url.searchParams.get('q') ?? '';
    const sortParam = url.searchParams.get('sort');
    const activeParam = url.searchParams.get('active');
    const levelParam = url.searchParams.get('level');

    const pageSize = 10;
    let page = Math.max(1, Number(pageParam) || 1);
    const sort = isSortOption(sortParam) ? sortParam : DEFAULT_SORT;
    const hasActiveColumn = config.table.columns.some(col => col.key === 'active');
    const levelLength = Number(levelParam);
    const normalizedLevelLength =
        gameType === 'wortiger' && [4, 5, 6, 7].includes(levelLength) ? levelLength : null;
    const activeFilter =
        hasActiveColumn && isActiveFilterOption(activeParam) ? activeParam : null;

    const [generateGameForm, saveGameForm, initialGames] = await Promise.all([
        superValidate(zod4(schemas.generateGameSchema)),
        superValidate(zod4(schemas.saveGameFormSchema)),
        getAllGames({
            gameName: gameType,
            fetch,
            page,
            pageSize,
            search: searchParam,
            sort,
            activeFilter,
            levelLength: normalizedLevelLength,
        }),
    ]);

    let { games, total } = initialGames;

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    if (page > totalPages && totalPages > 0) {
        page = totalPages;
        const result = await getAllGames({
            gameName: gameType,
            fetch,
            page,
            pageSize,
            search: searchParam,
            sort,
            activeFilter,
            levelLength: normalizedLevelLength,
        });
        games = result.games;
        total = result.total;
    }

    const latestActiveGameIds = hasActiveColumn
        ? await getLatestActiveGameIds({
              gameName: gameType,
              fetch,
          })
        : [];

    return {
        gameType,
        generateGameForm,
        saveGameForm,
        games,
        gamesPage: {
            page,
            pageSize,
            total,
            totalPages,
            search: searchParam,
            sort,
            activeFilter,
            levelLength: normalizedLevelLength,
        },
        latestActiveGameIds,
    };
}
