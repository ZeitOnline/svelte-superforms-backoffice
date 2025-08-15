import type { GameConfig, GameEckchenComplete, GameType, GameWortigerComplete } from '$types';
import { transformedPublishedData, isGameActive } from '$utils';
// Schemas for the games
import { generateEckchenGameSchema, saveEckchenGameFormSchema } from '$schemas/eckchen';
import { generateWortigerGameSchema, saveWortigerGameFormSchema } from '$schemas/wortiger';

export const CONFIG_GAMES: Record<GameType, GameConfig> = {
  eckchen: {
    label: 'Eckchen',
    apiBase: '/api/eckchen',
    apiEndpoint: 'game',
    productionUrl: 'https://spiele.zeit.de/eckchen',
    schemas: {
      generateGameSchema: generateEckchenGameSchema,
      saveGameFormSchema: saveEckchenGameFormSchema,
    },
    ui: { icon: '🧩', themeColor: '#1e88e5' },
    table: {
      hasLiveView: true,
      columns: [
        {
          key: 'name',
          label: 'Name des Spiels',
          getValue: game => (game as GameEckchenComplete).name,
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
    form: {
      hasQuestionsTable: true,
      fields: [
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          placeholder: 'GameXXXX',
          required: true,
        },
        {
          key: 'release_date',
          label: 'Veröffentlichungsdatum',
          type: 'date',
          required: true,
        },
        {
          key: 'published',
          label: 'Aktiv',
          type: 'checkbox',
          required: false,
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
      saveGameFormSchema: saveWortigerGameFormSchema,
    },
    ui: { icon: '🐯', themeColor: '#43a047' },
    table: {
      hasLiveView: true,
      columns: [
        {
          key: 'level',
          label: 'Level des Spiels',
          getValue: game => (game as GameWortigerComplete).level,
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
          getValue: game => (game as GameWortigerComplete).solution || '',
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
    form: {
      hasQuestionsTable: false,
      fields: [
        {
          key: 'level',
          label: 'Level',
          type: 'number',
          placeholder: '1',
          required: true,
        },
        {
          key: 'release_date',
          label: 'Veröffentlichungsdatum',
          type: 'date',
          required: true,
        },
        {
          key: 'solution',
          label: 'Lösung',
          type: 'text',
          placeholder: 'Lösung eingeben',
          required: true,
        },
        {
          key: 'published',
          label: 'Aktiv',
          type: 'checkbox',
          required: false,
        },
      ],
    },
  },
};
