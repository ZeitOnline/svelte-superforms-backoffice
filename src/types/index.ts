
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
    publishedAt: string;
    isActive: boolean;
}