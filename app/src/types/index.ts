import type { SuperValidated } from 'sveltekit-superforms';
import type { ZodValidationSchema } from 'sveltekit-superforms/adapters';

/**
 * This is the type for the game types used in the app
 * It can be extended with more game types in the future
 */
export type GameType = 'eckchen' | 'wortiger';

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
 * This is how games look like - matching actual API data structure
 */
export type GameEckchen = {
  name: string;
  release_date: string;
  active?: boolean; // Optional since it might not be in all API responses
  questions?: Question[];
};

export type GameEckchenComplete = GameEckchen & {
  id: number; // ID is required for the complete game type
};

export type GameWortiger = {
  level: number;
  release_date: string;
  solution: string;
  active?: boolean; // Optional since it might not be in all API responses
};

export type GameWortigerComplete = GameWortiger & {
  id: number; // ID is required for the complete game type
};

export type DataProps = {
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

export type GameComplete = GameEckchenComplete | GameWortigerComplete;

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
  apiEndpoint: string;
  apiWordListEndpoint?: string;
  schemas: {
    generateGameSchema: ZodValidationSchema;
    saveGameFormSchema: ZodValidationSchema;
  };
  ui: {
    icon: string;
    themeColor: string;
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
