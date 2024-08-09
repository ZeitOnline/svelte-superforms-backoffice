import { userSchema } from '$lib/users';

import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { error, fail, redirect } from '@sveltejs/kit';
import { users, userId } from '$lib/users';

export const load = async ({ url, params }) => {
    const crudSchema = userSchema.extend({
        id: userSchema.shape.id.optional()
      });
      
  // READ user
  const user = users.find((u) => u.id == params.id);

  if (params.id && !user) throw error(404, 'User not found.');

  // If user is null, default values for the schema will be returned.
  const form = await superValidate(user, zod(crudSchema));
  return { form, users };
};