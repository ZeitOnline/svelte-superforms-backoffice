import { z } from "zod";

export const generateGameSchema = z.object({
    name: z.string().default('Paco'),
    email: z.string().email().default("manuel@zeit.de"),
    csv: z
        .instanceof(File, { message: 'Please upload a file.' })
        .refine((f) => f.size < 100_000, 'Max 100 kB upload size.'),
});

// TODO: this needs to be an array
export const saveGameSchema = z.object({
    name: z.string(),
    age: z.string(),
});