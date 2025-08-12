import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getAllGames } from '$lib/queries';

import type { GameComplete } from '$types';
import {
  generateEckchenGameSchema,
  saveEckchenGameFormSchema,
  type GenerateEckchenGameSchema,
  type SaveEckchenGameFormSchema,
} from '../../schemas/eckchen';

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
  const generateGameForm: GenerateGameForm = await superValidate(zod(generateEckchenGameSchema));
  const saveGameForm: SaveGameForm = await superValidate(zod(saveEckchenGameFormSchema));

  const games = await getAllGames({ gameName: 'eckchen' });

  return { generateGameForm, saveGameForm, games };
};
