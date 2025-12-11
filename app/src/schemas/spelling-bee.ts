import { z } from 'zod';
import { ERRORS } from '$lib/error-messages';
import { saveSpellingBeeSolutionArraySchema, saveSpellingBeeSolutionSchema } from './spelling-bee_game-solutions';

export const canBeBuiltFromWordcloud = (word: string, wordcloud: string) => {
  const pool: Record<string, number> = {};
  wordcloud
    .toUpperCase()
    .split('')
    .forEach(char => {
      pool[char] = (pool[char] ?? 0) + 1;
    });

  for (const char of word.toUpperCase()) {
    if (!pool[char]) {
      return false;
    }
    pool[char] -= 1;
  }

  return true;
};

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
      .length(9, { message: ERRORS.SPELLING_BEE.WORDCLOUD.LENGTH }),
    solutions: saveSpellingBeeSolutionArraySchema.default([]),
  })
  .superRefine((data, ctx) => {
    const wordcloud = (data.wordcloud ?? '').toUpperCase();

    data.solutions?.forEach((solution, index) => {
      if (!solution?.solution) return;
      if (!canBeBuiltFromWordcloud(solution.solution, wordcloud)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lösung lässt sich nicht mit den Buchstaben der Wortwolke bilden.',
          path: ['solutions', index, 'solution'],
        });
      }
    });
  });


// ------------------------------------
// 3. Export inferred types
// ------------------------------------
export type SaveSpellingBeeGameFormSchema = z.infer<typeof saveSpellingBeeGameFormSchema>;
export type GenerateSpellingBeeGameSchema = z.infer<typeof generateSpellingBeeGameSchema>;
export type SaveSpellingBeeSolutionSchema = z.infer<typeof saveSpellingBeeSolutionSchema>;
export type SaveSpellingBeeSolutionArraySchema = z.infer<typeof saveSpellingBeeSolutionArraySchema>;
