import type { GameConfig, GameEckchen, GameWortiger } from '$types';
import { transformedPublishedData, isGameActive } from '$utils';
import {
  generateEckchenGameSchema,
  saveEckchenGameArraySchema,
  saveEckchenGameFormSchema,
  saveEckchenGameSchema,
} from '../schemas/eckchen';
import { generateWortigerGameSchema, saveWortigerGameSchema } from '../schemas/wortiger';

type GameId = 'eckchen' | 'wortiger';

export const CURRENT_GAME: GameId = 'wortiger';
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
    table: {
      hasLiveView: true,
      columns: [
        {
          key: 'name',
          label: 'Name des Spiels',
          getValue: game => (game as GameEckchen & { id: number }).name,
          searchable: true,
          sortable: true,
        },
        {
          key: 'id',
          label: 'ID',
          getValue: game => game.id,
          searchable: true,
          sortable: true,
        },
        {
          key: 'release_date',
          label: 'Veröffentlichungsdatum',
          getValue: game => game.release_date,
          getDisplayValue: game => transformedPublishedData(game.release_date),
          searchable: true,
          sortable: true,
        },
        {
          key: 'active',
          label: 'Aktiv',
          getValue: game => (isGameActive(game) ? 'active' : 'inactive'),
          searchable: false,
          sortable: false,
        },
      ],
    },
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
    table: {
      hasLiveView: true,
      columns: [
        {
          key: 'level',
          label: 'Level des Spiels',
          getValue: game => (game as GameWortiger & { id: number }).level,
          searchable: true,
          sortable: true,
        },
        {
          key: 'id',
          label: 'ID',
          getValue: game => game.id,
          searchable: true,
          sortable: true,
        },
        {
          key: 'release_date',
          label: 'Veröffentlichungsdatum',
          getValue: game => game.release_date,
          getDisplayValue: game => transformedPublishedData(game.release_date),
          searchable: true,
          sortable: true,
        },
        {
          key: 'solution',
          label: 'Lösung',
          getValue: game => (game as GameWortiger & { id: number }).solution || '',
          searchable: true,
          sortable: true,
        },
        {
          key: 'active',
          label: 'Aktiv',
          getValue: () => 'active',
          searchable: false,
          sortable: false,
        },
      ],
    },
  },
};

/**
 * This is temporal until we do it with the routes.
 */

export const CURRENT_GAME_CONFIG = GAMES[CURRENT_GAME];
