import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { generateGameSchema, saveGameFormSchema } from '../schemas/generate-game';
import { getAllGames } from '$lib/queries';

export const ssr = false;

export const load = (async () => {
  // The two forms are handled here
  const generateGameForm = await superValidate(zod(generateGameSchema));
  const saveGameForm = await superValidate(zod(saveGameFormSchema));

  // The games are loaded here from the db
  const games = await getAllGames();

  return { generateGameForm, saveGameForm, games }
});