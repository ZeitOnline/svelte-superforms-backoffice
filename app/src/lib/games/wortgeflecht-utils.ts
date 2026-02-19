import type { WortgeflechtLetterRow } from '$lib/games/wortgeflecht';
import { parseWortgeflechtWords } from '$lib/games/wortgeflecht-generator';

export const normalizeWortgeflechtWordLineValue = (value: string) => value;
export const normalizeWortgeflechtWordKey = (value: string) => value.trim().toLocaleLowerCase('de-DE');

export const normalizeWortgeflechtWordLines = (lines: string[]) => {
  const next = lines.map(line => line ?? '');
  if (next.length === 0) next.push('');
  if (next[next.length - 1].trim() !== '') {
    next.push('');
  }
  while (next.length > 1 && next[next.length - 1].trim() === '' && next[next.length - 2].trim() === '') {
    next.pop();
  }
  return next;
};

export const getUniqueNormalizedWordsFromRows = (rows: WortgeflechtLetterRow[]) =>
  Array.from(
    new Set(
      rows
        .map(row => normalizeWortgeflechtWordKey(row.word ?? ''))
        .filter(Boolean),
    ),
  );

export const hasSameWordSetForWortgeflecht = ({
  wordLines,
  rows,
}: {
  wordLines: string[];
  rows: WortgeflechtLetterRow[];
}) => {
  const expectedWords = parseWortgeflechtWords(wordLines.join('\n')).words;
  const expectedWordKeys = expectedWords.map(normalizeWortgeflechtWordKey);
  const generatedWords = getUniqueNormalizedWordsFromRows(rows);
  return (
    expectedWordKeys.length === generatedWords.length &&
    expectedWordKeys.every(word => generatedWords.includes(word))
  );
};

export const validateWortgeflechtGenerationInput = (wordLines: string[]) => {
  const parsed = parseWortgeflechtWords(wordLines.join('\n'));

  if (parsed.words.length === 0) {
    return {
      parsed,
      error: 'Bitte mindestens ein Wort eingeben (ein Wort pro Zeile).',
    };
  }
  if (parsed.invalidWords.length > 0) {
    return {
      parsed,
      error: 'Ungültige Zeichen gefunden. Erlaubt sind nur Buchstaben (inkl. ÄÖÜẞ).',
    };
  }
  if (parsed.totalLetters !== 48) {
    return {
      parsed,
      error: `Die Wörter müssen zusammen genau 48 Buchstaben ergeben (aktuell: ${parsed.totalLetters}).`,
    };
  }
  const uniqueWordKeys = Array.from(new Set(parsed.words.map(normalizeWortgeflechtWordKey)));
  if (uniqueWordKeys.length !== parsed.words.length) {
    return {
      parsed,
      error: 'Doppelte Wörter sind nicht erlaubt.',
    };
  }

  return {
    parsed,
    error: null,
  };
};
