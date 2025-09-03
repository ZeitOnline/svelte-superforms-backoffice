<script lang="ts">
  import { onMount } from 'svelte';
  import { CONFIG_GAMES } from '$config/games.config';
  import { debounce, highlightMatch } from '$utils';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import { getToastState } from '$lib/toast-state.svelte';

  let wordListNumber = $state<number>(4);
  let words = $state<string[]>([]);
  let allWords = $state<{ [key: number]: string[] }>({
    4: [],
    5: [],
    6: [],
    7: [],
  });
  let activeTab = $state<number>(4);
  let loading = $state<boolean>(false);
  let search = $state('');
  let debouncedSearch = $state('');

  // FOR POST
  let newWord = $state<string>('');
  let addBusy = $state<boolean>(false);
  let addError = $state<string>('');

  const toastManager = getToastState();

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

    const table = `${CONFIG_GAMES.wortiger.apiWordListEndpoint}_${number}`;
    const url = `${CONFIG_GAMES.wortiger.apiBase}/${table}`;

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
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // If duplicates are possible and the table has a unique constraint on "word",
          // you can optionally add:
          // 'Prefer': 'resolution=ignore-duplicates,return=minimal'
        },
        body: JSON.stringify({ word: normalized }),
      });

      if (!res.ok) {
        // rollback optimistic update
        words = prevWords;
        allWords = prevAll;

        const text = await res.text().catch(() => '');
        // If duplicate (409/425/5xx), surface a friendly message
        addError =
          res.status === 409
            ? 'Duplikat: Dieses Wort ist bereits vorhanden.'
            : `Fehler beim Hinzufügen (${res.status}).`;
        toastManager.add('Fehler beim Hinzufügen', text || addError);
        return;
      }

      newWord = '';
      toastManager.add('Wort hinzugefügt', '');
    } catch (e) {
      // rollback on network error
      words = prevWords;
      allWords = prevAll;
      addError = 'Netzwerkfehler beim Hinzufügen.';
      console.error(e);
      toastManager.add('Netzwerkfehler', String(e));
    } finally {
      addBusy = false;
    }
  };

  // Convert Proxy object to array and extract word strings
  const convertProxyToArray = (proxyObject: any): string[] => {
    if (!proxyObject) return [];

    // Convert proxy object to array by accessing numbered indices
    const wordsArray = [];
    let index = 0;

    while (proxyObject[index] !== undefined) {
      // Extract the word property from each object
      if (proxyObject[index]?.word) {
        wordsArray.push(proxyObject[index].word);
      }
      index++;
    }

    return wordsArray;
  };

  const fetchWordLists = async (number: number = 4) => {
    if (allWords[number].length > 0) {
      // Already loaded this word list
      words = allWords[number];
      return;
    }

    const URL = `${CONFIG_GAMES.wortiger.apiBase}/${CONFIG_GAMES.wortiger.apiWordListEndpoint}_${number}`;
    loading = true;

    try {
      const response = await fetch(URL);
      if (!response.ok) {
        throw new Error('Failed to fetch word lists');
      }

      const rawData = await response.json();

      const convertedWords = convertProxyToArray(rawData).sort((a, b) =>
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
    const table = `${CONFIG_GAMES.wortiger.apiWordListEndpoint}_${number}`;
    const url = `${CONFIG_GAMES.wortiger.apiBase}/${table}?word=eq.${encodeURIComponent(word)}`;

    // optimistic update
    const prevWords = words;
    const prevAll = { ...allWords };
    words = words.filter(w => w !== word);
    allWords[number] = allWords[number].filter(w => w !== word);

    loading = true;
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal',
        },
      });

      if (!res.ok) {
        words = prevWords;
        allWords = prevAll;
        const text = await res.text().catch(() => '');
        toastManager.add(`Failed to delete word`, `(${res.status}): ${text}`);
      } else {
        toastManager.add('Word deleted successfully', '');
      }
    } catch (err) {
      console.error('Error deleting word:', err);
      // state already restored above
      throw err;
    } finally {
      loading = false;
    }
  };

  const switchTab = async (tabNumber: number) => {
    activeTab = tabNumber;
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

    // German collation, case/diacritics-insensitive
    return filtered.slice().sort((a, b) => a.localeCompare(b, 'de-DE', { sensitivity: 'base' }));
  });

  /** Title-safe count for the summary line */
  const countText = $derived(`${visibleWords().length} Wörter mit ${activeTab} Buchstaben`);
</script>

<!-- Tab Navigation -->
<div class="tab-container">
  <nav class="tabs flex flex-col md:flex-row justify-center gap-3">
    {#each [4, 5, 6, 7] as tabNum (tabNum)}
      <button
        class="tab-button bg-gray-100 hover:bg-gray-300 px-3 py-1 border border-black cursor-pointer"
        class:!bg-gray-300={activeTab === tabNum}
        onclick={() => switchTab(tabNum)}
        disabled={loading}
      >
        {tabNum} Buchstaben
      </button>
    {/each}
  </nav>
</div>

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
          <div class="mr-auto">{@html highlightMatch(word, debouncedSearch)}</div>
          <button
            aria-label="Spiel bearbeiten"
            onclick={() => alert('coming soon')}
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
