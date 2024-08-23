
/**
 * These are the possible views in the app
 */
export type View = "dashboard" | "new-game" | "edit-game" | "delete-game" | "activity-logs";

/**
 * These are the possible icons in the app (used for the logs for example)
 */
export type IconOption = "create" | "delete" | "update" | "chevron" | "search" | "error";

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

export type Log = {
    id: string;
    game_id: string;
    user_name: string;
    action: "create" | "update" | "delete";
    created_at: string;
}
