import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
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
    // @ts-expect-error type issue with the schema
    zod4(CONFIG_GAMES['wortiger'].schemas.generateGameSchema),
  )) as GenerateGameForm;
  const saveGameForm = (await superValidate(
    // @ts-expect-error type issue with the schema
    zod4(CONFIG_GAMES['wortiger'].schemas.saveGameFormSchema),
  )) as SaveGameForm;

  const games = await getAllGames({ gameName: 'wortiger' });

  return { generateGameForm, saveGameForm, games };
};
