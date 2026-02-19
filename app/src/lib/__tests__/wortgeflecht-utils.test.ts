import { describe, expect, it } from 'vitest';
import {
  hasSameWordSetForWortgeflecht,
  normalizeWortgeflechtWordLines,
  normalizeWortgeflechtWordLineValue,
  validateWortgeflechtGenerationInput,
} from '$lib/games/wortgeflecht-utils';
import type { WortgeflechtLetterRow } from '$lib/games/wortgeflecht';

describe('wortgeflecht-utils', () => {
  it('keeps single line input unchanged (preserve ß)', () => {
    expect(normalizeWortgeflechtWordLineValue('süßlich')).toBe('süßlich');
  });

  it('normalizes row list to keep one trailing empty line', () => {
    expect(normalizeWortgeflechtWordLines(['PACO', '', ''])).toEqual(['PACO', '']);
    expect(normalizeWortgeflechtWordLines(['PACO'])).toEqual(['PACO', '']);
    expect(normalizeWortgeflechtWordLines([])).toEqual(['']);
  });

  it('compares input words with generated rows as set equality', () => {
    const rows: WortgeflechtLetterRow[] = [
      { word: 'PACO', letter: 'P', cx: 1, cy: 1 },
      { word: 'PACO', letter: 'A', cx: 1, cy: 2 },
      { word: 'PACO', letter: 'C', cx: 1, cy: 3 },
      { word: 'PACO', letter: 'O', cx: 1, cy: 4 },
      { word: 'IMKE', letter: 'I', cx: 2, cy: 1 },
      { word: 'IMKE', letter: 'M', cx: 2, cy: 2 },
      { word: 'IMKE', letter: 'K', cx: 2, cy: 3 },
      { word: 'IMKE', letter: 'E', cx: 2, cy: 4 },
    ];

    expect(hasSameWordSetForWortgeflecht({ wordLines: ['IMKE', 'PACO', ''], rows })).toBe(true);
    expect(hasSameWordSetForWortgeflecht({ wordLines: ['IMKE', 'SOEREN', ''], rows })).toBe(false);
  });

  it('detects duplicates in input word list for set comparison', () => {
    const rows: WortgeflechtLetterRow[] = [
      { word: 'PACO', letter: 'P', cx: 1, cy: 1 },
      { word: 'PACO', letter: 'A', cx: 1, cy: 2 },
      { word: 'PACO', letter: 'C', cx: 1, cy: 3 },
      { word: 'PACO', letter: 'O', cx: 1, cy: 4 },
    ];
    expect(hasSameWordSetForWortgeflecht({ wordLines: ['PACO', 'PACO', ''], rows })).toBe(false);
  });

  it('normalizes case/whitespace and trailing lines for set comparison', () => {
    const rows: WortgeflechtLetterRow[] = [
      { word: 'PACO', letter: 'P', cx: 1, cy: 1 },
      { word: 'PACO', letter: 'A', cx: 1, cy: 2 },
      { word: 'PACO', letter: 'C', cx: 1, cy: 3 },
      { word: 'PACO', letter: 'O', cx: 1, cy: 4 },
    ];
    expect(hasSameWordSetForWortgeflecht({ wordLines: ['  paco  ', '', ''], rows })).toBe(true);
  });

  it('treats ß and ẞ as same key in set comparison', () => {
    const rows: WortgeflechtLetterRow[] = [
      { word: 'SÜẞLICH', letter: 'S', cx: 1, cy: 1 },
    ];
    expect(hasSameWordSetForWortgeflecht({ wordLines: ['süßlich', ''], rows })).toBe(true);
  });

  it('rejects generation input when total letters are not 48', () => {
    const result = validateWortgeflechtGenerationInput(['PACO', 'IMKE', '']);
    expect(result.error).toContain('genau 48 Buchstaben');
  });

  it('rejects generation input with invalid characters', () => {
    const result = validateWortgeflechtGenerationInput(['PACO', 'IMKE-1', '']);
    expect(result.error).toBe('Ungültige Zeichen gefunden. Erlaubt sind nur Buchstaben (inkl. ÄÖÜẞ).');
  });

  it('rejects generation input with duplicate words', () => {
    const withDuplicate = [
      'ABCD',
      'EFGH',
      'IJKL',
      'MNOP',
      'QRST',
      'UVWX',
      'YZAB',
      'CDEF',
      'GHIJ',
      'KLMN',
      'OPQR',
      'ABCD',
    ];
    const result = validateWortgeflechtGenerationInput(withDuplicate);
    expect(result.error).toBe('Doppelte Wörter sind nicht erlaubt.');
  });
});
