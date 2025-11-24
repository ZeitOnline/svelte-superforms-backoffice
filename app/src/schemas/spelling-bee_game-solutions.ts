import { z } from 'zod';
import { ERRORS } from '$lib/error-messages';

// -----------------------------
// 1. CSV import schema
// -----------------------------
export const generateGameSolutionSchema = z.object({
  csv: z
    .instanceof(File, { message: ERRORS.CSV.NO_FILE })
    .refine(f => f.size < 200_000, ERRORS.CSV.SIZE)
    .refine(f => f.type === 'text/csv', ERRORS.CSV.TYPE),
});

// -----------------------------
// 2. Single solution schema
// -----------------------------
export const saveGameSolutionSchema = z.object({
  game_id: z
    .number({ message: ERRORS.SPELLING_BEE.SOLUTION.GAME_ID.REQUIRED })
    .min(1, { message: ERRORS.SPELLING_BEE.SOLUTION.GAME_ID.MIN }),

  solution: z
    .string()
    .min(1, { message: ERRORS.SPELLING_BEE.SOLUTION.SOLUTION.REQUIRED })
    .max(254, { message: ERRORS.SPELLING_BEE.SOLUTION.SOLUTION.MAX }),

  points: z
    .number({ message: ERRORS.SPELLING_BEE.SOLUTION.POINTS.REQUIRED })
    .min(0, { message: ERRORS.SPELLING_BEE.SOLUTION.POINTS.MIN }),

  solution_type: z
    .string()
    .min(1, { message: ERRORS.SPELLING_BEE.SOLUTION.TYPE.REQUIRED })
    .max(255, { message: ERRORS.SPELLING_BEE.SOLUTION.TYPE.MAX }),

  solution_explanation: z
    .string()
    .min(1, { message: ERRORS.SPELLING_BEE.SOLUTION.EXPLANATION.REQUIRED })
    .max(255, { message: ERRORS.SPELLING_BEE.SOLUTION.EXPLANATION.MAX }),
});

// -----------------------------
// 3. Optional: array schema
// -----------------------------
export const saveGameSolutionArraySchema = z.array(saveGameSolutionSchema);

// -----------------------------
// 4. Export types
// -----------------------------
export type SaveGameSolutionSchema = z.infer<typeof saveGameSolutionSchema>;
export type GenerateGameSolutionSchema = z.infer<typeof generateGameSolutionSchema>;
export type SaveGameSolutionArraySchema = z.infer<typeof saveGameSolutionArraySchema>;
