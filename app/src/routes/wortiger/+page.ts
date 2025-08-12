import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getAllGames } from '$lib/queries';

import type { GameComplete } from '$types';
import {
  generateWortigerGameSchema,
  saveWortigerGameFormSchema,
  type GenerateWortigerGameSchema,
  type SaveWortigerGameFormSchema,
} from '../../schemas/wortiger';
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
  const generateGameForm: GenerateGameForm = await superValidate(zod(generateWortigerGameSchema));
  const saveGameForm: SaveGameForm = await superValidate(zod(saveWortigerGameFormSchema));

  const games = await getAllGames({ gameName: 'wortiger' });

  return { generateGameForm, saveGameForm, games };
};
