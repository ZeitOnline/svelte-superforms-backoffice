import type { WortgeflechtLetterRow } from '$lib/games/wortgeflecht';
import { parseWortgeflechtWords } from '$lib/games/wortgeflecht-generator';

const MIN_WORTGEFLECHT_WORD_LENGTH = 4;

export const normalizeWortgeflechtWordLineValue = (value: string) => value.toLocaleLowerCase('de-DE');
export const normalizeWortgeflechtWordKey = (value: string) => value.trim().toLocaleLowerCase('de-DE');

const getUniqueWordsByKey = (words: string[]) => {
  const wordsByKey = new Map<string, string>();

  for (const word of words) {
    const trimmedWord = word.trim();
    const key = normalizeWortgeflechtWordKey(trimmedWord);
    if (!trimmedWord || wordsByKey.has(key)) continue;
    wordsByKey.set(key, trimmedWord);
  }

  return Array.from(wordsByKey.values());
};

export const analyzeWortgeflechtGenerationInput = (wordLines: string[]) => {
  const parsed = parseWortgeflechtWords(wordLines.join('\n'));
  const tooShortWords = getUniqueWordsByKey(
    parsed.words.filter(word => Array.from(word.trim()).length < MIN_WORTGEFLECHT_WORD_LENGTH),
  );

  const wordCountByKey = new Map<string, number>();
  for (const word of parsed.words) {
    const key = normalizeWortgeflechtWordKey(word);
    if (!key) continue;
    wordCountByKey.set(key, (wordCountByKey.get(key) ?? 0) + 1);
  }

  const duplicateWords = getUniqueWordsByKey(
    parsed.words.filter(word => (wordCountByKey.get(normalizeWortgeflechtWordKey(word)) ?? 0) > 1),
  );

  return {
    parsed,
    tooShortWords,
    duplicateWords,
  };
};

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
  const analysis = analyzeWortgeflechtGenerationInput(wordLines);
  const { parsed, tooShortWords, duplicateWords } = analysis;

  if (parsed.words.length === 0) {
    return {
      ...analysis,
      error: 'Bitte mindestens ein Wort eingeben (ein Wort pro Zeile).',
    };
  }
  if (parsed.invalidWords.length > 0) {
    return {
      ...analysis,
      error: 'Ungültige Zeichen gefunden. Erlaubt sind nur Buchstaben (inkl. ÄÖÜẞ).',
    };
  }
  if (tooShortWords.length > 0) {
    return {
      ...analysis,
      error: `Jedes Wort muss mindestens ${MIN_WORTGEFLECHT_WORD_LENGTH} Buchstaben haben.`,
    };
  }
  if (duplicateWords.length > 0) {
    return {
      ...analysis,
      error: 'Doppelte Wörter sind nicht erlaubt.',
    };
  }
  if (parsed.totalLetters !== 48) {
    return {
      ...analysis,
      error: `Die Wörter müssen zusammen genau 48 Buchstaben ergeben (aktuell: ${parsed.totalLetters}).`,
    };
  }

  return {
    ...analysis,
    error: null,
  };
};
