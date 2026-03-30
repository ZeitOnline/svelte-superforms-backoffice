<script lang="ts">
  import { TablePagination } from '$components/table';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import HighlightedText from '$components/HighlightedText.svelte';
  import { getToastState } from '$lib/toast-state.svelte';
  import {
    createWortgeflechtDictionaryWord,
    deleteWortgeflechtDictionaryWord,
    fetchWortgeflechtDictionaryPage,
    updateWortgeflechtDictionaryWord,
  } from '$lib/games/wortgeflecht';
  import {
    MIN_WORTGEFLECHT_WORD_LENGTH,
    normalizeWortgeflechtWordKey,
  } from '$lib/games/wortgeflecht-utils';
  import { getPostgrestErrorMessage, PostgrestError } from '$lib/postgrest-client';
  import { debounce, highlightMatch } from '$utils';

  const PAGE_SIZE = 50;
  const toastManager = getToastState();

  let words = $state<string[]>([]);
  let loading = $state(false);
  let search = $state('');
  let debouncedSearch = $state('');
  let currentPage = $state(1);
  let totalPages = $state(1);
  let totalWords = $state(0);
  let hasLoaded = $state(false);
  let lastLoadedSearch = '';
  let lastRequestId = 0;
  let newWord = $state('');
  let addBusy = $state(false);
  let addError = $state('');

  const validateWord = (value: string, currentWord?: string) => {
    const normalized = normalizeWortgeflechtWordKey(value);
    const normalizedCurrentWord = normalizeWortgeflechtWordKey(currentWord ?? '');

    if (!normalized) return 'Bitte ein Wort eingeben.';
    if (!/^[A-Za-zÄÖÜäöüßẞ]+$/.test(normalized)) return 'Nur Buchstaben sind erlaubt.';
    if (Array.from(normalized).length < MIN_WORTGEFLECHT_WORD_LENGTH) {
      return `Das Wort muss mindestens ${MIN_WORTGEFLECHT_WORD_LENGTH} Buchstaben haben.`;
    }
    if (normalized === normalizedCurrentWord) return '';

    return '';
  };

  const getCountText = () => {
    if (debouncedSearch) {
      return `${totalWords} Treffer`;
    }

    const start = totalWords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const end = totalWords === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalWords);
    const label = totalWords === 1 ? 'Wort' : 'Wörtern';

    return `${start}-${end} von ${totalWords} ${label}`;
  };

  const loadWords = async ({
    page = currentPage,
    searchTerm = debouncedSearch,
  }: {
    page?: number;
    searchTerm?: string;
  } = {}) => {
    const requestId = ++lastRequestId;
    const normalizedPage = Math.max(1, page);
    loading = true;

    try {
      const result = await fetchWortgeflechtDictionaryPage({
        page: normalizedPage,
        pageSize: PAGE_SIZE,
        search: searchTerm,
      });

      if (requestId !== lastRequestId) return;

      const nextTotalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
      const nextPage = Math.min(normalizedPage, nextTotalPages);

      totalWords = result.total;
      totalPages = nextTotalPages;

      if (nextPage !== normalizedPage) {
        currentPage = nextPage;
        return;
      }

      words = result.words;
    } catch (error) {
      if (requestId !== lastRequestId) return;

      console.error('Error fetching wortgeflecht dictionary words:', error);
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
  };

  const addWord = async (word: string) => {
    addError = '';

    const normalized = word.trim().toLocaleLowerCase('de-DE');
    const validationError = validateWord(normalized);
    if (validationError) {
      addError = validationError;
      return;
    }

    addBusy = true;

    try {
      await createWortgeflechtDictionaryWord(normalized);
      newWord = '';
      await loadWords({ page: currentPage });
      toastManager.add('Wort hinzugefügt', '');
    } catch (error: unknown) {
      if (error instanceof PostgrestError) {
        addError =
          error.status === 409
            ? 'Duplikat: Dieses Wort ist bereits vorhanden.'
            : 'Fehler beim Hinzufügen.';
      } else {
        addError = 'Netzwerkfehler beim Hinzufügen.';
      }
      console.error('Error adding wortgeflecht dictionary word:', error);
      toastManager.add('Fehler beim Hinzufügen', getPostgrestErrorMessage(error) || addError);
    } finally {
      addBusy = false;
    }
  };

  const requestRename = async (current: string) => {
    const proposal = prompt(`Neues Wort für „${current}“ eingeben:`, current);
    if (proposal == null) return;

    const normalized = proposal.trim().toLocaleLowerCase('de-DE');
    if (!normalized || normalized === current) return;

    const validationError = validateWord(normalized, current);
    if (validationError) {
      addError = validationError;
      return;
    }

    const confirmed = confirm(`Wirklich umbenennen?\n\n${current} → ${normalized}`);
    if (!confirmed) return;

    addBusy = true;
    addError = '';

    try {
      await updateWortgeflechtDictionaryWord({
        oldWord: current,
        nextWord: normalized,
      });
      await loadWords({ page: currentPage });
      toastManager.add('Wort aktualisiert', `${current} → ${normalized}`);
    } catch (error: unknown) {
      if (error instanceof PostgrestError) {
        addError =
          error.status === 409
            ? 'Duplikat: Dieses Wort ist bereits vorhanden.'
            : 'Fehler beim Aktualisieren.';
      } else {
        addError = 'Netzwerkfehler beim Aktualisieren.';
      }
      console.error('Error updating wortgeflecht dictionary word:', error);
      toastManager.add('Fehler beim Aktualisieren', getPostgrestErrorMessage(error) || addError);
    } finally {
      addBusy = false;
    }
  };

  const deleteWord = async (word: string) => {
    addBusy = true;
    addError = '';

    try {
      await deleteWortgeflechtDictionaryWord(word);
      await loadWords({ page: currentPage });
      toastManager.add('Wort gelöscht', '');
    } catch (error: unknown) {
      if (error instanceof PostgrestError) {
        addError = 'Fehler beim Löschen.';
      } else {
        addError = 'Netzwerkfehler beim Löschen.';
      }
      console.error('Error deleting wortgeflecht dictionary word:', error);
      toastManager.add('Fehler beim Löschen', getPostgrestErrorMessage(error) || addError);
    } finally {
      addBusy = false;
    }
  };

  const applyDebouncedSearch = debounce((value: string) => {
    debouncedSearch = value.trim();
  }, 350);

  $effect(() => {
    applyDebouncedSearch(search);
  });

  const visibleWords = $derived(() => {
    return words;
  });

  $effect(() => {
    if (debouncedSearch !== lastLoadedSearch && currentPage !== 1) {
      currentPage = 1;
      return;
    }

    lastLoadedSearch = debouncedSearch;
    loadWords({
      page: currentPage,
      searchTerm: debouncedSearch,
    });
  });
</script>

<div class="flex flex-col md:flex-row my-6 w-full justify-between items-start gap-4">
  <div class="flex flex-col w-full gap-2">
    <form
      class="flex items-end gap-2 w-full"
      onsubmit={event => {
        event.preventDefault();
        addWord(newWord);
      }}
      aria-describedby="add-word-help add-word-error"
    >
      <div class="flex flex-col gap-2 w-full">
        <label for="wortgeflecht-add-word" class="text-sm font-bold">Wort hinzufügen</label>
        <input
          id="wortgeflecht-add-word"
          type="text"
          class="border border-black px-2 py-1 text-xs w-full"
          bind:value={newWord}
          minlength={MIN_WORTGEFLECHT_WORD_LENGTH}
          pattern="[A-Za-zÄÖÜäöüßẞ]+"
          placeholder="Neues Wort"
          autocomplete="off"
          spellcheck="false"
          aria-invalid={!!addError}
          aria-describedby="add-word-help add-word-error"
          oninput={() => {
            if (addError) addError = '';
          }}
        />
      </div>

      <button type="submit" class="z-ds-button" disabled={addBusy || !newWord.trim()}>
        Hinzufügen
      </button>
    </form>

    {#if addError}
      <span id="add-word-error" class="text-sm text-red-700" aria-live="assertive">
        {addError}
      </span>
    {:else}
      <span id="add-word-help" class="text-sm text-gray-600 italic">
        Nur Buchstaben, mindestens {MIN_WORTGEFLECHT_WORD_LENGTH} Zeichen.
      </span>
    {/if}
  </div>

  <div class="w-full">
    <div class="my-4 flex items-center justify-between gap-3">
      <label class="sr-only" for="wortgeflecht-search">Nach Wörtern suchen</label>
      <input
        id="wortgeflecht-search"
        type="search"
        placeholder="Suchen…"
        class="w-full max-w-md border-b border-b-black px-3 py-2 bg-white ml-auto"
        bind:value={search}
        autocomplete="off"
        spellcheck="false"
        enterkeyhint="search"
      />
    </div>

    <div class="text-sm ml-auto w-full text-right" aria-live="polite">
      {debouncedSearch ? `Gefiltert nach „${debouncedSearch}“` : 'Alle Wörter'}
    </div>
  </div>
</div>

{#if loading}
  <div class="loading" role="status" aria-live="polite">
    <p>Lade Wörter...</p>
  </div>
{:else if !hasLoaded}
  <div class="loading" role="status" aria-live="polite">
    <p>Lade Wörter...</p>
  </div>
{:else if visibleWords().length === 0}
  <div class="no-words" role="status" aria-live="polite">
    <p>
      {#if debouncedSearch}
        Keine Treffer für „{debouncedSearch}“.
      {:else}
        Keine Wörter gefunden.
      {/if}
    </p>
  </div>
{:else}
  <div class="word-list-container">
    <div class="text-right my-4 font-bold">{getCountText()}</div>
    <div class="word-grid grid grid-cols-2 md:grid-cols-4 gap-2">
      {#each visibleWords() as word (word)}
        <div class="word-item border border-black px-2 py-1 bg-gray-50 flex gap-2 items-center">
          <div class="mr-auto">
            <HighlightedText segments={highlightMatch(word, debouncedSearch)} />
          </div>
          <button
            aria-label="Wort bearbeiten"
            onclick={() => requestRename(word)}
            class="z-ds-button z-ds-button-outline"
            disabled={addBusy}
          >
            <IconHandler iconName="update" />
          </button>
          <button
            aria-label="Wort löschen"
            onclick={() => {
              if (confirm(`Willst du das Wort <<<${word}>>> wirklich löschen?`)) {
                deleteWord(word);
              }
            }}
            class="z-ds-button"
            disabled={addBusy}
          >
            <IconHandler iconName="delete" extraClasses="w-5 h-5" />
          </button>
        </div>
      {/each}
    </div>
    <TablePagination bind:currentPage {totalPages} />
  </div>
{/if}
