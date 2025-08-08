import { ERRORS } from '$lib/error-messages';
import { Orientation } from '$types';
import { z } from 'zod';

export const generateEckchenGameSchema = z.object({
  csv: z
    .instanceof(File, { message: ERRORS.CSV.NO_FILE })
    .refine(f => f.size < 100_000, ERRORS.CSV.SIZE)
    .refine(f => f.type === 'text/csv', ERRORS.CSV.TYPE),
});

export const saveEckchenGameSchema = z.object({
  nr: z
    .number({ message: ERRORS.GAME.QUESTIONS.NR.EMPTY })
    .min(1, { message: ERRORS.GAME.QUESTIONS.NR.MIN }),
  question: z.string().min(1, { message: ERRORS.GAME.QUESTIONS.QUESTION }),
  answer: z.string().min(1, { message: ERRORS.GAME.QUESTIONS.ANSWER }),
  xc: z
    .number({ message: ERRORS.GAME.QUESTIONS.XC.EMPTY })
    .min(0, { message: ERRORS.GAME.QUESTIONS.XC.MIN }),
  yc: z
    .number({ message: ERRORS.GAME.QUESTIONS.YC.EMPTY })
    .min(0, { message: ERRORS.GAME.QUESTIONS.YC.MIN }),
  direction: z
    .nativeEnum(Orientation, { message: ERRORS.GAME.QUESTIONS.DIRECTION })
    .default(Orientation.HORIZONTAL),
  description: z.string().min(1, { message: ERRORS.GAME.QUESTIONS.DESCRIPTION }),
});

export const saveEckchenGameArraySchema = z.array(saveEckchenGameSchema).refine(
  questions => {
    const pairs = questions.map(({ nr, direction }) => `${nr}-${direction}`);
    const uniquePairs = new Set(pairs);
    return pairs.length === uniquePairs.size;
  },
  { message: ERRORS.GAME.QUESTIONS.DUPLICATED_ID_OR_DIRECTION },
);

export const saveEckchenGameFormSchema = z.object({
  name: z.string().trim().min(1, {
    message: ERRORS.GAME.NAME.EMPTY,
  }),
  release_date: z.string().date().min(1, { message: ERRORS.GAME.RELEASE_DATE.EMPTY }),
  published: z.boolean().default(false),
  questions: saveEckchenGameArraySchema,
});
