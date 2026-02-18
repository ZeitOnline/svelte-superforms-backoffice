import { describe, expect, it } from 'vitest';
import { buildWortgeflechtPreviewFromRows, parseWortgeflechtWords, toGridRows } from '$lib/games/wortgeflecht-generator';

describe('wortgeflecht-generator helpers', () => {
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
});
