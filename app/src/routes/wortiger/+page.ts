import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type z from 'zod';
import type { GameComplete } from '$types';
import type { generateWortigerGameSchema, saveWortigerGameFormSchema } from '$schemas/wortiger';

import { getAllGames } from '$lib/queries';
import { CONFIG_GAMES } from '$config/games.config';

export const ssr = false;

// Define the union types for the forms
type GenerateGameForm = SuperValidated<z.infer<typeof generateWortigerGameSchema>>;
type SaveGameForm = SuperValidated<z.infer<typeof saveWortigerGameFormSchema>>;

export const load = async ({ fetch }): Promise<{
  generateGameForm: GenerateGameForm;
  saveGameForm: SaveGameForm;
  games: GameComplete[];
}> => {
  const { schemas } = CONFIG_GAMES.wortiger;

  const generateGameSchema = schemas.generateGameSchema;
  const saveGameFormSchema = schemas.saveGameFormSchema;

  const generateGameForm = (await superValidate(zod4(generateGameSchema))) as GenerateGameForm;
  const saveGameForm = (await superValidate(zod4(saveGameFormSchema))) as SaveGameForm;

  const games = await getAllGames({ gameName: 'wortiger', fetch });

  return { generateGameForm, saveGameForm, games };
};
