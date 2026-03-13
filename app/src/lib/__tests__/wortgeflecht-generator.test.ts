import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildWortgeflechtPreviewFromRows,
  generateWortgeflechtLayout,
  hasSeparatedMatchingInitialWordStarts,
  hasUnambiguousNextLetterChoices,
  parseWortgeflechtWords,
  prioritizeWordsForPlacement,
  toGridRows,
} from '$lib/games/wortgeflecht-generator';

// A deterministic PRNG for testing purposes, based on the Mulberry32 algorithm.
// Always returns the same sequence, which
// makes a randomized test reproducible and avoids flaky CI failures.
const mulberry32 = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

describe('wortgeflecht-generator helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses words from multiline input and ignores empty lines', () => {
    const parsed = parseWortgeflechtWords('  alpha \n\nbeta \n  \nämter');

    expect(parsed.words).toEqual(['alpha', 'beta', 'ämter']);
    expect(parsed.totalLetters).toBe(14);
    expect(parsed.invalidWords).toEqual([]);
  });

  it('keeps ß during parsing', () => {
    const parsed = parseWortgeflechtWords('süßlich');
    expect(parsed.words).toEqual(['süßlich']);
    expect(parsed.invalidWords).toEqual([]);
  });

  it('flags invalid words containing non-letter characters', () => {
    const parsed = parseWortgeflechtWords('TEST\nAB-12\nÖL');

    expect(parsed.invalidWords).toEqual(['AB-12']);
  });

  it('preserves caller order for words with equal placement priority', () => {
    const ordered = prioritizeWordsForPlacement(['abdd', 'abca', 'abcb']);
    expect(ordered).toEqual(['abdd', 'abca', 'abcb']);
  });

  it('converts a 48-cell array into 8 rows with 6 columns each', () => {
    const grid = Array.from({ length: 48 }, (_, i) => `${i}`);
    const rows = toGridRows(grid);

    expect(rows).toHaveLength(8);
    expect(rows[0]).toHaveLength(6);
    expect(rows[0][0]).toBe('0');
    expect(rows[7][5]).toBe('47');
  });

  it('rebuilds grid and paths from persisted rows', () => {
    const rows = [
      { word: 'PACO', letter: 'P', cx: 1, cy: 1 },
      { word: 'PACO', letter: 'A', cx: 1, cy: 2 },
      { word: 'PACO', letter: 'C', cx: 1, cy: 3 },
      { word: 'PACO', letter: 'O', cx: 1, cy: 4 },
      { word: 'IMKE', letter: 'I', cx: 2, cy: 1 },
      { word: 'IMKE', letter: 'M', cx: 2, cy: 2 },
      { word: 'IMKE', letter: 'K', cx: 2, cy: 3 },
      { word: 'IMKE', letter: 'E', cx: 2, cy: 4 },
    ];

    const preview = buildWortgeflechtPreviewFromRows(rows);

    expect(preview.grid[0]).toBe('P');
    expect(preview.grid[1]).toBe('A');
    expect(preview.grid[2]).toBe('C');
    expect(preview.grid[3]).toBe('O');
    expect(preview.grid[6]).toBe('I');
    expect(preview.paths).toHaveLength(2);
    expect(preview.paths.map(p => p.word)).toEqual(['PACO', 'IMKE']);
    expect(preview.paths[0]?.cells).toHaveLength(4);
  });

  it('ignores out-of-bounds coordinates while rebuilding preview', () => {
    const rows = [
      { word: 'PACO', letter: 'P', cx: 1, cy: 1 },
      { word: 'PACO', letter: 'A', cx: 1, cy: 2 },
      { word: 'PACO', letter: 'C', cx: 9, cy: 9 },
      { word: 'PACO', letter: 'O', cx: -1, cy: 4 },
    ];
    const preview = buildWortgeflechtPreviewFromRows(rows);
    expect(preview.grid[0]).toBe('P');
    expect(preview.grid[1]).toBe('A');
    expect(preview.paths).toHaveLength(1);
    expect(preview.paths[0]?.cells).toHaveLength(2);
  });

  it('does not crash with duplicate rows/letters', () => {
    const rows = [
      { word: 'PACO', letter: 'P', cx: 1, cy: 1 },
      { word: 'PACO', letter: 'P', cx: 1, cy: 1 },
      { word: 'PACO', letter: 'A', cx: 1, cy: 2 },
      { word: 'PACO', letter: 'C', cx: 1, cy: 3 },
      { word: 'PACO', letter: 'O', cx: 1, cy: 4 },
    ];
    expect(() => buildWortgeflechtPreviewFromRows(rows)).not.toThrow();
    const preview = buildWortgeflechtPreviewFromRows(rows);
    expect(preview.paths.map(p => p.word)).toContain('PACO');
  });

  it('preserves word order from row input for display paths', () => {
    const rows = [
      { word: 'IMKE', letter: 'I', cx: 2, cy: 1 },
      { word: 'PACO', letter: 'P', cx: 1, cy: 1 },
      { word: 'IMKE', letter: 'M', cx: 2, cy: 2 },
      { word: 'PACO', letter: 'A', cx: 1, cy: 2 },
      { word: 'IMKE', letter: 'K', cx: 2, cy: 3 },
      { word: 'PACO', letter: 'C', cx: 1, cy: 3 },
      { word: 'IMKE', letter: 'E', cx: 2, cy: 4 },
      { word: 'PACO', letter: 'O', cx: 1, cy: 4 },
    ];
    const preview = buildWortgeflechtPreviewFromRows(rows);
    expect(preview.paths.map(p => p.word)).toEqual(['IMKE', 'PACO']);
  });

  it('preserves ß words when rebuilding preview from saved rows', () => {
    const rows = [
      { word: 'süßlich', letter: 's', cx: 1, cy: 1 },
      { word: 'süßlich', letter: 'ü', cx: 1, cy: 2 },
      { word: 'süßlich', letter: 'ß', cx: 1, cy: 3 },
      { word: 'süßlich', letter: 'l', cx: 1, cy: 4 },
      { word: 'süßlich', letter: 'i', cx: 1, cy: 5 },
      { word: 'süßlich', letter: 'c', cx: 1, cy: 6 },
      { word: 'süßlich', letter: 'h', cx: 1, cy: 7 },
    ];

    const preview = buildWortgeflechtPreviewFromRows(rows);

    expect(preview.paths).toHaveLength(1);
    expect(preview.paths[0]?.word).toBe('süßlich');
    expect(preview.grid).toContain('ß');
    expect((preview.paths[0]?.cells.length ?? 0) > 0).toBe(true);
  });

  it('rejects neighboring starts for words with the same initial', () => {
    expect(
      hasSeparatedMatchingInitialWordStarts([
        {
          word: 'Reck',
          cells: [
            { x: 0, y: 0, letter: 'R' },
            { x: 0, y: 1, letter: 'E' },
          ],
        },
        {
          word: 'Ringe',
          cells: [
            { x: 1, y: 0, letter: 'R' },
            { x: 2, y: 0, letter: 'I' },
          ],
        },
      ]),
    ).toBe(false);

    expect(
      hasSeparatedMatchingInitialWordStarts([
        {
          word: 'Reck',
          cells: [
            { x: 0, y: 0, letter: 'R' },
            { x: 0, y: 1, letter: 'E' },
          ],
        },
        {
          word: 'Ringe',
          cells: [
            { x: 3, y: 3, letter: 'R' },
            { x: 4, y: 3, letter: 'I' },
          ],
        },
      ]),
    ).toBe(true);
  });

  it('never returns a generated layout with neighboring same-initial starts', () => {
    const words = ['rabatten', 'ringelnd', 'kompasse', 'blutader', 'dachform', 'zeitungx'];
    const generated = generateWortgeflechtLayout({ words, attempts: 200 });

    expect(generated === null || hasSeparatedMatchingInitialWordStarts(generated.paths)).toBe(true);
  });

  it(
    'still finds a layout for the walz/wanderbuch sample set',
    () => {
    const words = ['walz', 'wanderbuch', 'stenz', 'kluft', 'geselle', 'handwerk', 'schallern'];
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(0x5eed1234));
    const generated = generateWortgeflechtLayout({ words, attempts: 200 });

    expect(generated).not.toBeNull();
    expect(hasSeparatedMatchingInitialWordStarts(generated?.paths ?? [])).toBe(true);
    expect(hasUnambiguousNextLetterChoices(generated?.paths ?? [])).toBe(true);
    },
    15000,
  );

  it('rejects paths where the next letter could be taken from another word', () => {
    expect(
      hasUnambiguousNextLetterChoices([
        {
          word: 'walz',
          cells: [
            { x: 0, y: 0, letter: 'w' },
            { x: 1, y: 0, letter: 'a' },
            { x: 2, y: 0, letter: 'l' },
            { x: 3, y: 0, letter: 'z' },
          ],
        },
        {
          word: 'wa',
          cells: [
            { x: 0, y: 2, letter: 'w' },
            { x: 0, y: 1, letter: 'a' },
          ],
        },
      ]),
    ).toBe(false);

    expect(
      hasUnambiguousNextLetterChoices([
        {
          word: 'walz',
          cells: [
            { x: 0, y: 0, letter: 'w' },
            { x: 1, y: 0, letter: 'a' },
            { x: 2, y: 0, letter: 'l' },
            { x: 3, y: 0, letter: 'z' },
          ],
        },
        {
          word: 'wa',
          cells: [
            { x: 5, y: 2, letter: 'w' },
            { x: 5, y: 3, letter: 'a' },
          ],
        },
      ]),
    ).toBe(true);

    expect(
      hasUnambiguousNextLetterChoices([
        {
          word: 'walz',
          cells: [
            { x: 0, y: 0, letter: 'w' },
            { x: 1, y: 0, letter: 'a' },
            { x: 2, y: 0, letter: 'l' },
            { x: 3, y: 0, letter: 'z' },
          ],
        },
        {
          word: 'le',
          cells: [
            { x: 1, y: 1, letter: 'l' },
            { x: 2, y: 1, letter: 'e' },
          ],
        },
      ]),
    ).toBe(false);
  });
});
