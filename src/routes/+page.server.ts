import type { Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { generateGameSchema, saveGameFormSchema } from '../schemas/generate-game';
import { getAllGames } from '$lib/queries';

export const load = (async () => {
  // The two forms are handled here
  const generateGameForm = await superValidate(zod(generateGameSchema));
  const saveGameForm = await superValidate(zod(saveGameFormSchema));

  // The games are loaded here from the db
  const games = await getAllGames();

  return { generateGameForm, saveGameForm, games }
});

export const actions: Actions = {
  
  // This is server side, not working yet
  // generateGame: async ({ request }) => {
	// 	const form = await superValidate(request, zod(generateGameSchema));

	// 	if (!form.valid) return fail(400, withFiles({ form }));

  //   if (form.data.name !== 'Frieder') {
  //     return setError(form, 'name', 'The name is not Frieder...');
  //   }

  //   console.log("this is the form", form);
  //   // save to db
    
	// 	return withFiles({ form })
	// }
  
};