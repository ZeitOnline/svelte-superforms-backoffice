import { z } from "zod";

export const generateGameSchema = z.object({
    csv: z
        .instanceof(File, { message: 'Please upload a file.' })
        .refine((f) => f.size < 100_000, 'Max 100 kB upload size.'),
});

enum Orientation {
    HORIZONTAL = "h",
    VERTICAL = "v",
}

export const saveGameSchema = z.object({
    number: z.number(),
    question: z.string(),
    answer: z.string(),
    coordinateX: z.number(),
    coordinateY: z.number(),
    orientation: z.nativeEnum(Orientation),
    hint: z.string(),
});

export const saveGameArraySchema = z.array(saveGameSchema);

export const saveGameFormSchema = z.object({
    games: saveGameArraySchema
});