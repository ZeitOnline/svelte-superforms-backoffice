<script lang="ts">
  import { invalidateAll } from '$app/navigation';
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
  import { getNextAvailableDateForGame } from '$lib/queries';
  import { CONFIG_GAMES } from '$config/games.config';
  import { APP_MESSAGES } from '$lib/app-messages';
  import { ERRORS } from '$lib/error-messages';
  import { getToastState } from '$lib/toast-state.svelte';
  import { isSpellingBeeGame } from '$utils';
  import { SvelteDate } from 'svelte/reactivity';
  import {
    SPELLING_BEE_SOLUTION_ISSUE_MESSAGES,
    type SaveSpellingBeeGameFormSchema,
    type SaveSpellingBeeSolutionSchema,
  } from '$schemas/spelling-bee';
  import {
    getLetterSetKey,
    getOtherLettersCount,
    getSpellingBeeLetters,
    getSpellingBeeSolutionIssue,
    resolveWordcloud,
    SPELLING_BEE_LETTER_COUNT,
    SPELLING_BEE_TYPE_LABELS,
    splitWordcloud,
    type SpellingBeeSolutionIssue,
  } from '$lib/games/spelling-bee-letters';
  import {
    createSpellingBeeGame,
    DEFAULT_SPELLING_BEE_SOLUTION,
    createSpellingBeeSolutions,
    replaceSpellingBeeSolutions,
    updateSpellingBeeGame,
  } from '$lib/games/spelling-bee';

  type DataProps = {
    games: GameSpellingBeeComplete[];
    generateGameForm: SuperValidated<SaveSpellingBeeGameFormSchema>;
    saveGameForm: SuperValidated<SaveSpellingBeeGameFormSchema>;
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
  let isSubmitted = $state(false);
  let hasCheckedWordcloudCompatibility = $state(false);

  const saveGameFormSchema = CONFIG_GAMES['spelling-bee'].schemas.saveGameFormSchema;

  // svelte-ignore state_referenced_locally
    const superform = superForm(data.saveGameForm as SuperValidated<SaveSpellingBeeGameFormSchema>, {
    validators: zodClient(saveGameFormSchema as unknown as ZodObjectType),
    SPA: true,
    resetForm: false,
    taintedMessage: isSubmitted ? false : true,
    async onUpdate({ form }) {
      try {
        const centralLetter = form.data.central_letter.toUpperCase();
        const otherLetters = form.data.other_letters.toUpperCase();
        const editedGame =
          beginning_option === 'edit' && game && isSpellingBeeGame(game) ? game : null;
        const finalData = {
          name: form.data.name,
          start_time: form.data.start_time,
          type: form.data.type,
          central_letter: centralLetter,
          other_letters: otherLetters,
          // Legacy column, still read by the search RPC.
          wordcloud: resolveWordcloud(centralLetter, otherLetters, editedGame),
        };
        const letterSetKey = getLetterSetKey(centralLetter, otherLetters);
        const originalLetters = editedGame ? getSpellingBeeLetters(editedGame) : null;
        const otherGames = data.games.filter(g => g.id !== editedGame?.id);

        // On edit, only re-check values that changed, so legacy duplicates stay editable.
        const nameChanged = editedGame?.name !== form.data.name;
        const startTimeChanged = editedGame?.start_time.split('T')[0] !== form.data.start_time;
        const lettersChanged =
          !originalLetters ||
          getLetterSetKey(originalLetters.centralLetter, originalLetters.otherLetters) !==
            letterSetKey;

        if (nameChanged && otherGames.some(g => g.name === form.data.name)) {
          setError(form, 'name', ERRORS.GAME.NAME.TAKEN);
          return;
        }
        // A regular game and a mini may share a release day.
        if (
          startTimeChanged &&
          otherGames.some(
            g =>
              g.start_time.split('T')[0] === form.data.start_time &&
              getSpellingBeeLetters(g).type === form.data.type,
          )
        ) {
          setError(form, 'start_time', ERRORS.GAME.RELEASE_DATE.TAKEN);
          return;
        }
        if (
          lettersChanged &&
          otherGames.some(g => {
            const letters = getSpellingBeeLetters(g);
            return getLetterSetKey(letters.centralLetter, letters.otherLetters) === letterSetKey;
          })
        ) {
          setError(form, 'other_letters', 'Diese Wortwolke existiert bereits.');
          return;
        }

        if (!form.valid) {
          const flattenedErrors = collectErrors(form.errors);
          const firstError = flattenedErrors[0] ?? 'Bitte alle Pflichtfelder ausfüllen.';
          toastManager.add(firstError, '');
          return;
        }

        if (beginning_option !== 'edit') {
          const newGameArray = await createSpellingBeeGame(finalData as GameComplete);
          const newGame = (newGameArray[0] ?? null) as GameSpellingBeeComplete | null;

          if (!newGame?.id) {
            throw new Error('Failed to retrieve created spelling bee game id.');
          }

          if (form.data.solutions && form.data.solutions.length > 0) {
            await createSpellingBeeSolutions(newGame.id, form.data.solutions);
          }
        } else {
          await updateSpellingBeeGame({
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

        refreshDataAndGoToDashboard();
      } catch (error) {
        console.error('Error saving Spelling Bee game:', error);
        toastManager.add(ERRORS.GAME.FAILED_TO_ADD, '');
      }
    },
  });

  const { form, errors, enhance, isTainted, reset } = superform;
  let otherLettersCount = $derived(getOtherLettersCount($form.type));
  // null until both letter inputs are complete; otherwise one entry per solution row.
  let solutionIssues = $derived.by((): Array<SpellingBeeSolutionIssue | null> | null => {
    const type = $form.type;
    const centralLetter = ($form.central_letter ?? '').toUpperCase();
    const otherLetters = ($form.other_letters ?? '').toUpperCase();
    if (centralLetter.length !== 1 || otherLetters.length !== getOtherLettersCount(type)) {
      return null;
    }

    return ($form.solutions ?? []).map(solution => {
      const word = solution.solution?.trim();
      if (!word) return null;
      return getSpellingBeeSolutionIssue(word, { type, centralLetter, otherLetters });
    });
  });
  let firstSolutionIssue = $derived(solutionIssues?.find(issue => issue !== null) ?? null);
  let solutionsFitWordcloud = $derived(solutionIssues !== null && firstSolutionIssue === null);

  const solutionProxy = arrayProxy(superform, 'solutions');
  const { values: solutionValues } = solutionProxy;
  let firstSolutionError = $derived.by(() => {
    if (hasCheckedWordcloudCompatibility && firstSolutionIssue) {
      return SPELLING_BEE_SOLUTION_ISSUE_MESSAGES[firstSolutionIssue];
    }
    return Array.isArray($errors.solutions)
      ? (((
          $errors.solutions.find(err => (err as Record<string, string | undefined>)?.solution) as
            | Record<string, string | undefined>
            | undefined
        )?.solution as string | undefined) ?? '')
      : '';
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

  function handleCompatibilityCheck() {
    hasCheckedWordcloudCompatibility = true;
  }

  const isSolutionIncompatible = (index: number) =>
    hasCheckedWordcloudCompatibility && !!solutionIssues?.[index];

  const sanitizeCsvCell = (value: string | number | undefined) => String(value ?? '').trim();

  function calculatePointsFromCsv(row: string[], solution: string) {
    const rawPoints = row[3];
    if (rawPoints !== undefined && rawPoints !== '') {
      const numericPoints = Number(rawPoints);
      if (Number.isFinite(numericPoints)) {
        return Math.min(12, Math.max(0, numericPoints));
      }
    }

    const rawLength = row[2];
    if (rawLength !== undefined && rawLength !== '') {
      const declaredLength = Number(rawLength);
      if (Number.isFinite(declaredLength) && declaredLength > 0) {
        return calculatePoints('X'.repeat(declaredLength));
      }
    }

    return calculatePoints(solution);
  }

  function hydrateFromCsv(rows: string[][]) {
    if (!rows.length) return;

    const normalizedRows = rows.map(row => row.map(cell => sanitizeCsvCell(cell)));
    const wordcloudFromCsv = (normalizedRows[0]?.[0] ?? '').toUpperCase();

    if (wordcloudFromCsv) {
      const { centralLetter, otherLetters } = splitWordcloud(wordcloudFromCsv);
      $form.type = 'regular';
      $form.central_letter = centralLetter;
      $form.other_letters = otherLetters;
    }

    const solutions = normalizedRows
      .map(row => {
        const solution = (row[1] ?? '').toUpperCase();
        return {
          solution,
          points: calculatePointsFromCsv(row, solution),
          solution_type: row[4] ?? '',
          solution_explanation: row[5] ?? '',
        };
      })
      .filter(solution => solution.solution.length > 0) as unknown as SpellingBeeSolutionItem;

    if (solutions.length > 0) {
      $form.solutions = solutions;
    }

    hasCheckedWordcloudCompatibility = true;
  }

  onMount(() => {
    if (game && isSpellingBeeGame(game)) {
      $form.name = game.name;
      $form.start_time = game.start_time.split('T')[0] ?? '';
      const { type, centralLetter, otherLetters } = getSpellingBeeLetters(game);
      $form.type = type;
      $form.central_letter = centralLetter;
      $form.other_letters = otherLetters;
    } else {
      // New games are always regular; minis are created by the mini-generator cronjob.
      $form.type = 'regular';
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
    } else if (beginning_option === 'csv' && resultsDataBody.length > 0) {
      hydrateFromCsv(resultsDataBody);
    }

    if ($form.solutions.length === 0) {
      addSolutionRow();
    }

    // Ensure points are in sync with typed solutions when loading a draft
    $form.solutions = $form.solutions.map(solution => ({
      ...solution,
      points: calculatePoints(solution.solution),
    })) as unknown as SpellingBeeSolutionItem;
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

  <!-- Type -->
  <input type="hidden" name="type" value={$form.type} />
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 gap-z-ds-4"
  >
    <span class="text-md font-bold">Typ:</span>
    <span class="border py-z-ds-8 px-z-ds-12 border-black text-md w-full sm:w-[250px]">
      {SPELLING_BEE_TYPE_LABELS[$form.type]} ({SPELLING_BEE_LETTER_COUNT[$form.type]} Buchstaben)
    </span>
  </div>

  <!-- Central letter -->
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 gap-z-ds-4"
  >
    <label class="text-md font-bold" for="central_letter">Hauptbuchstabe:</label>
    <div class="relative">
      <input
        id="central_letter"
        name="central_letter"
        type="text"
        placeholder="K"
        maxlength="1"
        class="border py-z-ds-8 px-z-ds-12 border-black text-md w-full sm:w-[250px]"
        bind:value={() => $form.central_letter, value => ($form.central_letter = value.toUpperCase())}
        aria-invalid={$errors.central_letter ? 'true' : undefined}
        onblur={handleCompatibilityCheck}
      />
      {#if $errors.central_letter}
        <div
          in:blur
          class="text-red-500 flex flex-wrap max-w-50 items-center gap-2 text-xs mt-2"
        >
          <IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
          <span>{$errors.central_letter}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Other letters -->
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 gap-z-ds-4"
  >
    <label class="text-md font-bold" for="other_letters">
      Weitere Buchstaben ({otherLettersCount} Zeichen):
    </label>
    <div class="relative">
      <input
        id="other_letters"
        name="other_letters"
        type="text"
        placeholder={$form.type === 'mini' ? 'PULSURT' : 'PULSURTE'}
        maxlength={otherLettersCount}
        class="border py-z-ds-8 px-z-ds-12 border-black text-md w-full sm:w-[250px]"
        bind:value={() => $form.other_letters, value => ($form.other_letters = value.toUpperCase())}
        aria-invalid={$errors.other_letters ? 'true' : undefined}
        onblur={handleCompatibilityCheck}
      />
      {#if $errors.other_letters}
        <div
          in:blur
          class="text-red-500 flex flex-wrap max-w-50 items-center gap-2 text-xs mt-2"
        >
          <IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
          <span>{$errors.other_letters}</span>
        </div>
      {/if}
    </div>
  </div>

  {#if $form.central_letter || $form.other_letters}
    <div class="w-full flex justify-end pb-z-ds-24 text-md tracking-widest">
      <span>Wortwolke:&nbsp;</span>
      <span>{$form.other_letters.slice(0, 4)}</span>
      <span class="font-bold underline">{$form.central_letter || '_'}</span>
      <span>{$form.other_letters.slice(4)}</span>
    </div>
  {/if}

  <!-- UI TABLE -->
  <h2 class="font-bold mt-16 mb-4">Lösungen</h2>

  <div class="relative overflow-x-auto max-h-100">
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
                maxlength={SPELLING_BEE_LETTER_COUNT[$form.type]}
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
