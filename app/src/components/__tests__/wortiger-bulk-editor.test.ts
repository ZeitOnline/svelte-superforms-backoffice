import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WortigerBulkEditor from '#components/games/wortiger/WortigerBulkEditor.svelte';

const WORD_LISTS: Record<string, string[]> = {
  wortliste_4: ['coup'],
  wortliste_5: ['küste'],
  wortliste_6: ['vetter'],
  wortliste_7: ['thermik'],
};

const makeJsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });

// Word lists answer after the first render, like in production.
const createFetchMock = (failingList?: string) =>
  vi.fn<typeof fetch>(async input => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const table = new URL(String(input), 'http://localhost').pathname.split('/').pop() ?? '';
    if (table === failingList) return makeJsonResponse({ message: 'boom' }, 500);
    return makeJsonResponse((WORD_LISTS[table] ?? []).map(word => ({ word })));
  });

const renderEditor = () =>
  render(WortigerBulkEditor, {
    data: { games: [], gameType: 'wortiger' } as never,
    resultsDataBody: [['2026-11-01', 'coup', 'küste', 'vetter', 'thermik']],
    beginning_option: 'csv',
  });

const notLoadedMessages = () => screen.queryAllByText(/ist noch nicht geladen/);

describe('WortigerBulkEditor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('re-validates cells once the word lists have loaded', async () => {
    vi.stubGlobal('fetch', createFetchMock());

    renderEditor();

    expect(notLoadedMessages()).toHaveLength(4);
    await waitFor(() => expect(notLoadedMessages()).toHaveLength(0));
    expect(screen.queryByText(/ist nicht in der/)).not.toBeInTheDocument();
  });

  it('re-validates a cell when its value is edited', async () => {
    vi.stubGlobal('fetch', createFetchMock());

    renderEditor();
    await waitFor(() => expect(notLoadedMessages()).toHaveLength(0));

    await fireEvent.input(screen.getByLabelText('Level 4 Lösung'), { target: { value: 'quux' } });

    expect(await screen.findByText(/„quux“ ist nicht in der 4-Buchstaben-Wortliste/)).toBeVisible();
  });

  it('shows an error when a word list cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', createFetchMock('wortliste_7'));

    renderEditor();

    expect(await screen.findByText('Wortlisten konnten nicht geladen werden: boom')).toBeVisible();
  });
});
