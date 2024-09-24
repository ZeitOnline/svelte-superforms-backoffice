import { Orientation } from "$types";

export const ERRORS = {
    CSV: {
        NO_FILE: 'Bitte laden sie eine CSV hoch.',
        SIZE: 'Darf nicht größer als 100 kB sein.',
        TYPE: 'Es sind nur CSV Dateien erlaubt.',
        NUMBER_OF_COLUMNS: 'Die CSV Datei muss genau 7 Spalten haben.',
        EMPTY: 'Die CSV Datei darf nicht leer sein.',
    },
    EMPTY: 'Darf nicht leer sein.',
    GAME: {
        NAME: {
            EMPTY: 'Der Name darf nicht leer sein.',
            UNIQUE: 'Der Name muss eindeutig sein.',
        },
        RELEASE_DATE: {
            EMPTY: 'Das Veröffentlichungsdatum darf nicht leer sein.',
        },
        QUESTIONS: {
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
        }
    },
}