import type z from 'zod';

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
  | 'delete';

/**
 * This is how games look like - matching actual API data structure
 */
export type GameEckchen = {
  name: string;
  release_date: string;
  active?: boolean; // Optional since it might not be in all API responses
  questions?: Question[];
};

export type GameWortiger = {
  level: number;
  release_date: string;
  solution: string;
  active?: boolean; // Optional since it might not be in all API responses
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

export type GameComplete =
  | (GameEckchen & {
      id: number;
    })
  | (GameWortiger & {
      id: number;
    });

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
  schemas: {
    generateGameSchema: z.ZodTypeAny;
    saveGameFormSchema: z.ZodTypeAny;
    saveGameArraySchema?: z.ZodTypeAny;
    saveGameSchema?: z.ZodTypeAny;
  };
  ui: {
    icon: string;
    themeColor: string;
  };
  table: {
    columns: TableColumn[];
    hasLiveView?: boolean; // For the eye icon in Eckchen
  };
};
