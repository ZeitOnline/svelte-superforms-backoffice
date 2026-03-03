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
    LEVEL_DATE_TAKEN: 'Für dieses Level gibt es an diesem Veröffentlichungsdatum bereits ein Wort.',
    SOLUTION: {
      REQUIRED: 'Die Lösung darf nicht leer sein.',
      TAKEN: 'Diese Lösung ist bereits vergeben.',
    },
    CSV: {
      NUMBER_OF_COLUMNS:
        'Die CSV Datei muss entweder 2 Spalten (Datum und Wort) oder 5 Spalten (Release_Date, Level_4-7) haben.',
      MISSING_VALUES: 'Jede Zeile muss ein Datum und ein Wort enthalten.',
      MISSING_DATE: 'Jede Zeile muss ein Datum enthalten.',
      NO_WORDS_IN_ROW: 'Jede Zeile muss mindestens ein Wort enthalten.',
      MIXED_WORD_LENGTHS:
        'Die CSV darf nur ein einzelnes Level enthalten (alle Wörter müssen gleich lang sein: 4, 5, 6 oder 7 Zeichen).',
      INVALID_HEADERS:
        'Wortiger CSV Header ungültig. Erlaubt: Datum+Wort oder Release_Date+Level_4+Level_5+Level_6+Level_7.',
    },
  },
  ECKCHEN: {
    CSV: {
      NUMBER_OF_COLUMNS: 'Die CSV Datei muss genau 7 Spalten haben.',
    },
  },
  SPELLING_BEE: {
    CSV: {
      NUMBER_OF_COLUMNS: 'Die CSV Datei muss genau 6 Spalten haben.',
      WORDCLOUD_INVALID: 'Die Wortwolke muss ausgefüllt sein und genau 9 Zeichen haben.',
      WORDCLOUD_MISMATCH: 'Alle Zeilen müssen dieselbe Wortwolke verwenden.',
      SOLUTION_INCOMPATIBLE: 'Mindestens eine Lösung lässt sich nicht aus der Wortwolke bilden.',
      NO_SOLUTIONS: 'Keine Lösungen in der CSV gefunden.',
    },
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
