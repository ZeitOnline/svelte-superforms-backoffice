import type { SuperValidated } from 'sveltekit-superforms';
import type { ZodValidationSchema } from 'sveltekit-superforms/adapters';

/**
 * This is the type for the game types used in the app
 * It can be extended with more game types in the future
 */
export type GameType = 'eckchen' | 'wortiger' | 'spelling-bee';

/**
 * These are the possible views in the app
 */
export type View = 'dashboard' | 'new-game' | 'edit-game' | 'delete-game';

/**
 * These are the possible icons in the app (used for the logs for example)
 */
export type IconOption =
  | 'create'
  | 'delete'
  | 'update'
  | 'chevron'
  | 'search'
  | 'error'
  | 'upload'
  | 'delete'
  | 'download';

/**
 * Base type for all games — defines common optional fields.
 */
export type BaseGame = {
  active?: boolean;
};

/**
 * Generic utility type for "complete" games (those that have an ID).
 */
export type CompleteGame<T extends object> = T & { id: number };

/**
 * Game-specific data structures.
 */
export type GameEckchen = BaseGame & {
  name: string;
  release_date: string;
  questions?: Question[];
};

export type GameWortiger = BaseGame & {
  level: number;
  release_date: string;
  solution: string;
};

export type GameSpellingBee = BaseGame & {
  name: string;
  start_time: string;
  wordcloud: string;
};

/**
 * Auto-generate the “complete” types using the generic utility.
 */
export type GameEckchenComplete = CompleteGame<GameEckchen>;
export type GameWortigerComplete = CompleteGame<GameWortiger>;
export type GameSpellingBeeComplete = CompleteGame<GameSpellingBee>;

export type GameComplete = GameEckchenComplete | GameWortigerComplete | GameSpellingBeeComplete;

export type DataProps = {
  games: GameComplete[];
  saveGameForm: SuperValidated<GameEckchen | GameWortiger>;
  generateGameForm: SuperValidated<{
    csv: File;
  }>;
};

export type ToastType = {
  id: string;
  title: string;
  message: string;
};

export type Question = {
  game_id?: number;
  nr: number;
  question: string;
  answer: string;
  xc: number;
  yc: number;
  direction: Orientation;
  description: string;
};

export type QuestionComplete = Question & {
  id: number;
};

export type Log = {
  id: string;
  game_id: string;
  user_name: string;
  detail: string;
  action: 'create' | 'update' | 'delete';
  created_at: string;
};

export enum Orientation {
  HORIZONTAL = 'h',
  VERTICAL = 'v',
}

export type SortDirection = 'asc' | 'desc';

export type BeginningOptions = 'scratch' | 'csv' | 'edit' | null;

export type TableColumn = {
  key: string;
  label: string;
  getValue: (game: GameComplete) => string | number;
  getDisplayValue?: (game: GameComplete) => string;
  searchable?: boolean;
  sortable?: boolean;
};

export type GameConfig = {
  label: string;
  apiBase: string;
  productionUrl: string;
  endpoints: {
    games: {
      name: string;
      releaseDateField: string;
    };
    wordList?: {
      name: string;
    }
  };
  schemas: {
    generateGameSchema: ZodValidationSchema;
    saveGameFormSchema: ZodValidationSchema;
  };
  table: {
    columns: TableColumn[];
    hasLiveView?: boolean; // For the eye icon in Eckchen
  };
  form: {
    fields: FormField[];
    hasQuestionsTable?: boolean; // Whether this game type has a questions table
  };
};

export type FormField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'textarea';
  placeholder?: string;
  required?: boolean;
  validation?: Record<string, unknown>; // For custom validation rules
};
