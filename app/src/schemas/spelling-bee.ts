import { z } from 'zod';
import { ERRORS } from '$lib/error-messages';
import {
  getOtherLettersCount,
  getSpellingBeeSolutionIssue,
  SPELLING_BEE_LETTERS_PATTERN,
  SPELLING_BEE_TYPES,
  type SpellingBeeSolutionIssue,
  type SpellingBeeType,
} from '$lib/games/spelling-bee-letters';
import { saveSpellingBeeSolutionArraySchema, saveSpellingBeeSolutionSchema } from './spelling-bee_game-solutions';

export const SPELLING_BEE_SOLUTION_ISSUE_MESSAGES: Record<SpellingBeeSolutionIssue, string> = {
  too_short: ERRORS.SPELLING_BEE.SOLUTION_RULES.TOO_SHORT,
  too_long: ERRORS.SPELLING_BEE.SOLUTION_RULES.TOO_LONG,
  missing_central: ERRORS.SPELLING_BEE.SOLUTION_RULES.MISSING_CENTRAL,
  incompatible: ERRORS.SPELLING_BEE.SOLUTION_RULES.INCOMPATIBLE,
};

const OTHER_LETTERS_LENGTH_MESSAGES: Record<SpellingBeeType, string> = {
  regular: ERRORS.SPELLING_BEE.OTHER_LETTERS.LENGTH_REGULAR,
  mini: ERRORS.SPELLING_BEE.OTHER_LETTERS.LENGTH_MINI,
};

const uppercaseLetters = (value: string) => value.trim().toUpperCase();

// ------------------------------------
// 1. CSV Import Schema
// ------------------------------------
export const generateSpellingBeeGameSchema = z.object({
  csv: z
    .instanceof(File, { error: ERRORS.CSV.NO_FILE })
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
      .min(1, { error: ERRORS.GAME.NAME.REQUIRED })
      .max(254, { error: ERRORS.GAME.NAME.TOO_LONG }),
    start_time: z
      .string()
      .min(1, { error: ERRORS.GAME.RELEASE_DATE.EMPTY }),
    type: z.enum(SPELLING_BEE_TYPES, { error: ERRORS.SPELLING_BEE.TYPE.INVALID }).default('regular'),
    central_letter: z
      .string()
      .length(1, { error: ERRORS.SPELLING_BEE.CENTRAL_LETTER.LENGTH })
      .regex(SPELLING_BEE_LETTERS_PATTERN, { error: ERRORS.SPELLING_BEE.CENTRAL_LETTER.INVALID })
      .transform(uppercaseLetters),
    other_letters: z
      .string()
      .regex(SPELLING_BEE_LETTERS_PATTERN, { error: ERRORS.SPELLING_BEE.OTHER_LETTERS.INVALID })
      .transform(uppercaseLetters),
    solutions: saveSpellingBeeSolutionArraySchema.default([]),
  })
  .superRefine((data, ctx) => {
    if (data.other_letters.length !== getOtherLettersCount(data.type)) {
      ctx.addIssue({
        code: 'custom',
        message: OTHER_LETTERS_LENGTH_MESSAGES[data.type],
        path: ['other_letters'],
      });
      return;
    }

    const letters = {
      type: data.type,
      centralLetter: data.central_letter,
      otherLetters: data.other_letters,
    };

    data.solutions?.forEach((solution, index) => {
      if (!solution?.solution) return;
      const issue = getSpellingBeeSolutionIssue(solution.solution, letters);
      if (issue) {
        ctx.addIssue({
          code: 'custom',
          message: SPELLING_BEE_SOLUTION_ISSUE_MESSAGES[issue],
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
