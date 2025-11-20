import { getAllGames } from '$lib/queries';

export const ssr = false;

export const load = async ({ fetch }) => {
  const games = await getAllGames({ gameName: 'spelling-bee', fetch });

  return { games };
};
