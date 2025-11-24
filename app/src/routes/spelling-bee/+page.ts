import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type z from 'zod';
import type { GameComplete } from '$types';
import type { generateSpellingBeeGameSchema, saveSpellingBeeGameFormSchema } from '$schemas/spelling-bee';

import { getAllGames } from '$lib/queries';
import { CONFIG_GAMES } from '$config/games.config';

export const ssr = false;

type GenerateGameForm = SuperValidated<z.infer<typeof generateSpellingBeeGameSchema>>;
type SaveGameForm = SuperValidated<z.infer<typeof saveSpellingBeeGameFormSchema>>;

export const load = async ({ fetch }): Promise<{
  generateGameForm: GenerateGameForm;
  saveGameForm: SaveGameForm;
  games: GameComplete[];
}> => {
  const { schemas } = CONFIG_GAMES['spelling-bee'];

  const generateGameSchema = schemas.generateGameSchema;
  const saveGameFormSchema = schemas.saveGameFormSchema;

  const generateGameForm = (await superValidate(zod4(generateGameSchema))) as GenerateGameForm;
  const saveGameForm = (await superValidate(zod4(saveGameFormSchema))) as SaveGameForm;

  const games = await getAllGames({ gameName: 'spelling-bee', fetch });

  return { generateGameForm, saveGameForm, games };
};
