export const SPELLING_BEE_TYPES = ['regular', 'mini'] as const;
export type SpellingBeeType = (typeof SPELLING_BEE_TYPES)[number];

export const SPELLING_BEE_TYPE_LABELS: Record<SpellingBeeType, string> = {
  regular: 'Normal',
  mini: 'Mini',
};

export const SPELLING_BEE_LETTER_COUNT: Record<SpellingBeeType, number> = {
  regular: 9,
  mini: 8,
};

export const SPELLING_BEE_MIN_SOLUTION_LENGTH = 3;

// Legacy `wordcloud` strings (and CSV imports) carry the center letter at this index.
const LEGACY_CENTRAL_INDEX = 4;

export const SPELLING_BEE_LETTERS_PATTERN = /^[A-ZÄÖÜ]+$/i;

export const getOtherLettersCount = (type: SpellingBeeType) => SPELLING_BEE_LETTER_COUNT[type] - 1;

export const isSpellingBeeType = (value: unknown): value is SpellingBeeType =>
  SPELLING_BEE_TYPES.includes(value as SpellingBeeType);

// Same layout the game frontends rebuild from central_letter/other_letters.
export const composeWordcloud = (centralLetter: string, otherLetters: string) =>
  otherLetters.slice(0, LEGACY_CENTRAL_INDEX) +
  centralLetter +
  otherLetters.slice(LEGACY_CENTRAL_INDEX);

export const splitWordcloud = (wordcloud: string) => ({
  centralLetter: wordcloud.charAt(LEGACY_CENTRAL_INDEX),
  otherLetters:
    wordcloud.slice(0, LEGACY_CENTRAL_INDEX) + wordcloud.slice(LEGACY_CENTRAL_INDEX + 1),
});

type SpellingBeeLetterSource = {
  wordcloud?: string | null;
  central_letter?: string | null;
  other_letters?: string | null;
  type?: string | null;
};

// Rows written before the DB migration may lack the explicit columns.
export const getSpellingBeeLetters = (game: SpellingBeeLetterSource) => {
  const wordcloud = (game.wordcloud ?? '').toUpperCase();
  const fallback = splitWordcloud(wordcloud);
  const centralLetter = (game.central_letter || fallback.centralLetter).toUpperCase();
  const otherLetters = (game.other_letters || fallback.otherLetters).toUpperCase();
  const type: SpellingBeeType = isSpellingBeeType(game.type)
    ? game.type
    : wordcloud.length === SPELLING_BEE_LETTER_COUNT.mini
      ? 'mini'
      : 'regular';

  return { type, centralLetter, otherLetters };
};

// Show the stored column: it's what the search RPC matches (the mini cronjob uses its own layout).
export const getDisplayWordcloud = (game: SpellingBeeLetterSource) => {
  if (game.wordcloud) return game.wordcloud.toUpperCase();
  const { centralLetter, otherLetters } = getSpellingBeeLetters(game);
  return composeWordcloud(centralLetter, otherLetters);
};

// Keep the stored wordcloud when the letters are unchanged, so edits don't rewrite its layout.
export const resolveWordcloud = (
  centralLetter: string,
  otherLetters: string,
  existing?: SpellingBeeLetterSource | null,
) => {
  if (existing?.wordcloud) {
    const current = getSpellingBeeLetters(existing);
    if (
      current.centralLetter === centralLetter.toUpperCase() &&
      current.otherLetters === otherLetters.toUpperCase()
    ) {
      return existing.wordcloud;
    }
  }
  return composeWordcloud(centralLetter, otherLetters);
};

// Order-independent key, so shuffled letter sets count as duplicates.
export const getLetterSetKey = (centralLetter: string, otherLetters: string) =>
  `${centralLetter.toUpperCase()}:${otherLetters.toUpperCase().split('').sort().join('')}`;

export const containsCentralLetter = (word: string, centralLetter: string) =>
  !!centralLetter && word.toUpperCase().includes(centralLetter.toUpperCase());

// Letters may repeat in a cloud (e.g. LIIIBMOME), so count each occurrence.
export const canBeBuiltFromLetters = (word: string, letters: string) => {
  const pool: Record<string, number> = {};
  for (const char of letters.toUpperCase()) {
    pool[char] = (pool[char] ?? 0) + 1;
  }

  for (const char of word.toUpperCase()) {
    if (!pool[char]) {
      return false;
    }
    pool[char] -= 1;
  }

  return true;
};

export type SpellingBeeSolutionIssue =
  'too_short' | 'too_long' | 'missing_central' | 'incompatible';

export const getSpellingBeeSolutionIssue = (
  word: string,
  {
    type,
    centralLetter,
    otherLetters,
  }: { type: SpellingBeeType; centralLetter: string; otherLetters: string },
): SpellingBeeSolutionIssue | null => {
  const normalized = word.trim().toUpperCase();
  if (normalized.length < SPELLING_BEE_MIN_SOLUTION_LENGTH) return 'too_short';
  if (normalized.length > SPELLING_BEE_LETTER_COUNT[type]) return 'too_long';
  if (!containsCentralLetter(normalized, centralLetter)) return 'missing_central';
  if (!canBeBuiltFromLetters(normalized, centralLetter + otherLetters)) return 'incompatible';
  return null;
};

export type SpellingBeeCsvError =
  | 'WORDCLOUD_INVALID'
  | 'WORDCLOUD_MISMATCH'
  | 'NO_SOLUTIONS'
  | 'SOLUTION_MISSING_CENTRAL'
  | 'SOLUTION_INCOMPATIBLE';

// CSV import only creates regular games; minis come from the mini-generator cronjob.
export const validateSpellingBeeCsvRows = (rows: string[][]): SpellingBeeCsvError | null => {
  const wordclouds = rows.map(row => (row[0] ?? '').trim().toUpperCase()).filter(Boolean);
  const [wordcloud] = wordclouds;

  if (
    !wordcloud ||
    wordcloud.length !== SPELLING_BEE_LETTER_COUNT.regular ||
    !SPELLING_BEE_LETTERS_PATTERN.test(wordcloud)
  ) {
    return 'WORDCLOUD_INVALID';
  }

  if (wordclouds.some(value => value !== wordcloud)) {
    return 'WORDCLOUD_MISMATCH';
  }

  const solutions = rows.map(row => (row[1] ?? '').trim()).filter(Boolean);
  if (solutions.length === 0) {
    return 'NO_SOLUTIONS';
  }

  const { centralLetter, otherLetters } = splitWordcloud(wordcloud);
  if (solutions.some(solution => !containsCentralLetter(solution, centralLetter))) {
    return 'SOLUTION_MISSING_CENTRAL';
  }

  if (solutions.some(solution => !canBeBuiltFromLetters(solution, centralLetter + otherLetters))) {
    return 'SOLUTION_INCOMPATIBLE';
  }

  return null;
};
