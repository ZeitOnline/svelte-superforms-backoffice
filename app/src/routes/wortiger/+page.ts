import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getAllGames } from '$lib/queries';

import type { GameComplete } from '$types';
import type { GenerateWortigerGameSchema, SaveWortigerGameFormSchema } from '$schemas/wortiger';
import { CONFIG_GAMES } from '$config/games.config';

export const ssr = false;

// Define the union types for the forms
type GenerateGameForm = SuperValidated<GenerateWortigerGameSchema>;
type SaveGameForm = SuperValidated<SaveWortigerGameFormSchema>;

export const load = async (): Promise<{
  generateGameForm: GenerateGameForm;
  saveGameForm: SaveGameForm;
  games: GameComplete[];
}> => {
  // The two forms are handled here based on current game configuration
  const generateGameForm = (await superValidate(
    zod(CONFIG_GAMES['wortiger'].schemas.generateGameSchema),
  )) as GenerateGameForm;
  const saveGameForm = (await superValidate(
    zod(CONFIG_GAMES['wortiger'].schemas.saveGameFormSchema),
  )) as SaveGameForm;

  const games = await getAllGames({ gameName: 'wortiger' });

  return { generateGameForm, saveGameForm, games };
};
