import type z from 'zod';
import {
  generateEckchenGameSchema,
  saveEckchenGameArraySchema,
  saveEckchenGameFormSchema,
  saveEckchenGameSchema,
} from '../schemas/eckchen';
import { generateWortigerGameSchema, saveWortigerGameSchema } from '../schemas/wortiger';

type GameId = 'eckchen' | 'wortiger';

type GameConfig = {
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
};

export const GAMES: Record<GameId, GameConfig> = {
  eckchen: {
    label: 'Eckchen',
    apiBase: '/api/eckchen',
    apiEndpoint: 'game',
    productionUrl: 'https://spiele.zeit.de/eckchen',
    schemas: {
      generateGameSchema: generateEckchenGameSchema,
      saveGameFormSchema: saveEckchenGameFormSchema,
      saveGameArraySchema: saveEckchenGameArraySchema,
      saveGameSchema: saveEckchenGameSchema,
    },
    ui: { icon: '🧩', themeColor: '#1e88e5' },
  },
  wortiger: {
    label: 'Wortiger',
    apiBase: '/api/wortiger',
    apiEndpoint: 'wortiger_games',
    productionUrl: 'https://spiele.zeit.de/wortiger',
    schemas: {
      generateGameSchema: generateWortigerGameSchema,
      saveGameFormSchema: saveWortigerGameSchema,
    },
    ui: { icon: '🐯', themeColor: '#43a047' },
  },
};

/**
 * This is temporal until we do it with the routes.
 */
export const CURRENT_GAME: GameId = 'wortiger';
export const CURRENT_GAME_CONFIG = GAMES[CURRENT_GAME];
