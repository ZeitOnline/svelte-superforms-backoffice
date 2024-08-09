import type { Actions } from '@sveltejs/kit';
import { fail, message, setError, superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const schema = z.object({
  name: z.string().default('Paco'),
  email: z.string().email().default("manuel@zeit.de"),
  // image: z
  //   .instanceof(File, { message: 'Please upload a file.'})
  //   .refine((f) => f.size < 100_000, 'Max 100 kB upload size.'),
  csv: z
    .instanceof(File, { message: 'Please upload a file.'})
    .refine((f) => f.size < 100_000, 'Max 100 kB upload size.'),
});

export const load = (async () => {
  const form = await superValidate(zod(schema));

  return {form}
});

export const actions: Actions = {
  
  default: async ({ request }) => {
		const form = await superValidate(request, zod(schema));

		if (!form.valid) return fail(400, withFiles({ form }));

    if (form.data.name !== 'Frieder') {
      return setError(form, 'name', 'The name is not Frieder...');
    }

    console.log("this is the form", form);
    // save to db
    
		return withFiles({ form })
	}
};