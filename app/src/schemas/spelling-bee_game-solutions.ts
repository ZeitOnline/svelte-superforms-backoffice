import { z } from 'zod';
import { ERRORS } from '#lib/error-messages.js';

// -----------------------------
// 1. CSV import schema
// -----------------------------
export const generateGameSolutionSchema = z.object({
  csv: z
    .instanceof(File, { error: ERRORS.CSV.NO_FILE })
    .refine(f => f.size < 200_000, ERRORS.CSV.SIZE)
    .refine(f => f.type === 'text/csv', ERRORS.CSV.TYPE),
});

export const saveSpellingBeeSolutionSchema = z.object({
  solution: z
    .string()
    .min(1, { error: ERRORS.SPELLING_BEE.SOLUTION.SOLUTION.REQUIRED })
    .max(254, { error: ERRORS.SPELLING_BEE.SOLUTION.SOLUTION.MAX })
    .transform(value => value.trim().toUpperCase()),

  solution_type: z
    .string()
    .max(255, { error: ERRORS.SPELLING_BEE.SOLUTION.TYPE.MAX })
    .optional()
    .default(''),

  solution_explanation: z
    .string()
    .max(255, { error: ERRORS.SPELLING_BEE.SOLUTION.EXPLANATION.MAX })
    .optional()
    .default(''),

  points: z
    .number()
    .min(0, { error: ERRORS.SPELLING_BEE.SOLUTION.POINTS.MIN })
    .max(12, { error: ERRORS.SPELLING_BEE.SOLUTION.POINTS.MAX }),
});

export const saveSpellingBeeSolutionArraySchema = z.array(saveSpellingBeeSolutionSchema);
