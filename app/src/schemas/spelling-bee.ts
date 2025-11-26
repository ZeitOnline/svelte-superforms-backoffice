import { z } from 'zod';
import { ERRORS } from '$lib/error-messages';

// ------------------------------------
// 1. CSV Import Schema
// ------------------------------------
export const generateSpellingBeeGameSchema = z.object({
  csv: z
    .instanceof(File, { message: ERRORS.CSV.NO_FILE })
    .refine(f => f.size < 100_000, ERRORS.CSV.SIZE)
    .refine(f => f.type === 'text/csv', ERRORS.CSV.TYPE),
});

// ------------------------------------
// 2. Game Form Schema
// ------------------------------------
export const saveSpellingBeeGameFormSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: ERRORS.GAME.NAME.REQUIRED })
      .max(254, { message: ERRORS.GAME.NAME.TOO_LONG }),
    start_time: z
      .string()
      .min(1, { message: ERRORS.GAME.RELEASE_DATE.EMPTY }),
    wordcloud: z
      .string()
      .length(9, { message: ERRORS.SPELLING_BEE.WORDCLOUD.LENGTH })
      // .regex(/^[a-z]+$/, {
      //   message: ERRORS.SPELLING_BEE.WORDCLOUD.LENGTH,
      // }),
  })


// ------------------------------------
// 3. Export inferred types
// ------------------------------------
export type SaveSpellingBeeGameFormSchema = z.infer<typeof saveSpellingBeeGameFormSchema>;
export type GenerateSpellingBeeGameSchema = z.infer<typeof generateSpellingBeeGameSchema>;
