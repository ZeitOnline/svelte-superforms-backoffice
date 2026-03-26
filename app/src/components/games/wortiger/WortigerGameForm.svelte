<script lang="ts">
  import type { GameComplete, GameWortigerComplete } from '$types';
  import { superForm, setError } from 'sveltekit-superforms';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { blur } from 'svelte/transition';
  import IconHandler from '../../icons/IconHandler.svelte';
  import { getNextAvailableDateForGame } from '$lib/queries';
  import ViewNavigation from '../../ViewNavigation.svelte';
  import type { BeginningOptions } from '$types';
  import { zodClient, type ZodObjectType } from 'sveltekit-superforms/adapters';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { view } from '$stores/view-state-store.svelte';
  import { APP_MESSAGES } from '$lib/app-messages';
  import { ERRORS } from '$lib/error-messages';
  import { getToastState } from '$lib/toast-state.svelte';
  import { saveWortigerGameFormSchema, type SaveWortigerGameFormSchema } from '$schemas/wortiger';
  import { isWortigerGame } from '$utils';
  import {
    type LastUsedInfo,
    fetchLastUsedInfo,
    fetchWordSetForLength,
    getLastUsedInfo,
    hasLevelDateConflict,
    validateAgainstWordList,
  } from '$lib/games/wortiger-validation';
  import { SvelteDate, SvelteMap } from 'svelte/reactivity';
  import { CONFIG_GAMES } from '$config/games.config';
  import { createWortigerGame, MAP_LEVEL_CHARACTERS, updateWortigerGame } from '$lib/games/wortiger';

  type DataProps = {
    games: GameWortigerComplete[];
    generateGameForm: SuperValidated<SaveWortigerGameFormSchema>;
    saveGameForm: SuperValidated<SaveWortigerGameFormSchema>;
  };

  type WortigerGameFormProps = {
    data: DataProps;
    game?: GameComplete;
    beginning_option: BeginningOptions;
  };

  let { data, game, beginning_option = $bindable() }: WortigerGameFormProps = $props();

  const toastManager = getToastState();
  let isSubmitted = false;
  const WORDLIST_RULE: 'must-exist' | 'must-not-exist' = 'must-exist';

  let wordSets = $state<Record<number, Set<string>>>({
    4: new Set(),
    5: new Set(),
    6: new Set(),
    7: new Set(),
  });
  const pendingWordSets = new SvelteMap<number, Promise<Set<string>>>();

  const levelToLength = (level: number) => MAP_LEVEL_CHARACTERS[level];

  let lastUsedRemote = $state<LastUsedInfo | null>(null);
  let lastUsedRequestId = 0;

  async function ensureWordSetForLevel(level: number) {
    const length = levelToLength(level);
    if (!length) return;
    const existing = wordSets[length];
    if (existing && existing.size > 0) return;
    const inFlight = pendingWordSets.get(length);
    if (inFlight) {
      await inFlight;
      const after = wordSets[length];
      if (!after || after.size === 0) {
        throw new Error(`Wortliste für ${length} Buchstaben konnte nicht geladen werden`);
      }
      return;
    }
    try {
      const promise = fetchWordSetForLength({
        apiBase: CONFIG_GAMES.wortiger.apiBase,
        endpointName: CONFIG_GAMES.wortiger.endpoints.wordList!.name,
        length,
      });
      pendingWordSets.set(length, promise);
      const set = await promise;
      const next = { ...wordSets };
      next[length] = set;
      wordSets = next;
      if (set.size === 0) {
        throw new Error(`Wortliste für ${length} Buchstaben konnte nicht geladen werden`);
      }
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      pendingWordSets.delete(length);
    }
  }

  function validateAgainstWordListForForm(level: number, value: string): string | null {
    return validateAgainstWordList({
      level,
      value,
      wordSets,
      rule: WORDLIST_RULE,
    });
  }

  const computeLastUsed = (level: number, value: string) =>
    getLastUsedInfo({
      games: data.games,
      level,
      value,
      excludeId: beginning_option === 'edit' && game ? game.id : undefined,
    });

  async function loadLastUsedInfo(level: number, value: string) {
    const requestId = ++lastUsedRequestId;
    const trimmed = (value ?? '').trim();
    const expectedLength = levelToLength(level);
    if (!trimmed || !expectedLength || trimmed.length !== expectedLength) {
      lastUsedRemote = null;
      return null;
    }

    try {
      const result = await fetchLastUsedInfo({
        apiBase: CONFIG_GAMES.wortiger.apiBase,
        endpointName: CONFIG_GAMES.wortiger.endpoints.games.name,
        level,
        value: trimmed,
        excludeId: beginning_option === 'edit' && game ? game.id : undefined,
      });
      if (requestId === lastUsedRequestId) {
        lastUsedRemote = result;
      }
      return result;
    } catch (error) {
      console.error('Error checking Wortiger duplicate usage:', error);
      if (requestId === lastUsedRequestId) {
        lastUsedRemote = computeLastUsed(level, trimmed);
      }
      return requestId === lastUsedRequestId ? lastUsedRemote : null;
    }
  }

  // svelte-ignore state_referenced_locally
  const wortigerForm = data.saveGameForm;

  const superform = superForm(wortigerForm, {
    validators: zodClient(saveWortigerGameFormSchema as unknown as ZodObjectType),
    SPA: true,
    resetForm: false,
    taintedMessage: isSubmitted ? false : true,
    async onUpdate({ form }) {
      try {
        try {
          await ensureWordSetForLevel(form.data.level);
        } catch {
          setError(form, 'solution', 'Wortliste konnte nicht geladen werden.');
          return;
        }

        const wordListMsg = validateAgainstWordListForForm(form.data.level, form.data.solution);
        if (wordListMsg) {
          setError(form, 'solution', wordListMsg);
          return;
        }

        // Build final data for Wortiger
        const finalData = {
          level: form.data.level,
          solution: form.data.solution,
          release_date: form.data.release_date,
          // active: form.data.published
        };

        const hasConflict = hasLevelDateConflict({
          games: data.games,
          level: form.data.level,
          releaseDate: form.data.release_date,
          excludeId: beginning_option === 'edit' && game && isWortigerGame(game) ? game.id : undefined,
        });
        if (hasConflict) {
          setError(form, 'release_date', ERRORS.WORTIGER.LEVEL_DATE_TAKEN);
          return;
        }

        if (!form.valid) {
          return;
        }

        // Handle update vs create
        if (beginning_option === 'edit' && game) {
          const finalEditedGame = {
            id: game.id,
            ...finalData,
          } as GameComplete;

          if ('active' in finalEditedGame) {
            delete finalEditedGame.active;
          }

          await updateWortigerGame({
            gameId: game.id,
            data: finalEditedGame,
          });

          isSubmitted = true;
          toastManager.add(APP_MESSAGES.GAME.EDITED_SUCCESS, '');

          refreshDataAndGoToDashboard();
        } else {
          // Create new Wortiger game (not active by default)
          const createData: Omit<typeof finalData, 'active'> & { active?: boolean } = {
            ...finalData,
          };
          // Remove the 'active' property only if it exists
          if ('active' in createData) {
            delete createData.active;
          }

          await createWortigerGame(createData as GameComplete);

          isSubmitted = true;
          toastManager.add(APP_MESSAGES.GAME.ADDED_SUCCESS, '');

          refreshDataAndGoToDashboard();
      }
    } catch (error) {
      console.error('Error saving Wortiger game:', error);
      toastManager.add(ERRORS.GAME.FAILED_TO_ADD, '');
    }
  },
  });

  const { form, errors, enhance, isTainted, reset } = superform;

  onMount(() => {
    // Populate form with existing game data
    if (game && isWortigerGame(game)) {
      $form.level = game.level;
      $form.solution = game.solution;
      $form.release_date = game.release_date;
      // $form.published = game.active || false;
    }

    // Set default date if empty
    if ($form.release_date === '') {
      addCustomDate();
    }

  });

  $effect(() => {
    if ($form.level) {
      ensureWordSetForLevel($form.level);
    }
  });

  $effect(() => {
    const level = $form.level;
    const solution = $form.solution;
    if (!level) {
      lastUsedRemote = null;
      return;
    }
    loadLastUsedInfo(level, solution);
  });

  const addCustomDate = async () => {
    try {
      const lastGameDate = await getNextAvailableDateForGame('wortiger');
      const lastGameDateFormat = new SvelteDate(lastGameDate);
      lastGameDateFormat.setDate(lastGameDateFormat.getDate() + 1);
      const nextGameDate = lastGameDateFormat.toISOString().split('T')[0];
      $form.release_date = nextGameDate;
    } catch (error) {
      console.error('Error fetching next available date:', error);
    }
  };

  const lastUsed = $derived.by(() => lastUsedRemote ?? computeLastUsed($form.level, $form.solution));
  const levelDateConflict = $derived.by(() =>
    hasLevelDateConflict({
      games: data.games,
      level: $form.level,
      releaseDate: $form.release_date,
      excludeId: beginning_option === 'edit' && game && isWortigerGame(game) ? game.id : undefined,
    }),
  );
  const releaseDateError = $derived.by(
    () => $errors.release_date ?? (levelDateConflict ? ERRORS.WORTIGER.LEVEL_DATE_TAKEN : null),
  );

  function resetAll() {
    reset();
    beginning_option = null;
    if (game) {
      view.updateSelectedGameId(-1);
      view.updateView('dashboard');
    }
  }

  async function refreshDataAndGoToDashboard() {
    await invalidateAll();
    resetAll();
    view.updateView('dashboard');
  }

  function handleBackToDashboard(): void {
    if (isTainted()) {
      if (confirm(APP_MESSAGES.LEAVE_PAGE)) {
        resetAll();
      }
    } else {
      resetAll();
    }
  }
</script>

{#if beginning_option === 'edit' && game}
  <ViewNavigation
    viewName="Wortiger Spiel bearbeiten"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="wortiger"
  />
{:else}
  <ViewNavigation
    viewName="Neues Wortiger Spiel erstellen"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="wortiger"
  />
{/if}

<form class="my-z-ds-24" method="POST" enctype="multipart/form-data" use:enhance>
  <!-- Level Field -->
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 relative gap-z-ds-4"
  >
    <label class="text-md font-bold" for="level">Level:</label>
    <div class="relative">
      <select
        class="border py-z-ds-8 w-full sm:w-62.5 px-z-ds-12 invalid:border-red-600 border-black text-md"
        name="level"
        id="level"
        aria-invalid={$errors.level ? 'true' : undefined}
        bind:value={$form.level}
      >
        <option value={1}>Level 1 (7 Zeichen)</option>
        <option value={2}>Level 2 (6 Zeichen)</option>
        <option value={3}>Level 3 (5 Zeichen)</option>
        <option value={4}>Level 4 (4 Zeichen)</option>
      </select>

      {#if $errors.level}
        <div
          in:blur
          class="text-red-500 invalid flex items-center gap-z-ds-4 text-xs sm:max-w-62.5 mt-2"
        >
          <IconHandler
            iconName="error"
            extraClasses="min-w-4 min-h-4 w-4 h-4 text-z-ds-color-accent-100"
          />
          <span class="text-xs">{$errors.level}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Solution Field -->
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 relative gap-z-ds-4"
  >
    <label class="text-md font-bold" for="solution">Lösung:</label>
    <div class="relative">
      <input
        class="border py-z-ds-8 w-full sm:w-62.5 px-z-ds-12 invalid:border-red-600 border-black text-md"
        name="solution"
        id="solution"
        type="text"
        placeholder="Geben Sie die Lösung ein"
        aria-invalid={$errors.solution ? 'true' : undefined}
        bind:value={$form.solution}
      />

      {#if $errors.solution}
        <div
          in:blur
          class="text-red-500 invalid flex items-center gap-z-ds-4 text-xs sm:max-w-62.5 mt-2"
        >
          <IconHandler
            iconName="error"
            extraClasses="min-w-4 min-h-4 w-4 h-4 text-z-ds-color-accent-100"
          />
          <span class="text-xs">{$errors.solution}</span>
        </div>
      {/if}

      {#if lastUsed}
        <div class="text-amber-700 flex items-center gap-z-ds-4 text-xs sm:max-w-62.5 mt-2">
          <IconHandler
            iconName="error"
            extraClasses="min-w-4 min-h-4 w-4 h-4 text-amber-600"
          />
          <span class="text-xs">
            „{$form.solution}“ wurde zuletzt am {lastUsed.lastDate ?? 'unbekannt'} verwendet
            {lastUsed.count > 1 ? ` (${lastUsed.count}×)` : ''}.
          </span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Release Date Field -->
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 relative gap-z-ds-4"
  >
    <label class="text-md font-bold" for="release_date">Veröffentlichungsdatum:</label>
    <div class="relative">
      <input
        class="border py-z-ds-8 w-full sm:w-62.5 px-z-ds-12 border-black text-md"
        name="release_date"
        id="release_date"
        type="date"
        aria-invalid={releaseDateError ? 'true' : undefined}
        bind:value={$form.release_date}
      />

      {#if releaseDateError}
        <div
          in:blur
          class="text-red-500 invalid flex items-center gap-z-ds-4 text-xs sm:max-w-62.5 mt-2"
        >
          <IconHandler
            iconName="error"
            extraClasses="min-w-4 min-h-4 w-4 h-4 text-z-ds-color-accent-100"
          />
          <span class="text-xs">{releaseDateError}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="flex flex-row gap-4 items-center my-12 mx-auto w-full justify-center">
    <button class="z-ds-button" type="submit">
      {#if beginning_option === 'edit'}
        Veränderungen speichern
      {:else}
        Neues Wortiger Spiel erstellen
      {/if}
    </button>
  </div>
</form>
