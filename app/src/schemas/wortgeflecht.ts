import { z } from 'zod';
import { ERRORS } from '$lib/error-messages';

export const generateWortgeflechtGameSchema = z.object({
  csv: z
    .instanceof(File, { message: ERRORS.CSV.NO_FILE })
    .refine(f => f.size < 100_000, ERRORS.CSV.SIZE)
    .refine(f => f.type === 'text/csv', ERRORS.CSV.TYPE),
});

export const saveWortgeflechtGameFormSchema = z.object({
  name: z.string().trim().min(1, {
    message: ERRORS.GAME.NAME.EMPTY,
  }),
  description: z.string().trim().default(''),
  published_at: z.string().min(1, { message: ERRORS.GAME.RELEASE_DATE.EMPTY }),
  active: z.boolean().default(false),
});

export type SaveWortgeflechtGameFormSchema = z.infer<typeof saveWortgeflechtGameFormSchema>;
export type GenerateWortgeflechtGameSchema = z.infer<typeof generateWortgeflechtGameSchema>;
