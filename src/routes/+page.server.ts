import type { Actions } from '@sveltejs/kit';
import { fail, setError, superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { generateGameSchema, saveGameSchema } from '../schemas/generate-game';

export const load = (async () => {
  const generateGameForm = await superValidate(zod(generateGameSchema));
  const saveGameForm = await superValidate(zod(saveGameSchema));

  return { generateGameForm, saveGameForm }
});

export const actions: Actions = {
  
  generateGame: async ({ request }) => {
		const form = await superValidate(request, zod(generateGameSchema));

		if (!form.valid) return fail(400, withFiles({ form }));

    if (form.data.name !== 'Frieder') {
      return setError(form, 'name', 'The name is not Frieder...');
    }

    console.log("this is the form", form);
    // save to db
    
		return withFiles({ form })
	}
  
};