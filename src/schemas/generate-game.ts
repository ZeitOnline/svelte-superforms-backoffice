import { Orientation } from "$types";
import { z } from "zod";

export const generateGameSchema = z.object({
    csv: z
        .instanceof(File, { message: 'Please upload a file.' })
        .refine((f) => f.size < 100_000, 'Max 100 kB upload size.'),
});

export const saveGameSchema = z.object({
    nr: z.number(),
    question: z.string(),
    answer: z.string(),
    xc: z.number(),
    yc: z.number(),
    direction: z.nativeEnum(Orientation),
    description: z.string(),
});

export const saveGameArraySchema = z.array(saveGameSchema);

export const saveGameFormSchema = z.object({
    name: z.string(),
    release_date: z.string(),
    published: z.boolean().default(false),
    questions: saveGameArraySchema
});