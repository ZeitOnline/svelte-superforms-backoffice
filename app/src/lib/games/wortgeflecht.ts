import { CONFIG_GAMES } from '../../config/games.config';
import { buildQueryParams, pg, requestPostgrest } from '$lib/postgrest-client';

const normalizeStoredWord = (value: string) => value.trim().toLocaleLowerCase('de-DE');

const fetchWortgeflechtGameIdentityById = async (id: number) =>
  requestPostgrest<Array<{ id: number; game_id: string }>>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: CONFIG_GAMES.wortgeflecht.endpoints.games.name,
    query: buildQueryParams([
      ['id', pg.eq(id)],
      ['select', 'id,game_id'],
      ['limit', 1],
    ]),
    errorMessage: `Failed to fetch Wortgeflecht game identity for id: ${id}`,
  });

const deleteWortgeflechtGameById = async (id: number) =>
  requestPostgrest<unknown>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: CONFIG_GAMES.wortgeflecht.endpoints.games.name,
    method: 'DELETE',
    query: buildQueryParams([['id', pg.eq(id)]]),
    errorMessage: `Failed to delete Wortgeflecht game with id: ${id}`,
  });

const fetchGameWordsWithLetters = async (gameId: string) =>
  requestPostgrest<GameWordWithLetters[]>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: 'game_word',
    query: buildQueryParams([
      ['game_id', pg.eq(gameId)],
      ['select', 'id,word,game_letter(letter,cx,cy)'],
      ['order', pg.order('id', 'asc')],
    ]),
    errorMessage: 'Failed to fetch wortgeflecht letters',
  });

const fetchExistingWordIdsByGameId = async (gameId: string) =>
  requestPostgrest<Array<{ id: number }>>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: 'game_word',
    query: buildQueryParams([
      ['game_id', pg.eq(gameId)],
      ['select', 'id'],
    ]),
    errorMessage: 'Failed to fetch existing words',
  });

const deleteGameLettersByWordIds = async (wordIds: number[]) => {
  if (wordIds.length === 0) return;
  const ids = wordIds.join(',');
  await requestPostgrest<unknown>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: 'game_letter',
    method: 'DELETE',
    query: buildQueryParams([['word_id', `in.(${ids})`]]),
    errorMessage: 'Failed to delete old letters',
  });
};

const deleteGameWordsByGameId = async (gameId: string) =>
  requestPostgrest<unknown>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: 'game_word',
    method: 'DELETE',
    query: buildQueryParams([['game_id', pg.eq(gameId)]]),
    errorMessage: 'Failed to delete old words',
  });

const insertGameWords = async (wordsPayload: Array<{ game_id: string; word: string }>) =>
  requestPostgrest<Array<{ id: number; word: string }>, typeof wordsPayload>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: 'game_word',
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: wordsPayload,
    errorMessage: 'Failed to insert words',
  });

const insertGameLetters = async (
  lettersPayload: Array<{ word_id: number; letter: string; cx: number; cy: number }>,
) =>
  requestPostgrest<unknown, typeof lettersPayload>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: 'game_letter',
    method: 'POST',
    body: lettersPayload,
    errorMessage: 'Failed to insert letters',
  });

const dictionaryPath = CONFIG_GAMES.wortgeflecht.endpoints.wordList?.name ?? 'dictionary';

const parseTotalCount = (response: Response, fallback: number) => {
  const contentRange = response.headers.get('content-range');
  if (!contentRange) return fallback;

  const [, totalStr] = contentRange.split('/');
  const parsed = Number(totalStr);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const fetchWortgeflechtDictionary = async () =>
  requestPostgrest<Array<{ word: string }>>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: dictionaryPath,
    query: buildQueryParams([
      ['select', 'word'],
      ['order', pg.order('word', 'asc')],
    ]),
    errorMessage: 'Failed to fetch wortgeflecht dictionary',
  });

const insertWortgeflechtDictionaryWord = async (word: string) =>
  requestPostgrest<Array<{ word: string }>, { word: string }>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: dictionaryPath,
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: { word },
    errorMessage: 'Failed to insert wortgeflecht dictionary word',
  });

const updateWortgeflechtDictionaryWordRow = async ({
  oldWord,
  nextWord,
}: {
  oldWord: string;
  nextWord: string;
}) =>
  requestPostgrest<Array<{ word: string }>, { word: string }>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: dictionaryPath,
    method: 'PATCH',
    query: buildQueryParams([['word', pg.eq(oldWord)]]),
    headers: {
      Prefer: 'return=representation',
    },
    body: { word: nextWord },
    errorMessage: 'Failed to update wortgeflecht dictionary word',
  });

const deleteWortgeflechtDictionaryWordRow = async (word: string) =>
  requestPostgrest<unknown>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: dictionaryPath,
    method: 'DELETE',
    query: buildQueryParams([['word', pg.eq(word)]]),
    headers: {
      Prefer: 'return=minimal',
    },
    errorMessage: 'Failed to delete wortgeflecht dictionary word',
  });

const updateWortgeflechtGameById = async (
  id: number,
  data: { name: string; description: string; published_at: string; active: boolean },
) =>
  requestPostgrest<Array<{ id: number; game_id: string }>, typeof data>({
    url: baseUrl,
    method: 'PATCH',
    query: buildQueryParams([['id', pg.eq(id)]]),
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: 'Failed to update wortgeflecht game',
  });

const createWortgeflechtGame = async (data: {
  name: string;
  description: string;
  published_at: string;
  active: boolean;
}) =>
  requestPostgrest<Array<{ id: number; game_id: string }>, typeof data>({
    url: baseUrl,
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: 'Failed to create wortgeflecht game',
  });

export const deleteWortgeflechtGame = async (id: number) => {
  try {
    const { data: gameRows } = await fetchWortgeflechtGameIdentityById(id);
    const gameId = gameRows[0]?.game_id;

    if (gameId) {
      const { data: existingWords } = await fetchExistingWordIdsByGameId(gameId);
      await deleteGameLettersByWordIds(existingWords.map(word => word.id));
      await deleteGameWordsByGameId(gameId);
    }

    const { response } = await deleteWortgeflechtGameById(id);

    return response.statusText;
  } catch (error) {
    console.error('Error deleting Wortgeflecht game:', error);
    throw error;
  }
};

export type WortgeflechtLetterRow = {
  word: string;
  letter: string;
  cx: number;
  cy: number;
};

export const sortWortgeflechtRowsByWordThenLetter = (rows: WortgeflechtLetterRow[]) =>
  [...rows].sort((a, b) => {
    const byWord = a.word.localeCompare(b.word, 'de-DE', { sensitivity: 'base' });
    if (byWord !== 0) return byWord;
    const byLetter = a.letter.localeCompare(b.letter, 'de-DE', { sensitivity: 'base' });
    if (byLetter !== 0) return byLetter;
    if (a.cx !== b.cx) return a.cx - b.cx;
    return a.cy - b.cy;
  });

type GameWordWithLetters = {
  id: number;
  word: string;
  game_letter?: Array<{ letter: string; cx: number; cy: number }>;
};

const baseUrl = `${CONFIG_GAMES.wortgeflecht.apiBase}/${CONFIG_GAMES.wortgeflecht.endpoints.games.name}`;

export const fetchWortgeflechtLettersByGameId = async (gameId: string) => {
  const { data: words } = await fetchGameWordsWithLetters(gameId);
  const rows: WortgeflechtLetterRow[] = [];

  for (const wordEntry of words) {
    const letters = wordEntry.game_letter ?? [];
    for (const letterEntry of letters) {
      rows.push({
        word: wordEntry.word,
        letter: letterEntry.letter,
        cx: Number(letterEntry.cx),
        cy: Number(letterEntry.cy),
      });
    }
  }

  return sortWortgeflechtRowsByWordThenLetter(rows);
};

export const fetchWortgeflechtDictionaryWords = async () => {
  const { data } = await fetchWortgeflechtDictionary();

  return data
    .map(entry => entry.word)
    .filter((word): word is string => typeof word === 'string' && word.length > 0)
    .sort((a, b) => a.localeCompare(b, 'de-DE', { sensitivity: 'base' }));
};

export const fetchWortgeflechtDictionaryPage = async ({
  page = 1,
  pageSize = 50,
  search = '',
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}) => {
  const normalizedPage = Math.max(1, page);
  const normalizedPageSize = Math.max(1, pageSize);
  const trimmedSearch = search.trim();

  const { data, response } = await requestPostgrest<Array<{ word: string }>>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: dictionaryPath,
    query: buildQueryParams([
      ['select', 'word'],
      ['order', pg.order('word', 'asc')],
      ['limit', normalizedPageSize],
      ['offset', (normalizedPage - 1) * normalizedPageSize],
      ['word', trimmedSearch ? `ilike.*${trimmedSearch}*` : undefined],
    ]),
    headers: {
      Prefer: 'count=exact',
    },
    errorMessage: 'Failed to fetch paged wortgeflecht dictionary',
  });

  const words = data
    .map(entry => entry.word)
    .filter((word): word is string => typeof word === 'string' && word.length > 0);

  return {
    words,
    total: parseTotalCount(response, words.length),
  };
};

export const createWortgeflechtDictionaryWord = async (word: string) => {
  const normalized = normalizeStoredWord(word);
  const { data } = await insertWortgeflechtDictionaryWord(normalized);

  return data[0]?.word ?? normalized;
};

export const updateWortgeflechtDictionaryWord = async ({
  oldWord,
  nextWord,
}: {
  oldWord: string;
  nextWord: string;
}) => {
  const normalizedOldWord = normalizeStoredWord(oldWord);
  const normalizedNextWord = normalizeStoredWord(nextWord);
  const { data } = await updateWortgeflechtDictionaryWordRow({
    oldWord: normalizedOldWord,
    nextWord: normalizedNextWord,
  });

  return data[0]?.word ?? normalizedNextWord;
};

export const deleteWortgeflechtDictionaryWord = async (word: string) => {
  const normalized = normalizeStoredWord(word);
  await deleteWortgeflechtDictionaryWordRow(normalized);
};

export const replaceWortgeflechtLettersByGameId = async ({
  gameId,
  rows,
}: {
  gameId: string;
  rows: WortgeflechtLetterRow[];
}) => {
  const { data: existingWords } = await fetchExistingWordIdsByGameId(gameId);
  await deleteGameLettersByWordIds(existingWords.map(word => word.id));
  await deleteGameWordsByGameId(gameId);

  if (rows.length === 0) return;

  const uniqueWords = Array.from(new Set(rows.map(r => normalizeStoredWord(r.word))));
  const wordsPayload = uniqueWords.map(word => ({ game_id: gameId, word }));

  const { data: insertedWords } = await insertGameWords(wordsPayload);
  const wordIdByWord = new Map(insertedWords.map(w => [normalizeStoredWord(w.word), w.id]));

  const lettersPayload = rows.map(r => {
    const wordId = wordIdByWord.get(normalizeStoredWord(r.word));
    if (!wordId) {
      throw new Error(`Word id missing for "${r.word}"`);
    }
    return {
      word_id: wordId,
      letter: r.letter,
      cx: r.cx,
      cy: r.cy,
    };
  });

  await insertGameLetters(lettersPayload);
};

export const upsertWortgeflechtGame = async ({
  id,
  data,
}: {
  id?: number;
  data: { name: string; description: string; published_at: string; active: boolean };
}) => {
  if (id) {
    const { data: result } = await updateWortgeflechtGameById(id, data);
    return result[0];
  }

  const { data: result } = await createWortgeflechtGame(data);
  return result[0];
};
