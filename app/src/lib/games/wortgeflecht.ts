import { CONFIG_GAMES } from '../../config/games.config';
import { buildQueryParams, pg, requestPostgrest } from '$lib/postgrest-client';

export const deleteWortgeflechtGame = async (id: number) => {
  try {
    const { response } = await requestPostgrest<unknown>({
      baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
      path: CONFIG_GAMES.wortgeflecht.endpoints.games.name,
      method: 'DELETE',
      query: buildQueryParams([['id', pg.eq(id)]]),
      errorMessage: `Failed to delete Wortgeflecht game with id: ${id}`,
    });

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
  const { data: words } = await requestPostgrest<GameWordWithLetters[]>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: 'game_word',
    query: buildQueryParams([
      ['game_id', pg.eq(gameId)],
      ['select', 'id,word,game_letter(letter,cx,cy)'],
      ['order', pg.order('id', 'asc')],
    ]),
    errorMessage: 'Failed to fetch wortgeflecht letters',
  });
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

export const replaceWortgeflechtLettersByGameId = async ({
  gameId,
  rows,
}: {
  gameId: string;
  rows: WortgeflechtLetterRow[];
}) => {
  const { data: existingWords } = await requestPostgrest<Array<{ id: number }>>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: 'game_word',
    query: buildQueryParams([
      ['game_id', pg.eq(gameId)],
      ['select', 'id'],
    ]),
    errorMessage: 'Failed to fetch existing words',
  });
  const existingWordIds = existingWords.map(w => w.id);

  if (existingWordIds.length > 0) {
    const ids = existingWordIds.join(',');
    await requestPostgrest<unknown>({
      baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
      path: 'game_letter',
      method: 'DELETE',
      query: buildQueryParams([['word_id', `in.(${ids})`]]),
      errorMessage: 'Failed to delete old letters',
    });
  }

  await requestPostgrest<unknown>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: 'game_word',
    method: 'DELETE',
    query: buildQueryParams([['game_id', pg.eq(gameId)]]),
    errorMessage: 'Failed to delete old words',
  });

  if (rows.length === 0) return;

  const uniqueWords = Array.from(new Set(rows.map(r => r.word.trim())));
  const wordsPayload = uniqueWords.map(word => ({ game_id: gameId, word }));

  const { data: insertedWords } = await requestPostgrest<Array<{ id: number; word: string }>, typeof wordsPayload>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: 'game_word',
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: wordsPayload,
    errorMessage: 'Failed to insert words',
  });
  const wordIdByWord = new Map(insertedWords.map(w => [w.word, w.id]));

  const lettersPayload = rows.map(r => {
    const wordId = wordIdByWord.get(r.word.trim());
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

  await requestPostgrest<unknown, typeof lettersPayload>({
    baseUrl: CONFIG_GAMES.wortgeflecht.apiBase,
    path: 'game_letter',
    method: 'POST',
    body: lettersPayload,
    errorMessage: 'Failed to insert letters',
  });
};

export const upsertWortgeflechtGame = async ({
  id,
  data,
}: {
  id?: number;
  data: { name: string; published_at: string; active: boolean };
}) => {
  if (id) {
    const { data: result } = await requestPostgrest<Array<{ id: number; game_id: string }>, typeof data>({
      url: baseUrl,
      method: 'PATCH',
      query: buildQueryParams([['id', pg.eq(id)]]),
      headers: {
        Prefer: 'return=representation',
      },
      body: data,
      errorMessage: 'Failed to update wortgeflecht game',
    });
    return result[0];
  }

  const { data: result } = await requestPostgrest<Array<{ id: number; game_id: string }>, typeof data>({
    url: baseUrl,
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: data,
    errorMessage: 'Failed to create wortgeflecht game',
  });
  return result[0];
};
