import { z } from 'zod';
import { ERRORS } from '$lib/error-messages';

export const generateWortigerGameSchema = z.object({
  csv: z
    .instanceof(File, { message: ERRORS.CSV.NO_FILE })
    .refine(f => f.size < 100_000, ERRORS.CSV.SIZE)
    .refine(f => f.type === 'text/csv', ERRORS.CSV.TYPE),
});

export const saveWortigerGameSchema = z.object({
  release_date: z.string().date().min(1, { message: ERRORS.GAME.RELEASE_DATE.EMPTY }),
  words: z
    .object({
      4: z.string().min(4, ERRORS.WORTIGER.WORD_TOO_SHORT).max(4, ERRORS.WORTIGER.WORD_TOO_LONG),
      5: z.string().min(5, ERRORS.WORTIGER.WORD_TOO_SHORT).max(5, ERRORS.WORTIGER.WORD_TOO_LONG),
      6: z.string().min(6, ERRORS.WORTIGER.WORD_TOO_SHORT).max(6, ERRORS.WORTIGER.WORD_TOO_LONG),
      7: z.string().min(7, ERRORS.WORTIGER.WORD_TOO_SHORT).max(7, ERRORS.WORTIGER.WORD_TOO_LONG),
    })
    .refine(words => new Set(Object.values(words)).size === 4, {
      message: ERRORS.WORTIGER.DUPLICATE_WORDS,
    }),
});
