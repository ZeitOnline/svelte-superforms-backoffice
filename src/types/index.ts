
/**
 * These are the possible views in the app
 */
export type View = "dashboard" | "new-game" | "edit-game" | "delete-game";


/**
 * This is how I game looks like
 */
export type Game = {
    id: string;
    name: string;
    release_date: string;
    active: boolean;
}

export type Question = {    
    nr: number;
    question: string;
    answer: string;
    xc: number;
    yc: number;
    direction: "h" | "v";
    description: string;
}

export type QuestionComplete = Question & {
    id: string;
    game_id: string;
}

