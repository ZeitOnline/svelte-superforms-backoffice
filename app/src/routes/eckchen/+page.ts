import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getAllGames } from '$lib/queries';

import type { GameComplete } from '$types';
import type { GenerateEckchenGameSchema, SaveEckchenGameFormSchema } from '$schemas/eckchen';
import { CONFIG_GAMES } from '$config/games.config';

export const ssr = false;

// Define the union types for the forms
type GenerateGameForm = SuperValidated<GenerateEckchenGameSchema>;
type SaveGameForm = SuperValidated<SaveEckchenGameFormSchema>;

export const load = async (): Promise<{
  generateGameForm: GenerateGameForm;
  saveGameForm: SaveGameForm;
  games: GameComplete[];
}> => {
  // The two forms are handled here based on current game configuration
  const generateGameForm = (await superValidate(
    zod(CONFIG_GAMES['eckchen'].schemas.generateGameSchema),
  )) as GenerateGameForm;
  const saveGameForm = (await superValidate(
    zod(CONFIG_GAMES['eckchen'].schemas.saveGameFormSchema),
  )) as SaveGameForm;

  const games = await getAllGames({ gameName: 'eckchen' });

  return { generateGameForm, saveGameForm, games };
};
