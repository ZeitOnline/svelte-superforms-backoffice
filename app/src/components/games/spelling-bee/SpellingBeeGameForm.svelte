<script lang="ts">
  import type { GameComplete, GameSpellingBeeComplete, SpellingBeeSolutionItem } from '$types';
  import { superForm, setError, arrayProxy } from 'sveltekit-superforms';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { zodClient, type ZodObjectType } from 'sveltekit-superforms/adapters';
  import { onMount } from 'svelte';
  import { blur } from 'svelte/transition';
  import IconHandler from '../../icons/IconHandler.svelte';
  import ViewNavigation from '../../ViewNavigation.svelte';
  import type { BeginningOptions } from '$types';
  import { view } from '$stores/view-state-store.svelte';
  import { createGame, getNextAvailableDateForGame, updateGame } from '$lib/queries';
  import { CONFIG_GAMES } from '$config/games.config';
  import { APP_MESSAGES } from '$lib/app-messages';
  import { ERRORS } from '$lib/error-messages';
  import { getToastState } from '$lib/toast-state.svelte';
  import { isSpellingBeeGame } from '$utils';
  import { SvelteDate } from 'svelte/reactivity';
  import {
    canBeBuiltFromWordcloud,
    type SaveSpellingBeeGameFormSchema,
    type SaveSpellingBeeSolutionSchema,
  } from '$schemas/spelling-bee';
  import {
    DEFAULT_SPELLING_BEE_SOLUTION,
    createSpellingBeeSolutions,
    replaceSpellingBeeSolutions,
  } from '$lib/games/spelling-bee';

  type DataProps = {
    games: GameSpellingBeeComplete[];
    generateGameForm: SuperValidated<any>;
    saveGameForm: SuperValidated<any>;
  };

  type SpellingBeeGameFormProps = {
    data: DataProps;
    game?: GameSpellingBeeComplete;
    beginning_option: BeginningOptions;
    resultsDataBody: string[][];
  };

  let {
    data,
    game,
    beginning_option = $bindable(),
    resultsDataBody = $bindable(),
  }: SpellingBeeGameFormProps = $props();

  const toastManager = getToastState();
  let isSubmitted = false;
  const compatibilityErrorText = 'Lösung lässt sich nicht mit den Buchstaben der Wortwolke bilden.';
  let hasCheckedWordcloudCompatibility = false;
  let incompatibleSolutionIndexes: number[] = [];
  let solutionsFitWordcloud = $derived(validateSolutionsWithWordcloud());

  const spellingBeeForm = data.saveGameForm as SuperValidated<SaveSpellingBeeGameFormSchema>;
  const saveGameFormSchema = CONFIG_GAMES['spelling-bee'].schemas.saveGameFormSchema;

  const superform = superForm(spellingBeeForm, {
    validators: zodClient(saveGameFormSchema as unknown as ZodObjectType),
    SPA: true,
    resetForm: false,
    taintedMessage: isSubmitted ? false : true,
    async onUpdate({ form }) {
      try {
        const finalData = {
          name: form.data.name,
          start_time: form.data.start_time,
          wordcloud: form.data.wordcloud,
        };

        // Validation logic
        if (beginning_option === 'edit' && game && isSpellingBeeGame(game)) {
          if (game.name !== form.data.name) {
            if (data.games.some(g => g.name === form.data.name)) {
              setError(form, 'name', ERRORS.GAME.NAME.TAKEN);
              return;
            }
          }
          if (game.start_time !== form.data.start_time) {
            if (data.games.some(g => g.start_time === form.data.start_time)) {
              setError(form, 'start_time', ERRORS.GAME.RELEASE_DATE.TAKEN);
              return;
            }
          }
          if (game.wordcloud !== form.data.wordcloud) {
            if (data.games.some(g => g.wordcloud === form.data.wordcloud)) {
              setError(form, 'wordcloud', 'Diese Wortwolke existiert bereits.');
              return;
            }
          }
        } else {
          // Create validation
          if (data.games.some(g => g.name === form.data.name)) {
            setError(form, 'name', ERRORS.GAME.NAME.TAKEN);
            return;
          }
          if (data.games.some(g => g.start_time === form.data.start_time)) {
            setError(form, 'start_time', ERRORS.GAME.RELEASE_DATE.TAKEN);
            return;
          }
          if (data.games.some(g => g.wordcloud === form.data.wordcloud)) {
            setError(form, 'wordcloud', 'Diese Wortwolke existiert bereits.');
            return;
          }
        }

        if (!form.valid) {
          const flattenedErrors = collectErrors(form.errors);
          const firstError = flattenedErrors[0] ?? 'Bitte alle Pflichtfelder ausfüllen.';
          toastManager.add(firstError, '');
          return;
        }

        if (beginning_option !== 'edit') {
          const newGameArray = await createGame({
            gameName: 'spelling-bee',
            data: finalData as GameComplete,
          });
          const newGame = (newGameArray[0] ?? null) as GameSpellingBeeComplete | null;

          if (!newGame?.id) {
            throw new Error('Failed to retrieve created spelling bee game id.');
          }

          if (form.data.solutions && form.data.solutions.length > 0) {
            await createSpellingBeeSolutions(newGame.id, form.data.solutions);
          }
        } else {
          await updateGame({
            gameName: 'spelling-bee',
            gameId: game!.id,
            data: finalData as GameComplete,
          });

          await replaceSpellingBeeSolutions(game!.id, form.data.solutions ?? []);
        }

        isSubmitted = true;
        if (beginning_option === 'edit') {
          toastManager.add(APP_MESSAGES.GAME.EDITED_SUCCESS, '');
        } else {
          toastManager.add(APP_MESSAGES.GAME.ADDED_SUCCESS, '');
        }

        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        console.error('Error saving Spelling Bee game:', error);
        toastManager.add(ERRORS.GAME.FAILED_TO_ADD, '');
      }
    },
  });

  const { form, errors, enhance, isTainted, reset } = superform;

  const solutionProxy = arrayProxy(superform, 'solutions');
  const { values: solutionValues } = solutionProxy;
  let firstSolutionError = $derived(Array.isArray($errors.solutions)
    ? (((
        $errors.solutions.find(err => (err as Record<string, string | undefined>)?.solution) as
          | Record<string, string | undefined>
          | undefined
      )?.solution as string | undefined) ?? '')
    : '');

  $effect(() => {
    if (hasCheckedWordcloudCompatibility && incompatibleSolutionIndexes.length) {
      firstSolutionError = compatibilityErrorText;
    }
  });

  function collectErrors(errors: unknown): string[] {
    if (!errors) return [];
    if (typeof errors === 'string') return [errors];
    if (Array.isArray(errors)) return errors.flatMap(collectErrors);
    if (typeof errors === 'object')
      return Object.values(errors as Record<string, unknown>).flatMap(collectErrors);
    return [];
  }

  function calculatePoints(word: string) {
    const len = word.trim().length;
    if (len >= 9) return 12;
    if (len === 4) return 3;
    if (len === 3) return 2;
    if (len <= 2) return 0;
    // For lengths 5, 6, 7, 8 (or any other positive length < 9) default to the length itself.
    return len;
  }

  function handleSolutionChange(index: number, input: HTMLInputElement) {
    const uppercasedValue = input.value.toUpperCase();
    input.value = uppercasedValue;

    const updatedSolutions = [...($form.solutions ?? [])];
    const existing =
      updatedSolutions[index] ?? (DEFAULT_SPELLING_BEE_SOLUTION as SaveSpellingBeeSolutionSchema);
    updatedSolutions[index] = {
      ...existing,
      solution: uppercasedValue,
      points: calculatePoints(uppercasedValue),
    };
    $form.solutions = updatedSolutions as unknown as SpellingBeeSolutionItem;
  }

  function validateSolutionsWithWordcloud() {
    const wordcloud = ($form.wordcloud ?? '').toUpperCase();
    const solutions = $form.solutions ?? [];

    if (wordcloud.length !== 9) {
      incompatibleSolutionIndexes = [];
      return false;
    }

    const invalidIndexes = solutions
      .map((solution, index) => {
        const word = solution.solution?.trim();
        if (!word) return null;
        return canBeBuiltFromWordcloud(word, wordcloud) ? null : index;
      })
      .filter((index): index is number => index !== null);

    incompatibleSolutionIndexes = invalidIndexes;
    return invalidIndexes.length === 0;
  }

  function handleCompatibilityCheck() {
    hasCheckedWordcloudCompatibility = true;
    solutionsFitWordcloud = validateSolutionsWithWordcloud();
  }

  const isSolutionIncompatible = (index: number) =>
    hasCheckedWordcloudCompatibility && incompatibleSolutionIndexes.includes(index);



  // const solutionValues = solutionProxy.values as unknown as SolutionRow[];
  // const solutionErrors = solutionProxy.valueErrors;

  onMount(() => {
    if (game && isSpellingBeeGame(game)) {
      $form.name = game.name;
      $form.start_time = game.start_time.split('T')[0] ?? '';
      $form.wordcloud = game.wordcloud;
    }

    if ($form.start_time === '') {
      addCustomDate();
    }
  });

  const addCustomDate = async () => {
    try {
      const lastGameDate = await getNextAvailableDateForGame('spelling-bee');
      const next = new SvelteDate(lastGameDate);
      next.setDate(next.getDate() + 1);
      $form.start_time = next.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error fetching next available date:', error);
    }
  };

  function resetAll() {
    reset();
    beginning_option = null;
    console.log('Resetting selection...');
    if (game) {
      view.updateSelectedGameId(-1);
      view.updateView('dashboard');
    }
  }

  function handleBackToDashboard() {
    if (isTainted()) {
      if (confirm(APP_MESSAGES.LEAVE_PAGE)) {
        console.log('okay');
        resetAll();
      }
    } else resetAll();
  }

  function addSolutionRow() {
    const defaultRow = {
      ...DEFAULT_SPELLING_BEE_SOLUTION,
      points: calculatePoints(DEFAULT_SPELLING_BEE_SOLUTION.solution),
    };
    const newSolutions = [...$form.solutions, defaultRow] as SpellingBeeSolutionItem;
    $form.solutions = newSolutions;
  }

  function removeSolutionRow(index: number) {
    if (
      confirm(`Bist du dir sicher, dass du die Reihe ${index + 1} löschen möchtest?`) &&
      $form.solutions.length > 0
    ) {
      $form.solutions.splice(index, 1);
      $form.solutions = $form.solutions; // trigger update
    }
  }

  onMount(() => {
    if (beginning_option === 'edit' && game?.game_solution) {
      $form.solutions = game.game_solution.map(s => ({
        solution: s.solution?.toUpperCase() ?? '',
        solution_type: s.solution_type,
        solution_explanation: s.solution_explanation,
        points: s.points,
      }));
    }

    if ($form.solutions.length === 0) {
      addSolutionRow();
    }

    // Ensure points are in sync with typed solutions when loading a draft
    $form.solutions = $form.solutions.map(solution => ({
      ...solution,
      points: calculatePoints(solution.solution),
    })) as unknown as SpellingBeeSolutionItem;

    solutionsFitWordcloud = validateSolutionsWithWordcloud();
  });
</script>

{#if beginning_option === 'edit' && game}
  <ViewNavigation
    viewName="Spelling Bee Spiel bearbeiten"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="spelling-bee"
  />
{:else}
  <ViewNavigation
    viewName="Neues Spelling Bee Spiel erstellen"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="spelling-bee"
  />
{/if}

<form class="my-z-ds-24" method="POST" enctype="multipart/form-data" use:enhance>
  <!-- Name -->
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 gap-z-ds-4"
  >
    <label class="text-md font-bold" for="name">Name:</label>
    <div class="relative">
      <input
        id="name"
        name="name"
        type="text"
        placeholder="Buchstabiene Nr.XXX"
        class="border py-z-ds-8 px-z-ds-12 border-black text-md w-full sm:w-[250px]"
        bind:value={$form.name}
        aria-invalid={$errors.name ? 'true' : undefined}
      />
      {#if $errors.name}
        <div in:blur class="text-red-500 flex items-center gap-2 text-xs mt-2">
          <IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
          <span>{$errors.name}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Start Time -->
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 gap-z-ds-4"
  >
    <label class="text-md font-bold" for="start_time">Startzeit:</label>
    <div class="relative">
      <input
        id="start_time"
        name="start_time"
        type="date"
        class="border py-z-ds-8 px-z-ds-12 border-black text-md w-full sm:w-[250px]"
        bind:value={$form.start_time}
        aria-invalid={$errors.start_time ? 'true' : undefined}
      />
      {#if $errors.start_time}
        <div in:blur class="text-red-500 flex items-center gap-2 text-xs mt-2">
          <IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
          <span>{$errors.start_time}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Wordcloud -->
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 gap-z-ds-4"
  >
    <label class="text-md font-bold" for="wordcloud">Wortwolke (9 Zeichen):</label>
    <div class="relative">
      <input
        id="wordcloud"
        name="wordcloud"
        type="text"
        placeholder="abcdefghi"
        maxlength="9"
        class="border py-z-ds-8 px-z-ds-12 border-black text-md w-full sm:w-[250px]"
        bind:value={$form.wordcloud}
        aria-invalid={$errors.wordcloud ? 'true' : undefined}
        onblur={handleCompatibilityCheck}
      />
      {#if $errors.wordcloud}
        <div
          in:blur
          class="text-red-500 flex flex-wrap max-w-[200px] items-center gap-2 text-xs mt-2"
        >
          <IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
          <span>{$errors.wordcloud}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- UI TABLE -->
  <h2 class="font-bold mt-16 mb-4">Lösungen</h2>

  <div class="relative overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr>
          <th>#</th>
          <th>Punkte</th>
          <th>Wort</th>
          <th>Wortart</th>
          <th>Erklärung</th>
          <th>
            <button class="z-ds-button z-ds-button-outline" type="button" onclick={addSolutionRow}
              >+</button
            >
          </th>
        </tr>
      </thead>

      <tbody>
        {#each $solutionValues as _, i (i)}
          <tr>
            <td>{i + 1}</td>

            <td>
              <input
                class="w-full bg-transparent border p-1"
                readonly
                bind:value={$solutionValues[i].points}
              />
            </td>

            <td>
              <input
                class="w-full bg-transparent border p-1"
                class:border-red-500={$errors.solutions?.[i]?.solution || isSolutionIncompatible(i)}
                maxlength="9"
                bind:value={$solutionValues[i].solution}
                placeholder="Lösung"
                oninput={event => handleSolutionChange(i, event.currentTarget)}
                onblur={handleCompatibilityCheck}
              />
            </td>

            <td>
              <input
                class="w-full bg-transparent border p-1"
                bind:value={$solutionValues[i].solution_type}
                placeholder="Nomen, Verb, etc."
              />
            </td>

            <td>
              <textarea
                rows="2"
                class="w-full bg-transparent border p-1 resize-none"
                bind:value={$solutionValues[i].solution_explanation}
                placeholder="Eine coole Sache über das Wort..."
              ></textarea>
            </td>

            <td>
              <button
                type="button"
                class="z-ds-button z-ds-button-outline"
                onclick={() => removeSolutionRow(i)}
              >
                -
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if firstSolutionError}
    <div class="text-red-500 text-sm text-center mt-6">
      {firstSolutionError}
    </div>
  {/if}

  <div class="flex justify-center mt-12">
    <button
      class="z-ds-button"
      type="submit"
      disabled={!solutionsFitWordcloud}
      aria-disabled={!solutionsFitWordcloud}
      class:opacity-50={!solutionsFitWordcloud}
    >
      {#if beginning_option === 'edit'}
        Veränderungen speichern
      {:else}
        Neues Spelling Bee Spiel erstellen
      {/if}
    </button>
  </div>
</form>
