<script lang="ts">
  import { onMount } from 'svelte';
  import { CONFIG_GAMES } from '$config/games.config';
  import { debounce, highlightMatch } from '$utils';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import HighlightedText from '$components/HighlightedText.svelte';
  import { getToastState } from '$lib/toast-state.svelte';
  import { buildQueryParams, pg, PostgrestError, requestPostgrest } from '$lib/postgrest-client';
  import { toCSV } from './utils';
  import type { SortDirection } from '$types';
  import { WORTIGER_LENGTHS } from '$lib/games/wortiger';

  const DEFAULT_LENGTH = WORTIGER_LENGTHS[0] ?? 4;
  const EMPTY_WORDS = Object.fromEntries(WORTIGER_LENGTHS.map(len => [len, [] as string[]]));

  let wordListNumber = $state<number>(DEFAULT_LENGTH);
  let words = $state<string[]>([]);
  let allWords = $state<Record<number, string[]>>({ ...EMPTY_WORDS });
  let activeTab = $state<number>(DEFAULT_LENGTH);
  let loading = $state<boolean>(false);
  let search = $state('');
  let debouncedSearch = $state('');

  // FOR POST
  let newWord = $state<string>('');
  let addBusy = $state<boolean>(false);
  let addError = $state<string>('');

  const toastManager = getToastState();
  let sortDir = $state<SortDirection>('asc');

  const getPostgrestErrorDetails = (error: unknown): string => {
    if (error instanceof PostgrestError) {
      if (typeof error.details === 'string') return error.details;
      if (
        error.details &&
        typeof error.details === 'object' &&
        'message' in error.details &&
        typeof (error.details as { message?: unknown }).message === 'string'
      ) {
        return (error.details as { message: string }).message;
      }
    }
    if (error instanceof Error) return error.message;
    return String(error);
  };

  function setSort(dir: SortDirection) {
    sortDir = dir;
  }

  /**
   * Export current visible words as CSV with a Datum column.
   * Filename example: wortiger_4_2025-09-08.csv
   */
  function exportCurrentListAsCSV() {
    const rows: string[][] = [['Wort'], ...visibleWords().map(w => [w])];

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
    // Optional: allow only letters (incl. umlauts and ß). Remove if you support hyphens etc.
    if (!/^[A-Za-zÄÖÜäöüß]+$/.test(w)) return 'Nur Buchstaben sind erlaubt.';
    // prevent duplicates client-side
    if (allWords[activeTab]?.includes(w)) return 'Dieses Wort existiert bereits.';
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
    const normalized = word.trim();

    const err = validateWord(normalized, number);
    if (err) {
      addError = err;
      return;
    }

    const table = `${CONFIG_GAMES.wortiger.endpoints.wordList!.name}_${number}`;

    // optimistic update
    const prevWords = words;
    const prevAll = { ...allWords };
    words = [...words, normalized].sort((a, b) =>
      a.localeCompare(b, 'de-DE', { sensitivity: 'base' }),
    );
    allWords[number] = [...allWords[number], normalized].sort((a, b) =>
      a.localeCompare(b, 'de-DE', { sensitivity: 'base' }),
    );

    addBusy = true;
    try {
      await requestPostgrest<unknown, { word: string }>({
        baseUrl: CONFIG_GAMES.wortiger.apiBase,
        path: table,
        method: 'POST',
        body: { word: normalized },
      });

      newWord = '';
      toastManager.add('Wort hinzugefügt', '');
    } catch (e: unknown) {
      // rollback on network error
      words = prevWords;
      allWords = prevAll;
      if (e instanceof PostgrestError) {
        addError =
          e.status === 409 ? 'Duplikat: Dieses Wort ist bereits vorhanden.' : `Fehler beim Hinzufügen (${e.status}).`;
        toastManager.add('Fehler beim Hinzufügen', getPostgrestErrorDetails(e) || addError);
      } else {
        addError = 'Netzwerkfehler beim Hinzufügen.';
        console.error(e);
        toastManager.add('Netzwerkfehler', getPostgrestErrorDetails(e));
      }
    } finally {
      addBusy = false;
    }
  };

  /**
   * Add or update (rename) a word in the PostgREST word list.
   *
   * - Add: call with { oldWord: undefined } → POST (optionally as update)
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
    const next = nextWord.trim();

    const err = validateWord(next, number);
    if (err) {
      addError = err;
      return;
    }

    const table = `${CONFIG_GAMES.wortiger.endpoints.wordList!.name}_${number}`;

    // optimistic snapshot
    const prevWords = words;
    const prevAll = { ...allWords };

    // 🔁 Update (rename) branch
    if (opts?.oldWord) {
      const old = opts.oldWord;

      // client-side duplicate check (allow no-op rename)
      if (next !== old && allWords[number]?.includes(next)) {
        addError = 'Dieses Wort existiert bereits.';
        return;
      }

      // optimistic replace
      words = words
        .map(w => (w === old ? next : w))
        .sort((a, b) => a.localeCompare(b, 'de-DE', { sensitivity: 'base' }));
      allWords[number] = allWords[number]
        .map(w => (w === old ? next : w))
        .sort((a, b) => a.localeCompare(b, 'de-DE', { sensitivity: 'base' }));

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
        toastManager.add('Wort aktualisiert', `${old} → ${next}`);
      } catch (e: unknown) {
        words = prevWords;
        allWords = prevAll;
        if (e instanceof PostgrestError) {
          toastManager.add('Fehler beim Aktualisieren', getPostgrestErrorDetails(e) || `(${e.status})`);
          return;
        }
        addError = 'Netzwerkfehler beim Aktualisieren.';
        console.error(e);
        toastManager.add('Netzwerkfehler', getPostgrestErrorDetails(e));
      } finally {
        addBusy = false;
      }
      return;
    }
  };

  const fetchWordLists = async (number: number = 4) => {
    if (allWords[number].length > 0) {
      // Already loaded this word list
      words = allWords[number];
      return;
    }

    const table = `${CONFIG_GAMES.wortiger.endpoints.wordList!.name}_${number}`;
    loading = true;

    try {
      const { data } = await requestPostgrest<Array<{ word: string }>>({
        baseUrl: CONFIG_GAMES.wortiger.apiBase,
        path: table,
      });

      const convertedWords = data
        .map(item => item.word)
        .filter((item): item is string => typeof item === 'string' && item.length > 0)
        .sort((a, b) =>
          a.localeCompare(b, 'de-DE', { sensitivity: 'base' }),
        );

      allWords[number] = convertedWords;
      words = convertedWords;
    } catch (error) {
      console.error('Error fetching words:', error);
      words = [];
    } finally {
      loading = false;
    }
  };

  const deleteWord = async (number: number, word: string): Promise<void> => {
    const table = `${CONFIG_GAMES.wortiger.endpoints.wordList!.name}_${number}`;

    // optimistic update
    const prevWords = words;
    const prevAll = { ...allWords };
    words = words.filter(w => w !== word);
    allWords[number] = allWords[number].filter(w => w !== word);

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
      toastManager.add('Word deleted successfully', '');
    } catch (err: unknown) {
      words = prevWords;
      allWords = prevAll;
      console.error('Error deleting word:', err);
      if (err instanceof PostgrestError) {
        toastManager.add(`Failed to delete word`, `(${err.status}): ${getPostgrestErrorDetails(err)}`);
      } else {
        toastManager.add(`Failed to delete word`, getPostgrestErrorDetails(err));
      }
    } finally {
      loading = false;
    }
  };

  const switchTab = async (tabNumber: number) => {
    activeTab = tabNumber;
    sortDir = 'asc';
    await fetchWordLists(tabNumber);
  };

  /** Debounced writer for `debouncedSearch` to keep filtering light while typing */
  const applyDebouncedSearch = debounce((val: string) => {
    debouncedSearch = val.trim();
  }, 350);

  // React to raw `search` changes and update the debounced term
  $effect(() => {
    applyDebouncedSearch(search);
  });

  onMount(() => {
    fetchWordLists(wordListNumber);
  });

  const visibleWords = $derived(() => {
    const term = debouncedSearch.toLocaleLowerCase('de-DE');
    const base = words;
    const filtered = term ? base.filter(w => w.toLocaleLowerCase('de-DE').includes(term)) : base;

    const collator = new Intl.Collator('de-DE', { sensitivity: 'base' });

    if (sortDir === 'asc') {
      return filtered.slice().sort((a, b) => collator.compare(a, b));
    } else {
      return filtered.slice().sort((a, b) => collator.compare(b, a));
    }
  });

  /** Title-safe count for the summary line */
  const countText = $derived(`${visibleWords().length} Wörter mit ${activeTab} Buchstaben`);
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
      disabled={visibleWords().length === 0}
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
      onsubmit={() => addWord(activeTab, newWord)}
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
{#if visibleWords().length === 0}
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
    <div class="text-right my-4 font-bold">{countText}</div>
    <div id="wortiger-grid" class="word-grid grid grid-cols-2 md:grid-cols-4 gap-2">
      {#each visibleWords() as word, i (i)}
        <div class="word-item border border-black px-2 py-1 bg-gray-50 flex">
          <div class="mr-auto"><HighlightedText segments={highlightMatch(word, debouncedSearch)} /></div>
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
  </div>
{:else}
  <div class="loading">
    <p>Lade Wörter...</p>
  </div>
{/if}
