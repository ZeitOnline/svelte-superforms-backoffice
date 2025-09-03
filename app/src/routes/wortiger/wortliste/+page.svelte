<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { CONFIG_GAMES } from '$config/games.config';
  import { debounce, highlightMatch } from '$utils';
  import Header from '$components/Header.svelte';
  import ViewNavigation from '$components/ViewNavigation.svelte';
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import IconHandler from '$components/icons/IconHandler.svelte';

  const handleBackToDashboard = () => {
    goto('/wortiger');
  };

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

      const convertedWords = convertProxyToArray(rawData);

      allWords[number] = convertedWords;
      words = convertedWords;
    } catch (error) {
      console.error('Error fetching words:', error);
      words = [];
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

  /**
   * Visible list after applying the debounced search term.
   * Kept pure and cheap, recalculates when `words` or `debouncedSearch` change.
   */
  const filteredWords = $derived(() => {
    const term = debouncedSearch.toLowerCase();
    if (!term) return words;
    // includes() is fine for general substring search; switch to prefix-only if desired
    return words.filter(w => w.toLowerCase().includes(term));
  });

  /** Title-safe count for the summary line */
  const countText = $derived(`${filteredWords().length} Wörter mit ${activeTab} Buchstaben`);
</script>

<Header gameName="wortiger" />

<ViewWrapper>
  <ViewNavigation
    viewName="Wortliste anschauen"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="wortiger"
  />

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

  <!-- Search input -->
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
    {debouncedSearch ? `Gefiltert nach „${debouncedSearch}“` : ''}
  </div>

  <!-- Word List -->
  {#if filteredWords().length === 0}
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
        {#each filteredWords() as word, i (i)}
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
              onclick={() => alert('coming soon')}
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
</ViewWrapper>
