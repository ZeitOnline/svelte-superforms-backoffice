export const ERRORS = {
    CSV: {
        NO_FILE: 'Bitte laden sie eine CSV hoch.',
        SIZE: 'Darf nicht größer als 100 kB sein.',
        TYPE: 'Es sind nur CSV Dateien erlaubt.',
        NUMBER_OF_COLUMNS: 'Die CSV Datei muss genau 7 Spalten haben.',
        EMPTY: 'Die CSV Datei darf nicht leer sein.',
    },
    GAME: {
        NAME: {
            EMPTY: 'Der Name darf nicht leer sein.',
            UNIQUE: 'Der Name muss eindeutig sein.',
        },
        RELEASE_DATE: {
            EMPTY: 'Das Veröffentlichungsdatum darf nicht leer sein.',
        },
        QUESTIONS: {
            NUMBER: {
                MIN: 'Die Nummer muss größer als 0 sein.',
            },
            QUESTION: 'Die Frage darf nicht leer sein.',
            ANSWER: 'Die Antwort darf nicht leer sein.',
            XC: 'Die X-Koordinate darf nicht leer sein.',
            YC: 'Die Y-Koordinate darf nicht leer sein.',
            DIRECTION: 'Die Richtung darf nicht leer sein.',
            DESCRIPTION: 'Die Beschreibung darf nicht leer sein.',
        }
    },
}