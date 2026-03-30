<script lang="ts">
  import { CONFIG_GAMES } from '$config/games.config';
  import { TablePagination } from '$components/table';
  import { debounce, highlightMatch } from '$utils';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import HighlightedText from '$components/HighlightedText.svelte';
  import { getToastState } from '$lib/toast-state.svelte';
  import {
    buildQueryParams,
    getPostgrestErrorMessage,
    pg,
    PostgrestError,
    requestPostgrest,
  } from '$lib/postgrest-client';
  import { toCSV } from './utils';
  import type { SortDirection } from '$types';
  import { WORTIGER_LENGTHS } from '$lib/games/wortiger';

  const DEFAULT_LENGTH = WORTIGER_LENGTHS[0] ?? 4;
  const PAGE_SIZE = 50;
  const EXPORT_PAGE_SIZE = 1000;

  let words = $state<string[]>([]);
  let activeTab = $state<number>(DEFAULT_LENGTH);
  let loading = $state<boolean>(false);
  let search = $state('');
  let debouncedSearch = $state('');
  let currentPage = $state<number>(1);
  let totalPages = $state<number>(1);
  let totalWords = $state<number>(0);
  let hasLoaded = $state<boolean>(false);
  let lastLoadedCriteria = '';
  let lastRequestId = 0;

  // FOR POST
  let newWord = $state<string>('');
  let addBusy = $state<boolean>(false);
  let addError = $state<string>('');

  const toastManager = getToastState();
  let sortDir = $state<SortDirection>('asc');

  function setSort(dir: SortDirection) {
    if (sortDir === dir) return;
    sortDir = dir;
  }

  function getWordTable(length: number) {
    return `${CONFIG_GAMES.wortiger.endpoints.wordList!.name}_${length}`;
  }

  function getWordReadTable(length: number) {
    return `${CONFIG_GAMES.wortiger.endpoints.wordList!.name}_read_${length}`;
  }

  function getWordOrder(direction: SortDirection) {
    return direction === 'asc' ? 'sort_key.asc,word.asc' : 'sort_key.desc,word.desc';
  }

  function parseTotalCount(response: Response, fallback: number) {
    const contentRange = response.headers.get('content-range');
    if (!contentRange) return fallback;

    const [, totalStr] = contentRange.split('/');
    const parsed = Number(totalStr);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeWords(data: Array<{ word: string }>) {
    return data
      .map(item => item.word)
      .filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  function getCountText() {
    if (debouncedSearch) {
      return `${totalWords} Treffer in der ${activeTab}-Buchstaben-Liste`;
    }

    const start = totalWords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const end = totalWords === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalWords);

    return `${start}-${end} von ${totalWords} Wörtern mit ${activeTab} Buchstaben`;
  }

  async function fetchWordPage({
    number = activeTab,
    page = currentPage,
    term = debouncedSearch,
    direction = sortDir,
  }: {
    number?: number;
    page?: number;
    term?: string;
    direction?: SortDirection;
  } = {}) {
    const requestId = ++lastRequestId;
    const normalizedPage = Math.max(1, page);
    const trimmedTerm = term.trim();
    const table = getWordReadTable(number);

    loading = true;

    try {
      const { data, response } = await requestPostgrest<Array<{ word: string }>>({
        baseUrl: CONFIG_GAMES.wortiger.apiBase,
        path: table,
        query: buildQueryParams([
          ['select', 'word'],
          ['order', getWordOrder(direction)],
          ['limit', PAGE_SIZE],
          ['offset', (normalizedPage - 1) * PAGE_SIZE],
          ['word', trimmedTerm ? `ilike.*${trimmedTerm}*` : undefined],
        ]),
        headers: {
          Prefer: 'count=exact',
        },
      });

      if (requestId !== lastRequestId) return;

      const nextWords = normalizeWords(data);
      const nextTotal = parseTotalCount(response, nextWords.length);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      const nextPage = Math.min(normalizedPage, nextTotalPages);

      totalWords = nextTotal;
      totalPages = nextTotalPages;

      if (nextPage !== normalizedPage) {
        currentPage = nextPage;
        return;
      }

      words = nextWords;
    } catch (error) {
      if (requestId !== lastRequestId) return;

      console.error('Error fetching words:', error);
      words = [];
      totalWords = 0;
      totalPages = 1;
      toastManager.add('Fehler beim Laden', getPostgrestErrorMessage(error));
    } finally {
      if (requestId === lastRequestId) {
        hasLoaded = true;
        loading = false;
      }
    }
  }

  async function fetchAllWordsForExport({
    number = activeTab,
    term = debouncedSearch,
    direction = sortDir,
  }: {
    number?: number;
    term?: string;
    direction?: SortDirection;
  } = {}) {
    const trimmedTerm = term.trim();
    const table = getWordReadTable(number);
    const rows: string[] = [];
    let offset = 0;

    while (true) {
      const { data, response } = await requestPostgrest<Array<{ word: string }>>({
        baseUrl: CONFIG_GAMES.wortiger.apiBase,
        path: table,
        query: buildQueryParams([
          ['select', 'word'],
          ['order', getWordOrder(direction)],
          ['limit', EXPORT_PAGE_SIZE],
          ['offset', offset],
          ['word', trimmedTerm ? `ilike.*${trimmedTerm}*` : undefined],
        ]),
        headers: {
          Prefer: 'count=exact',
        },
      });

      rows.push(...normalizeWords(data));
      const total = parseTotalCount(response, rows.length);
      if (rows.length >= total) break;
      offset += EXPORT_PAGE_SIZE;
    }

    return rows;
  }

  /**
   * Export the full filtered list as CSV.
   * Filename example: wortiger_4_2025-09-08.csv
   */
  async function exportCurrentListAsCSV() {
    const exportWords = await fetchAllWordsForExport();
    const rows: string[][] = [['Wort'], ...exportWords.map(w => [w])];

    // Prepend BOM for Excel & Umlauts
    const csv = '\uFEFF' + toCSV(rows, ';');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `wortiger_${activeTab}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

  /**
   * Validate a candidate word against the current `activeTab`.
   *
   * @param word - Proposed word
   * @param expectedLen - Expected length from the active tab (4,5,6,7)
   * @returns An error message string if invalid, otherwise empty string
   */
  function validateWord(word: string, expectedLen: number): string {
    const w = word.trim();
    if (!w) return 'Bitte ein Wort eingeben.';
    if (w.length !== expectedLen) return `Das Wort muss genau ${expectedLen} Zeichen haben.`;
    if (!/^[A-Za-zÄÖÜäöüß]+$/.test(w)) return 'Nur Buchstaben sind erlaubt.';
    return '';
  }

  /**
   * Ask the user for a new value and PATCH if confirmed.
   */
  const requestRename = async (current: string) => {
    const proposal = prompt(`Neues Wort für „${current}“ eingeben:`, current);
    if (proposal == null) return; // user canceled prompt
    const next = proposal.trim();
    if (!next || next === current) return;

    const ok = confirm(`Wirklich umbenennen?\n\n${current} → ${next}`);
    if (!ok) return;

    await updateWord(activeTab, next, { oldWord: current });
  };

  /**
   * POST a new word to PostgREST and update local state.
   *
   * @param number - Word length bucket -> table `wortliste_${number}`
   * @param word   - Word to insert (exact value sent to DB)
   */
  const addWord = async (number: number, word: string): Promise<void> => {
    addError = '';

    // 👉 choose your normalization policy:
    // For German, you might want to keep original casing;
    // If you prefer uppercase storage, uncomment next line:
    // const normalized = word.trim().toLocaleUpperCase('de-DE');
    const normalized = word.trim().toLocaleLowerCase('de-DE');

    const err = validateWord(normalized, number);
    if (err) {
      addError = err;
      return;
    }

    const table = getWordTable(number);

    addBusy = true;
    try {
      await requestPostgrest<unknown, { word: string }>({
        baseUrl: CONFIG_GAMES.wortiger.apiBase,
        path: table,
        method: 'POST',
        body: { word: normalized },
      });

      newWord = '';
      await fetchWordPage({ number, page: currentPage });
      toastManager.add('Wort hinzugefügt', '');
    } catch (e: unknown) {
      if (e instanceof PostgrestError) {
        addError =
          e.status === 409
            ? 'Duplikat: Dieses Wort ist bereits vorhanden.'
            : `Fehler beim Hinzufügen (${e.status}).`;
        toastManager.add('Fehler beim Hinzufügen', getPostgrestErrorMessage(e) || addError);
      } else {
        addError = 'Netzwerkfehler beim Hinzufügen.';
        console.error(e);
        toastManager.add('Netzwerkfehler', getPostgrestErrorMessage(e));
      }
    } finally {
      addBusy = false;
    }
  };

  /**
   * Add or update (rename) a word in the PostgREST word list.
   *
   * - Add: call without { oldWord } → delegates to `addWord` (POST)
   * - Update: call with { oldWord } → PATCH /?word=eq.{oldWord}
   *
   * @param number   Word length bucket (4|5|6|7) -> table `wortliste_${number}`
   * @param nextWord New word value
   * @param opts     Optional: { oldWord } if renaming an existing entry
   */
  const updateWord = async (
    number: number,
    nextWord: string,
    opts?: { oldWord?: string },
  ): Promise<void> => {
    addError = '';

    // normalize per your policy; keeping user casing:
    const next = nextWord.trim().toLocaleLowerCase('de-DE');

    const err = validateWord(next, number);
    if (err) {
      addError = err;
      return;
    }

    const table = getWordTable(number);

    // 🔁 Update (rename) branch
    if (opts?.oldWord) {
      const old = opts.oldWord.trim().toLocaleLowerCase('de-DE');
      if (next === old) return;

      addBusy = true;
      try {
        await requestPostgrest<unknown, { word: string }>({
          baseUrl: CONFIG_GAMES.wortiger.apiBase,
          path: table,
          method: 'PATCH',
          query: buildQueryParams([['word', pg.eq(old)]]),
          headers: {
            Prefer: 'return=minimal',
          },
          body: { word: next },
        });

        newWord = '';
        await fetchWordPage({ number, page: currentPage });
        toastManager.add('Wort aktualisiert', `${old} → ${next}`);
      } catch (e: unknown) {
        if (e instanceof PostgrestError) {
          addError =
            e.status === 409
              ? 'Duplikat: Dieses Wort ist bereits vorhanden.'
              : `Fehler beim Aktualisieren (${e.status}).`;
          toastManager.add(
            'Fehler beim Aktualisieren',
            getPostgrestErrorMessage(e) || `(${e.status})`,
          );
          return;
        }
        addError = 'Netzwerkfehler beim Aktualisieren.';
        console.error(e);
        toastManager.add('Netzwerkfehler', getPostgrestErrorMessage(e));
      } finally {
        addBusy = false;
      }
      return;
    }

    // Add branch: avoid silent no-op when called without oldWord.
    await addWord(number, next);
  };

  const deleteWord = async (number: number, word: string): Promise<void> => {
    const table = getWordTable(number);

    loading = true;
    try {
      await requestPostgrest<unknown>({
        baseUrl: CONFIG_GAMES.wortiger.apiBase,
        path: table,
        method: 'DELETE',
        query: buildQueryParams([['word', pg.eq(word)]]),
        headers: {
          Prefer: 'return=minimal',
        },
      });
      await fetchWordPage({ number, page: currentPage });
      toastManager.add('Wort gelöscht', '');
    } catch (err: unknown) {
      console.error('Error deleting word:', err);
      if (err instanceof PostgrestError) {
        toastManager.add(
          'Fehler beim Löschen',
          `(${err.status}): ${getPostgrestErrorMessage(err)}`,
        );
      } else {
        toastManager.add('Fehler beim Löschen', getPostgrestErrorMessage(err));
      }
    } finally {
      loading = false;
    }
  };

  const switchTab = (tabNumber: number) => {
    if (activeTab === tabNumber) return;
    activeTab = tabNumber;
    sortDir = 'asc';
  };

  /** Debounced writer for `debouncedSearch` to keep filtering light while typing */
  const applyDebouncedSearch = debounce((val: string) => {
    debouncedSearch = val.trim();
  }, 350);

  // React to raw `search` changes and update the debounced term
  $effect(() => {
    applyDebouncedSearch(search);
  });

  $effect(() => {
    const criteria = `${activeTab}:${sortDir}:${debouncedSearch}`;

    if (criteria !== lastLoadedCriteria && currentPage !== 1) {
      currentPage = 1;
      return;
    }

    lastLoadedCriteria = criteria;
    fetchWordPage({
      number: activeTab,
      page: currentPage,
      term: debouncedSearch,
      direction: sortDir,
    });
  });
</script>

<!-- Tab Navigation -->
<div class="tab-container">
  <nav class="tabs flex flex-col md:flex-row justify-center gap-3">
    {#each WORTIGER_LENGTHS as tabNum (tabNum)}
      <button
        class="tab-button bg-gray-100 hover:bg-gray-300 text-xs px-3 py-1 border border-black cursor-pointer"
        class:!bg-gray-300={activeTab === tabNum}
        onclick={() => switchTab(tabNum)}
        disabled={loading}
      >
        {tabNum} Buchstaben
      </button>
    {/each}
    <!-- Export button -->
    <button
      type="button"
      class="z-ds-button whitespace-nowrap ml-auto w-full md:w-fit"
      onclick={exportCurrentListAsCSV}
      disabled={totalWords === 0}
      aria-label="Aktuelle Wortliste als CSV exportieren"
      title="Aktuelle Wortliste als CSV exportieren"
    >
      <IconHandler iconName="download" extraClasses="w-4 h-4 inline-block" />
      CSV
    </button>
  </nav>
</div>

<fieldset class="ml-auto mt-4">
  <legend class="text-sm font-semibold mb-2">Sorting</legend>

  <div class="flex gap-2 justify-start" role="tablist" aria-label="Sortierung">
    <button
      type="button"
      role="tab"
      aria-selected={sortDir === 'asc'}
      aria-controls="wortiger-grid"
      class="bg-gray-100 hover:bg-gray-300 text-xs px-3 py-1 border border-black rounded cursor-pointer"
      class:!bg-gray-300={sortDir === 'asc'}
      onclick={() => setSort('asc')}
      aria-label="Sortieren von A bis Z"
    >
      A-Z
    </button>

    <button
      type="button"
      role="tab"
      aria-selected={sortDir === 'desc'}
      aria-controls="wortiger-grid"
      class="bg-gray-100 hover:bg-gray-300 text-xs px-3 py-1 border border-black rounded cursor-pointer"
      class:!bg-gray-300={sortDir === 'desc'}
      onclick={() => setSort('desc')}
      aria-label="Sortieren von Z bis A"
    >
      Z-A
    </button>
  </div>
</fieldset>

<div class="flex flex-col md:flex-row my-6 w-full justify-between items-center gap-4">
  <!-- New Word Form  -->
  <div class="flex flex-col w-full gap-2">
    <form
      class="flex items-end gap-2 w-full"
      onsubmit={event => {
        event.preventDefault();
        addWord(activeTab, newWord);
      }}
      aria-describedby="add-word-help add-word-error"
    >
      <div class="flex flex-col gap-2 w-full">
        <label for="add-word" class="text-sm font-bold">Wort hinzufügen</label>
        <input
          id="add-word"
          type="text"
          class="border border-black px-2 py-1 text-xs w-full"
          bind:value={newWord}
          minlength={activeTab}
          maxlength={activeTab}
          pattern="[A-Za-zÄÖÜäöüß]+"
          placeholder={`${activeTab} Zeichen`}
          autocomplete="off"
          spellcheck="false"
          aria-invalid={!!addError}
          aria-describedby="add-word-help add-word-error"
          oninput={() => {
            if (addError) {
              addError = '';
            }
          }}
        />
      </div>

      <button
        type="submit"
        class="z-ds-button"
        disabled={addBusy || !newWord.trim()}
        aria-live="polite"
      >
        Hinzufügen
      </button>
    </form>
    {#if addError}
      <span id="add-word-error" class="text-sm text-red-700" aria-live="assertive">
        {addError}
      </span>
    {:else}
      <span id="add-word-help" class="text-sm text-gray-600 italic">
        Ein Wort mit genau {activeTab} Buchstaben eingeben.
      </span>
    {/if}
  </div>

  <!-- Search Input -->
  <div class="w-full">
    <div class="my-4 flex items-center justify-between gap-3">
      <label class="sr-only" for="wortiger-search">Nach Wörtern suchen</label>
      <input
        id="wortiger-search"
        type="search"
        placeholder="Suchen…"
        class="w-full max-w-md border-b border-b-black px-3 py-2 bg-white ml-auto"
        bind:value={search}
        aria-controls="wortiger-grid"
        autocomplete="off"
        spellcheck="false"
        enterkeyhint="search"
      />
    </div>

    <!-- live search status for SR users -->
    <div class="text-sm ml-auto w-full text-right" aria-live="polite">
      {debouncedSearch ? `Gefiltert nach „${debouncedSearch}“` : 'Alle Wörter'}
    </div>
  </div>
</div>

<!-- Word List -->
{#if loading && !hasLoaded}
  <div class="loading">
    <p>Lade Wörter...</p>
  </div>
{:else if words.length === 0}
  <div class="no-words" role="status" aria-live="polite">
    <p>
      {#if debouncedSearch}
        Keine Treffer für „{debouncedSearch}“ in {activeTab}-Buchstaben-Liste.
      {:else}
        Keine Wörter für {activeTab} Buchstaben gefunden.
      {/if}
    </p>
  </div>
{:else if !loading}
  <div class="word-list-container">
    <div class="text-right my-4 font-bold">{getCountText()}</div>
    <div id="wortiger-grid" class="word-grid grid grid-cols-2 md:grid-cols-4 gap-2">
      {#each words as word, i (i)}
        <div class="word-item border border-black px-2 py-1 bg-gray-50 flex">
          <div class="mr-auto">
            <HighlightedText segments={highlightMatch(word, debouncedSearch)} />
          </div>
          <button
            aria-label="Spiel bearbeiten"
            onclick={() => requestRename(word)}
            class="z-ds-button z-ds-button-outline"
          >
            <IconHandler iconName="update" />
          </button>
          <button
            aria-label="Spiel löschen"
            onclick={() => {
              if (confirm(`Willst du das Wort <<<${word}>>> wirklich löschen?`)) {
                deleteWord(activeTab, word);
              }
            }}
            class="z-ds-button"
          >
            <IconHandler iconName="delete" extraClasses="w-5 h-5" />
          </button>
        </div>
      {/each}
    </div>
    <TablePagination bind:currentPage {totalPages} />
  </div>
{:else}
  <div class="loading">
    <p>Lade Wörter...</p>
  </div>
{/if}
