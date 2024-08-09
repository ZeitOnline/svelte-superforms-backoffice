import { fail, message, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const schema = z.object({
  name: z.string().default('Paco'),
  email: z.string().email().default('paco.the.dog@zeit.de'),
  image: z
    .instanceof(File, { message: 'Please upload a file.'})
    .refine((f) => f.size < 100_000, 'Max 100 kB upload size.')
});

export const load = (async () => {
  const form = await superValidate(zod(schema));

  return {form}
});

export const actions = {
  default: async ({ request }) => {
    // Data is posted, so form.errors will be populated
    const form = await superValidate(request, zod(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    if (form.data.name !== 'Frieder') {
      return setError(form, 'name', 'The name is not Frieder...');
    }

    // return message(form, 'You have done everything amazingly!');


    // Unless we turn them off (which is rare in form actions)
    // const form2 = await superValidate(request, zod(schema), { errors: false });
  }
};