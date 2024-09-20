import { ERRORS } from "$lib/error-messages";
import { Orientation } from "$types";
import { z } from "zod";

export const generateGameSchema = z.object({
	csv: z
		.instanceof(File, { message: ERRORS.CSV.NO_FILE })
		.refine((f) => f.size < 100_000, ERRORS.CSV.SIZE)
		.refine((f) => f.type === 'text/csv', ERRORS.CSV.TYPE)
});

export const saveGameSchema = z.object({
	nr: z.number({ message: ERRORS.EMPTY }).min(1, { message: ERRORS.GAME.QUESTIONS.NR.MIN }),
	question: z.string().min(1, { message: ERRORS.GAME.QUESTIONS.QUESTION }),
	answer: z.string().min(1, { message: ERRORS.GAME.QUESTIONS.ANSWER }),
	xc: z.number({ message: ERRORS.EMPTY}),
	yc: z.number({ message: ERRORS.EMPTY }),
	direction: z
		.nativeEnum(Orientation, { message: ERRORS.GAME.QUESTIONS.DIRECTION })
		.default(Orientation.HORIZONTAL),
	description: z.string().min(1, { message: ERRORS.GAME.QUESTIONS.DESCRIPTION })
});

export const saveGameArraySchema = z.array(saveGameSchema);

export const saveGameFormSchema = z.object({
	name: z.string().trim().min(1, {
		message: ERRORS.GAME.NAME.EMPTY
	}),
	release_date: z.string().date().min(1, { message: ERRORS.GAME.RELEASE_DATE.EMPTY }),
	published: z.boolean().default(false),
	questions: saveGameArraySchema
});
