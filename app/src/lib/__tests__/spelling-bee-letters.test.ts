import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canBeBuiltFromLetters,
  composeWordcloud,
  getLetterSetKey,
  getSpellingBeeLetters,
  getSpellingBeeSolutionIssue,
  splitWordcloud,
  validateSpellingBeeCsvRows,
} from '$lib/games/spelling-bee-letters';
import { saveSpellingBeeGameFormSchema } from '$schemas/spelling-bee';
import { getNextAvailableDateForGame } from '$lib/queries';

const regular = { type: 'regular' as const, centralLetter: 'K', otherLetters: 'PULSURTE' };
const mini = { type: 'mini' as const, centralLetter: 'K', otherLetters: 'PULSURT' };

describe('spelling-bee letters', () => {
  it('round-trips wordclouds with repeated letters', () => {
    const split = splitWordcloud('LIIIBMOME');
    expect(split).toEqual({ centralLetter: 'B', otherLetters: 'LIIIMOME' });
    expect(composeWordcloud(split.centralLetter, split.otherLetters)).toBe('LIIIBMOME');
  });

  it('composes mini wordclouds like the game frontend', () => {
    expect(composeWordcloud('K', 'PULSURT')).toBe('PULSKURT');
  });

  it('prefers explicit columns and falls back to the legacy wordcloud', () => {
    expect(
      getSpellingBeeLetters({
        wordcloud: 'PULKSURT',
        central_letter: 'k',
        other_letters: 'pulsurt',
        type: 'mini',
      }),
    ).toEqual({ type: 'mini', centralLetter: 'K', otherLetters: 'PULSURT' });

    expect(getSpellingBeeLetters({ wordcloud: 'pulskurte' })).toEqual({
      type: 'regular',
      centralLetter: 'K',
      otherLetters: 'PULSURTE',
    });
  });

  it('treats shuffled letter sets as equal', () => {
    expect(getLetterSetKey('K', 'PULSURTE')).toBe(getLetterSetKey('k', 'ETRUSLUP'));
    expect(getLetterSetKey('K', 'PULSURTE')).not.toBe(getLetterSetKey('P', 'KULSURTE'));
  });

  it('respects letter multiplicity', () => {
    expect(canBeBuiltFromLetters('KULTUR', 'KPULSURTE')).toBe(true);
    expect(canBeBuiltFromLetters('KUKLUR', 'KPULSURTE')).toBe(false);
  });

  it('reports solution issues per type', () => {
    expect(getSpellingBeeSolutionIssue('SKULPTEUR', regular)).toBeNull();
    expect(getSpellingBeeSolutionIssue('SKULPTEUR', mini)).toBe('too_long');
    expect(getSpellingBeeSolutionIssue('SKULPTUR', mini)).toBeNull();
    expect(getSpellingBeeSolutionIssue('LUST', regular)).toBe('missing_central');
    expect(getSpellingBeeSolutionIssue('KULTE', mini)).toBe('incompatible');
    expect(getSpellingBeeSolutionIssue('KU', regular)).toBe('too_short');
  });
});

describe('validateSpellingBeeCsvRows', () => {
  const row = (wordcloud: string, solution: string) => [wordcloud, solution, '', '', '', ''];

  it('accepts regular games whose solutions contain the 5th letter', () => {
    expect(
      validateSpellingBeeCsvRows([row('pulskurte', 'KULTUR'), row('pulskurte', 'SKULPTEUR')]),
    ).toBeNull();
  });

  it('rejects wordclouds that are not 9 letters', () => {
    expect(validateSpellingBeeCsvRows([row('pulskurt', 'KULTUR')])).toBe('WORDCLOUD_INVALID');
  });

  it('rejects mixed wordclouds', () => {
    expect(validateSpellingBeeCsvRows([row('pulskurte', 'KULTUR'), row('cettokbij', 'TOT')])).toBe(
      'WORDCLOUD_MISMATCH',
    );
  });

  it('rejects solutions without the center letter', () => {
    expect(validateSpellingBeeCsvRows([row('pulskurte', 'LUST')])).toBe('SOLUTION_MISSING_CENTRAL');
  });

  it('rejects solutions that overuse a letter', () => {
    expect(validateSpellingBeeCsvRows([row('pulskurte', 'KUKLUR')])).toBe('SOLUTION_INCOMPATIBLE');
  });

  it('rejects files without solutions', () => {
    expect(validateSpellingBeeCsvRows([row('pulskurte', '')])).toBe('NO_SOLUTIONS');
  });
});

describe('saveSpellingBeeGameFormSchema', () => {
  const base = { name: 'Buchstabiene Nr.1', start_time: '2026-10-01' };

  it('accepts a regular game and uppercases letters', () => {
    const result = saveSpellingBeeGameFormSchema.safeParse({
      ...base,
      type: 'regular',
      central_letter: 'k',
      other_letters: 'pulsurte',
      solutions: [{ solution: 'kultur', points: 6 }],
    });
    expect(result.success).toBe(true);
    expect(result.data?.central_letter).toBe('K');
    expect(result.data?.other_letters).toBe('PULSURTE');
  });

  it('requires 7 other letters for minis', () => {
    const result = saveSpellingBeeGameFormSchema.safeParse({
      ...base,
      type: 'mini',
      central_letter: 'K',
      other_letters: 'PULSURTE',
      solutions: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['other_letters']);
  });

  it('flags solutions without the center letter', () => {
    const result = saveSpellingBeeGameFormSchema.safeParse({
      ...base,
      type: 'mini',
      central_letter: 'K',
      other_letters: 'PULSURT',
      solutions: [{ solution: 'LUST', points: 3 }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['solutions', 0, 'solution']);
  });

  it('rejects a multi-character center letter', () => {
    const result = saveSpellingBeeGameFormSchema.safeParse({
      ...base,
      type: 'regular',
      central_letter: 'KP',
      other_letters: 'PULSURTE',
      solutions: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['central_letter']);
  });
});

describe('getNextAvailableDateForGame (spelling-bee)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ignores cronjob-scheduled mini games', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await getNextAvailableDateForGame('spelling-bee');

    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]), 'http://localhost');
    expect(calledUrl.searchParams.get('or')).toBe('(type.is.null,type.neq.mini)');
  });
});
