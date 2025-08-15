import { z } from 'zod';
import { ERRORS } from '$lib/error-messages';
import { MAP_LEVEL_CHARACTERS } from '$lib/games/wortiger';

export const generateWortigerGameSchema = z.object({
  csv: z
    .instanceof(File, { message: ERRORS.CSV.NO_FILE })
    .refine(f => f.size < 100_000, ERRORS.CSV.SIZE)
    .refine(f => f.type === 'text/csv', ERRORS.CSV.TYPE),
});

export const saveWortigerGameFormSchema = z
  .object({
    level: z.number().min(1, { message: ERRORS.GAME.LEVEL.REQUIRED }).default(1),
    release_date: z.string().date().min(1, { message: ERRORS.GAME.RELEASE_DATE.EMPTY }),
    solution: z.string().min(1, { message: ERRORS.WORTIGER.SOLUTION.REQUIRED }),
    published: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const levelToLength: Record<number, number> = MAP_LEVEL_CHARACTERS;
    const expectedLength = levelToLength[data.level];
    if (expectedLength && data.solution.length !== expectedLength) {
      ctx.addIssue({
        path: ['solution'],
        code: z.ZodIssueCode.custom,
        message: `Solution must be ${expectedLength} characters for level ${data.level}.`,
      });
    }
  });

// Export the inferred types
export type SaveWortigerGameFormSchema = z.infer<typeof saveWortigerGameFormSchema>;
export type GenerateWortigerGameSchema = z.infer<typeof generateWortigerGameSchema>;
