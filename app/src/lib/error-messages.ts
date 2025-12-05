import { Orientation } from '$types';

export const ERRORS = {
  CSV: {
    NO_FILE: 'Bitte laden sie eine CSV hoch.',
    SIZE: 'Darf nicht größer als 100 kB sein.',
    TYPE: 'Es sind nur CSV Dateien erlaubt.',
    EMPTY: 'Die CSV Datei darf nicht leer sein.',
    PARSE: 'Fehler beim Lesen der CSV',
  },
  EMPTY: 'Darf nicht leer sein.',
  GAME: {
    FAILED_TO_ADD: '⚠️ Fehler beim Hinzufügen des Spiels, bitte versuchen Sie es erneut.',
    NAME: {
      EMPTY: 'Der Name darf nicht leer sein.',
      TOO_LONG: 'Der Name ist zu lang (max. 254 Zeichen).',
      REQUIRED: 'Der Name ist erforderlich.',
      UNIQUE: 'Der Name muss eindeutig sein.',
      TAKEN: 'Der Name ist bereits vergeben.',
    },
    LEVEL: {
      REQUIRED: 'Das Level darf nicht leer sein.',
    },
    RELEASE_DATE: {
      EMPTY: 'Das Veröffentlichungsdatum darf nicht leer sein.',
      TAKEN: 'Das Veröffentlichungsdatum ist bereits vergeben.',
    },
    QUESTIONS: {
      DUPLICATED_ID_OR_DIRECTION: 'Die Kombination aus Nummer und Direction muss einzigartig sein.',
      NR: {
        EMPTY: 'Die Nummer darf nicht leer sein.',
        MIN: 'Nr. muss größer als 0 sein.',
      },
      XC: {
        EMPTY: 'Die X-Koordinate darf nicht leer sein.',
        MIN: 'Die X-Koordinate muss größer oder gleich 0 sein.',
      },
      YC: {
        EMPTY: 'Die Y-Koordinate darf nicht leer sein.',
        MIN: 'Die Y-Koordinate muss größer oder gleich 0 sein.',
      },
      QUESTION: 'Die Frage darf nicht leer sein.',
      ANSWER: 'Die Antwort darf nicht leer sein.',
      DIRECTION: `Die Richtung muss '${Orientation.HORIZONTAL}' oder '${Orientation.VERTICAL}' sein.`,
      DESCRIPTION: 'Die Beschreibung darf nicht leer sein.',
    },
  },
  WORTIGER: {
    WORD_TOO_SHORT: 'Das Wort ist nicht lang genug.',
    WORD_TOO_LONG: 'Das Wort ist zu lang.',
    DUPLICATE_WORDS: 'Die Wörter müssen eindeutig sein.',
    SOLUTION: {
      REQUIRED: 'Die Lösung darf nicht leer sein.',
      TAKEN: 'Diese Lösung ist bereits vergeben.',
    },
    CSV: {
      NUMBER_OF_COLUMNS: 'Die CSV Datei muss genau 5 Spalten haben.',
    },
  },
  ECKCHEN: {
    CSV: {
      NUMBER_OF_COLUMNS: 'Die CSV Datei muss genau 7 Spalten haben.',
    },
  },
  SPELLING_BEE: {
    WORDCLOUD: {
      LENGTH: 'Die Wortwolke muss genau 9 Buchstaben enthalten.',
    },
    SOLUTION: {
      GAME_ID: {
        REQUIRED: 'Game ID is required.',
        MIN: 'Game ID must be greater than 0.',
      },
      SOLUTION: {
        REQUIRED: 'Solution cannot be empty.',
        MAX: 'Solution is too long.',
      },
      POINTS: {
        REQUIRED: 'Points must be provided.',
        MIN: 'Points cannot be negative.',
        MAX: 'Points exceed the maximum allowed.',
      },
      TYPE: {
        REQUIRED: 'Solution type is required.',
        MAX: 'Solution type is too long.',
      },
      EXPLANATION: {
        REQUIRED: 'Solution explanation is required.',
        MAX: 'Solution explanation is too long.',
      },
    },
  },
};
