import beautify from "json-beautify";
import _ from "lodash";

/** Lower-case Eszett: [ß (`U+00DF`)](https://symbl.cc/en/00DF/) */
const LOWER_CASE_ESZETT = "ß";

/** Upper-case Eszett: [ẞ (`U+1E9E`)](https://symbl.cc/en/1E9E/) */
const UPPER_CASE_ESZETT = "ẞ";

/** The locale for German as spoken in Germany, as a [<abbr title="Best Current Practice">BCP</abbr> 47](https://www.rfc-editor.org/info/bcp47) language tag */
const LOCALE_GERMAN_GERMANY = "de-DE";

/** Converts all alphabetic characters to German uppercase characters.
 *
 * Contrary to [`String.prototype.toLocaleUpperCase()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleUpperCase), this function converts [lower-case <q>ß</q> (`U+00DF`)](https://symbl.cc/en/00DF/) into [upper-case <q>ẞ</q> (`U+1E9E`)](https://symbl.cc/en/1E9E/). */
export const toGermanUpperCase = (str: string) => {
    return str
        .replaceAll(LOWER_CASE_ESZETT, UPPER_CASE_ESZETT)
        .toLocaleUpperCase(LOCALE_GERMAN_GERMANY);
};

export const toGermanLowerCase = (str: string) => {
    return str.toLocaleLowerCase(LOCALE_GERMAN_GERMANY);
};


export type Puzzle = {
    id: number;
    theme: string;
    words: string[];
    publishDate: string | null;
    frozen: boolean;
    inProd: boolean;
    notes: string;
    explainer: string;
    valid: boolean;
    grid: string[];
    locations: Array<Array<Array<number>>>;
    wordStatus?: string[]; // Added wordStatus property
};

export type SerializedPuzzle = {
    id: number;
    theme: string;
    words: string;
    grid: string;
    frozen: number;
    publishDate: string;
    inProd: number;
    explainer: string;
    notes: string;
    valid: number;
    locations: string;
};

export const WORD_STATUS = {
    VALID: "valid",
    MISSING: "missing",
    MULTIPLE: "multiple",
    UNKNOWN: "unknown",
    EMPTY: "empty",
};

export const createPuzzle = (puz: Partial<Puzzle>): Puzzle => {
    return {
        id: puz.id ?? 0,
        theme: puz.theme ?? "",
        publishDate: puz.publishDate ?? null,
        grid: puz.grid ?? Array(48).fill(""),
        words: puz.words ?? [],
        locations: puz.locations ?? [],
        wordStatus: puz.wordStatus ?? [],
        valid: puz.valid ?? false,
        frozen: puz.frozen ?? false,
        inProd: puz.inProd ?? false,
        notes: puz.notes ?? "",
        explainer: puz.explainer ?? "",
    } as Puzzle;
};

const getFreeNeighbors = (loc: number, wordLocs: number[]): number[] => {
    let directions = [-6, 6];
    const dirLeft = [-7, -1, 5];
    const dirRight = [-5, 1, 7];

    const neighbors: number[] = [];

    if (loc % 6 !== 0) {
        directions = directions.concat(dirLeft);
    }
    if (loc % 6 !== 5) {
        directions = directions.concat(dirRight);
    }

    for (const direction of directions) {
        const n = loc + direction;
        if (n >= 0 && n < 48 && !wordLocs.includes(n)) {
            neighbors.push(n);
        }
    }

    return neighbors;
};

const traceWord = (
    grid: string[],
    start: number,
    path: number[] | null,
    paths: number[][],
    word: string[]
): void => {
    if (path === null) {
        path = [];
    }
    const head = word[0];
    if (grid[start] === head) {
        path.push(start);
        if (word.length === 1) {
            paths.push(Array.from(path));
            path.pop();
            return;
        }
        const neighbors = getFreeNeighbors(start, path);
        if (neighbors.length > 0) {
            for (const n of neighbors) {
                traceWord(grid, n, path, paths, word.slice(1));
            }
        }
        path.pop();
    }
};

export const findWord = (grid: string[], word: string): number[][] => {
    const locs: number[][] = [];
    const runes = Array.from(word.trim());

    for (let pos = 0; pos < grid.length; pos++) {
        traceWord(grid, pos, null, locs, runes);
    }

    return locs;
};

export const checkGrid = (grid: string[], words: string[]): number[][][] => {
    const locs: number[][][] = [];

    for (const w of words) {
        if (w !== "") {
            locs.push(findWord(grid, w));
        } else {
            locs.push([]);
        }
    }

    return locs;
};

const sameCells = (locs: number[][]): boolean => {
    const len = locs[0].length;
    const allNodes = _.reduce(
        locs,
        (ret: number[], loc: number[]) => _.union(ret, loc),
        []
    );
    return len === allNodes.length;
};

export const checkPuzzle = (
    puz: Puzzle | { grid: string[]; words: string[] },
    ignoreWords = false
): Puzzle => {
    let puzzle: Puzzle;

    if (typeof puz === "undefined") {
        puzzle = createPuzzle(puz);
    } else {
        puzzle = puz as Puzzle;
    }
    if (puzzle.words.length > 0) {
        puzzle.locations = checkGrid(puzzle.grid, puzzle.words);
        puzzle.wordStatus = [];

        for (let l = 0; l < puzzle.locations.length; l++) {
            const loc = puzzle.locations[l];
            if (loc.length === 1) {
                puzzle.wordStatus[l] = WORD_STATUS.VALID;
            } else if (puzzle.words[l] !== "") {
                if (loc.length === 0) {
                    puzzle.wordStatus[l] = WORD_STATUS.MISSING;
                } else if (loc.length > 1) {
                    if (!sameCells(loc)) {
                        puzzle.wordStatus[l] = WORD_STATUS.MULTIPLE;
                    } else {
                        puzzle.wordStatus[l] = WORD_STATUS.VALID;
                    }
                }
            } else {
                puzzle.wordStatus[l] = WORD_STATUS.EMPTY;
            }
        }

        puzzle.valid =
            _.every(
                puzzle.wordStatus,
                (v) => v === WORD_STATUS.VALID || v === WORD_STATUS.EMPTY
            ) &&
            (ignoreWords ||
                _.reduce(puzzle.words, (l, w) => l + w.trim().length, 0) ===
                    48);
    } else {
        puzzle.locations = [];
        puzzle.wordStatus = [];
        puzzle.valid = false;
    }

    return puzzle;
};

const index_to_xy = (idx: number): { x: number; y: number } => {
    return { x: idx % 6, y: Math.floor(idx / 6) };
};

export const generateJSON = (puzzle: {
    words: string[];
    locations: number[][][];
}): string => {
    const locations = puzzle.locations;

    console.log('generateJSON',puzzle);

    const json: Record<string, { letter: string; cX: number; cY: number }[]> = {};
    for (let w = 0; w < puzzle.words.length; w++) {
        const word = toGermanLowerCase(puzzle.words[w].trim());
        if (word !== "") {
            const letters = locations[w][0].map((l, i) => {
                const xy = index_to_xy(l);
                return {
                    letter: word[i],
                    cX: xy.y + 1,
                    cY: xy.x + 1,
                };
            });

            json[word] = letters;
        }
    }
    console.log('generateJSON',json);
    return beautify(json, (k: string, v: string) => v, 2, 60);
};

const index_to_coords = (idx: number): { x: number; y: number } => {
    return { x: (idx % 6) * 50 + 26, y: Math.floor(idx / 6) * 50 + 26 };
};

export const clearCanvas = (canvas_id: string): void => {
    const canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
};

export const highlightWord = (
    path: number[],
    canvas: HTMLCanvasElement,
    color: string = "lightblue",
    invalid: number | boolean = false
): void => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    ctx.setLineDash([]);

    if (typeof invalid === "number" && invalid > 0) {
        ctx.lineWidth = 2 + (invalid - 1) * 4;
    } else {
        ctx.lineWidth = 10;
    }

    if (!invalid || (typeof invalid === "number" && invalid > 0)) {
        ctx.beginPath();
        for (let pos = 0; pos < path.length; pos++) {
            const xy = index_to_coords(path[pos]);
            if (pos === 0) {
                ctx.moveTo(xy.x, xy.y);
            } else {
                ctx.lineTo(xy.x, xy.y);
            }
        }
        ctx.stroke();
    }

    if (!invalid || (typeof invalid === "number" && invalid < 0)) {
        for (const pos of path) {
            const xy = index_to_coords(pos);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(xy.x, xy.y, 20, 0, Math.PI * 2);
            if (!invalid || (typeof invalid === "number" && invalid > 0)) {
                ctx.fill();
            } else {
                ctx.lineWidth = 5;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
            }
        }
    } else {
        for (const pos of [0, path.length - 1]) {
            const xy = index_to_coords(path[pos]);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(
                xy.x,
                xy.y,
                8 + (typeof invalid === "number" ? invalid * 2 : 0),
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
};
