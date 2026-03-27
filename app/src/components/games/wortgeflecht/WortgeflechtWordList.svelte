<script lang="ts">
  import { onMount } from 'svelte';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import HighlightedText from '$components/HighlightedText.svelte';
  import { getToastState } from '$lib/toast-state.svelte';
  import {
    createWortgeflechtDictionaryWord,
    deleteWortgeflechtDictionaryWord,
    fetchWortgeflechtDictionaryWords,
    updateWortgeflechtDictionaryWord,
  } from '$lib/games/wortgeflecht';
  import {
    hasNormalizedWortgeflechtWord,
    MIN_WORTGEFLECHT_WORD_LENGTH,
    normalizeWortgeflechtWordKey,
  } from '$lib/games/wortgeflecht-utils';
  import { getPostgrestErrorMessage, PostgrestError } from '$lib/postgrest-client';
  import { debounce, highlightMatch } from '$utils';

  const collator = new Intl.Collator('de-DE', { sensitivity: 'base' });
  const toastManager = getToastState();

  let words = $state<string[]>([]);
  let loading = $state(false);
  let search = $state('');
  let debouncedSearch = $state('');
  let newWord = $state('');
  let addBusy = $state(false);
  let addError = $state('');

  const sortWords = (input: string[]) => input.slice().sort((a, b) => collator.compare(a, b));

  const hasWord = (candidate: string) => hasNormalizedWortgeflechtWord(words, candidate);

  const validateWord = (value: string, currentWord?: string) => {
    const normalized = normalizeWortgeflechtWordKey(value);
    const normalizedCurrentWord = normalizeWortgeflechtWordKey(currentWord ?? '');

    if (!normalized) return 'Bitte ein Wort eingeben.';
    if (!/^[A-Za-zÄÖÜäöüß]+$/.test(normalized)) return 'Nur Buchstaben sind erlaubt.';
    if (Array.from(normalized).length < MIN_WORTGEFLECHT_WORD_LENGTH) {
      return `Das Wort muss mindestens ${MIN_WORTGEFLECHT_WORD_LENGTH} Buchstaben haben.`;
    }
    if (normalized !== normalizedCurrentWord && hasWord(normalized)) {
      return 'Dieses Wort existiert bereits.';
    }

    return '';
  };

  const loadWords = async () => {
    loading = true;

    try {
      words = await fetchWortgeflechtDictionaryWords();
    } catch (error) {
      console.error('Error fetching wortgeflecht dictionary words:', error);
      words = [];
      toastManager.add('Fehler beim Laden', getPostgrestErrorMessage(error));
    } finally {
      loading = false;
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

    const previousWords = words;
    words = sortWords([...words, normalized]);
    addBusy = true;

    try {
      const createdWord = await createWortgeflechtDictionaryWord(normalized);
      words = sortWords(
        Array.from(new Set([...previousWords, createdWord.trim().toLocaleLowerCase('de-DE')])),
      );
      newWord = '';
      toastManager.add('Wort hinzugefügt', '');
    } catch (error: unknown) {
      words = previousWords;
      if (error instanceof PostgrestError) {
        addError =
          error.status === 409 ? 'Duplikat: Dieses Wort ist bereits vorhanden.' : 'Fehler beim Hinzufügen.';
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

    const previousWords = words;
    words = sortWords(words.map(word => (word === current ? normalized : word)));
    addBusy = true;
    addError = '';

    try {
      const updatedWord = await updateWortgeflechtDictionaryWord({
        oldWord: current,
        nextWord: normalized,
      });
      words = sortWords(
        previousWords.map(word => (word === current ? updatedWord.trim().toLocaleLowerCase('de-DE') : word)),
      );
      toastManager.add('Wort aktualisiert', `${current} → ${updatedWord}`);
    } catch (error: unknown) {
      words = previousWords;
      if (error instanceof PostgrestError) {
        addError =
          error.status === 409 ? 'Duplikat: Dieses Wort ist bereits vorhanden.' : 'Fehler beim Aktualisieren.';
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
    const previousWords = words;
    words = words.filter(entry => entry !== word);
    addBusy = true;
    addError = '';

    try {
      await deleteWortgeflechtDictionaryWord(word);
      toastManager.add('Wort gelöscht', '');
    } catch (error: unknown) {
      words = previousWords;
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

  onMount(() => {
    loadWords();
  });

  const visibleWords = $derived(() => {
    const term = debouncedSearch.toLocaleLowerCase('de-DE');
    if (!term) return words;
    return words.filter(word => word.toLocaleLowerCase('de-DE').includes(term));
  });

  const countText = $derived(
    `${visibleWords().length} ${visibleWords().length === 1 ? 'Wort' : 'Wörter'}`,
  );
</script>

<div class="flex flex-col md:flex-row my-6 w-full justify-between items-start gap-4">
  <div class="flex flex-col w-full gap-2">
    <form
      class="flex items-end gap-2 w-full"
      onsubmit={(event) => {
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
          pattern="[A-Za-zÄÖÜäöüß]+"
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
    <div class="text-right my-4 font-bold">{countText}</div>
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
  </div>
{/if}
