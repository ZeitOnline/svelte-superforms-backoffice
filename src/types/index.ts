
/**
 * These are the possible views in the app
 */
export type View = "dashboard" | "new-game" | "edit-game" | "delete-game" | "activity-logs";

/**
 * These are the possible icons in the app (used for the logs for example)
 */
export type IconOption = "create" | "delete" | "update" | "chevron" | "search" | "error" | "upload" | "delete";

/**
 * This is how I game looks like
 */
export type Game = {
    id: number;
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
    direction: Orientation;
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
    detail: string;
    action: "create" | "update" | "delete";
    created_at: string;
}

export enum Orientation {
    HORIZONTAL = "h",
    VERTICAL = "v",
}
