import type { GameConfig, GameEckchenComplete, GameSpellingBeeComplete, GameType, GameWortigerComplete } from '$types';
import { transformedPublishedData, isGameActive, transformedPublishedDataWithTime } from '$utils';
// Schemas for the games
import { generateEckchenGameSchema, saveEckchenGameFormSchema } from '$schemas/eckchen';
import { generateWortigerGameSchema, saveWortigerGameFormSchema } from '$schemas/wortiger';
import type { ZodValidationSchema } from 'sveltekit-superforms/adapters';
import { generateSpellingBeeGameSchema, saveSpellingBeeGameFormSchema } from '$schemas/spelling-bee';

export const CONFIG_GAMES: Record<GameType, GameConfig> = {
  eckchen: {
    label: 'eckchen',
    apiBase: '/backoffice/api/eckchen',
    productionUrl: 'https://spiele.zeit.de/eckchen',
    endpoints: {
      games: {
        name: 'game',
        releaseDateField: 'release_date',
      },
    },
    schemas: {
      generateGameSchema: generateEckchenGameSchema as unknown as ZodValidationSchema,
      saveGameFormSchema: saveEckchenGameFormSchema as unknown as ZodValidationSchema,
    },
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
          getValue: game => (game as GameEckchenComplete).release_date,
          getDisplayValue: game => transformedPublishedData((game as GameEckchenComplete).release_date),
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
    label: 'wortiger',
    apiBase: '/backoffice/api/wortiger',
    endpoints: {
      games: {
        name: 'wortiger_games',
        releaseDateField: 'release_date',
      },
      wordList: {
        name: 'wortliste',
      },
    },
    productionUrl: 'https://spiele.zeit.de/wortiger',
    schemas: {
      generateGameSchema: generateWortigerGameSchema as unknown as ZodValidationSchema,
      saveGameFormSchema: saveWortigerGameFormSchema as unknown as ZodValidationSchema,
    },
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
          getValue: game => (game as GameWortigerComplete).release_date,
          getDisplayValue: game => transformedPublishedData((game as GameWortigerComplete).release_date),
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
      ],
    },
  },
  "spelling-bee": {
    label: 'spelling-bee',
    apiBase: '/backoffice/api/spelling-bee',
    endpoints: {
      games: {
        name: 'game',
        releaseDateField: 'start_time',
      },
      solutions: { name: 'game_solution' },
    },
    productionUrl: 'https://spiele.zeit.de/spelling-bee',
    schemas: {
      generateGameSchema: generateSpellingBeeGameSchema as unknown as ZodValidationSchema,
      saveGameFormSchema: saveSpellingBeeGameFormSchema as unknown as ZodValidationSchema,
    },
    table: {
      hasLiveView: true,
      columns: [
        {
          key: 'name',
          label: 'Name des Spiels',
          getValue: game => (game as GameSpellingBeeComplete).name,
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
          key: 'start_time',
          label: 'Startzeit',
          getValue: game => (game as GameSpellingBeeComplete).start_time,
          getDisplayValue: game => transformedPublishedDataWithTime((game as GameSpellingBeeComplete).start_time),
          searchable: true,
          sortable: true,
        },
        {
          key: 'wordcloud',
          label: 'Wortwolke',
          getValue: game => (game as GameSpellingBeeComplete).wordcloud,
          searchable: true,
          sortable: true,
        },
      ],
    },
    form: {
      hasQuestionsTable: false,
      fields: [
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          placeholder: 'Buchstabiene Nr.XXX',
          required: true,
        },
        {
          key: 'start_time',
          label: 'Startzeit',
          type: 'date',
          required: true,
        },
        {
          key: 'wordcloud',
          label: 'Wortwolke (9 Zeichen)',
          type: 'text',
          placeholder: 'z. B. abcdefghi',
          required: true,
          validation: { length: 9 },
        },
      ],
    },
  },
};
