import { ERRORS } from "$lib/error-messages";
import { Orientation } from "$types";
import { z } from "zod";

export const generateGameSchema = z.object({
    csv: z
        .instanceof(File, { message: ERRORS.CSV.NO_FILE })
        .refine((f) => f.size < 100_000, ERRORS.CSV.SIZE)
        .refine((f) => f.type === 'text/csv', ERRORS.CSV.TYPE),
});

export const saveGameSchema = z.object({
    nr: z.number()
        .min(1, { message: ERRORS.GAME.QUESTIONS.NUMBER.MIN }),
    question: z.string().min(1),
    answer: z.string(),
    xc: z.number(),
    yc: z.number(),
    direction: z.nativeEnum(Orientation),
    description: z.string(),
});

export const saveGameArraySchema = z.array(saveGameSchema);

export const saveGameFormSchema = z.object({
    name: z.string().trim().min(1, {
        message: ERRORS.GAME.NAME.EMPTY
    }),
    release_date: z.string().date().min(1),
    published: z.boolean().default(false),
    questions: saveGameArraySchema
});