<script lang="ts">
  import type { GameComplete, GameEckchenComplete, QuestionComplete } from '$types';
  import { superForm, arrayProxy, setError, formFieldProxy } from 'sveltekit-superforms';
  import type { SuperValidated } from 'sveltekit-superforms';
  import Separator from '../../Separator.svelte';
  import { blur } from 'svelte/transition';
  import IconHandler from '../../icons/IconHandler.svelte';
  import { cubicInOut } from 'svelte/easing';
  import { createGame, getNextAvailableDateForGame, updateGame } from '$lib/queries';
  import ViewNavigation from '../../ViewNavigation.svelte';
  import type { BeginningOptions } from '$types';
  import { zodClient, type ZodObjectType } from 'sveltekit-superforms/adapters';
  import { onMount } from 'svelte';
  import { view } from '$stores/view-state-store.svelte';
  import { APP_MESSAGES } from '$lib/app-messages';
  import { ERRORS } from '$lib/error-messages';
  import { getToastState } from '$lib/toast-state.svelte';
  import { type SaveEckchenGameFormSchema } from '$schemas/eckchen';
  import { isEckchenGame } from '$utils';
  import {
    createGameQuestions,
    DEFAULT_ECKCHEN_QUESTION,
    serializeRow,
    updateGameQuestions,
  } from '$lib/games/eckchen';
  import { CONFIG_GAMES } from '$config/games.config';
  import { SvelteDate } from 'svelte/reactivity';

  type DataProps = {
    games: GameEckchenComplete[];
    generateGameForm: SuperValidated<SaveEckchenGameFormSchema>;
    saveGameForm: SuperValidated<SaveEckchenGameFormSchema>;
  };

  type EckchenGameFormProps = {
    resultsDataBody: string[][];
    data: DataProps;
    game?: GameEckchenComplete;
    beginning_option: BeginningOptions;
  };

  let {
    resultsDataBody = $bindable(),
    data,
    game,
    beginning_option = $bindable(),
  }: EckchenGameFormProps = $props();

  const toastManager = getToastState();
  let isSubmitted = false;

  // Assert the correct form type for Eckchen
  const eckchenForm = data.saveGameForm as SuperValidated<SaveEckchenGameFormSchema>;
  const saveGameFormSchema = CONFIG_GAMES['eckchen'].schemas.saveGameFormSchema;

  const superform = superForm(eckchenForm, {
    validators: zodClient(saveGameFormSchema as unknown as ZodObjectType),
    SPA: true,
    resetForm: false,
    taintedMessage: isSubmitted ? false : true,
    async onUpdate({ form }) {
      try {
        // Build final data for Eckchen
        const finalData = {
          name: form.data.name,
          release_date: form.data.release_date,
          active: form.data.published,
        };

        // Validation logic
        if (beginning_option === 'edit' && game && isEckchenGame(game)) {
          // Check for unique constraints during edit
          if (game.name !== form.data.name) {
            if (data.games.some((g: any) => g.name === form.data.name)) {
              setError(form, 'name', ERRORS.GAME.NAME.TAKEN);
              return;
            }
          }
          if (game.release_date !== form.data.release_date) {
            if (data.games.some(g => g.release_date === form.data.release_date)) {
              setError(form, 'release_date', ERRORS.GAME.RELEASE_DATE.TAKEN);
              return;
            }
          }
        } else {
          // Check for unique constraints during creation
          if (data.games.some((g: any) => g.name === form.data.name)) {
            setError(form, 'name', ERRORS.GAME.NAME.TAKEN);
            return;
          }
          if (data.games.some(g => g.release_date === form.data.release_date)) {
            setError(form, 'release_date', ERRORS.GAME.RELEASE_DATE.TAKEN);
            return;
          }
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

          await updateGame({
            gameName: 'eckchen',
            gameId: game.id,
            data: finalEditedGame,
          });

          // Handle questions for Eckchen games
          const editedQuestions = form.data.questions as QuestionComplete[];
          editedQuestions.forEach((question, index) => {
            question.game_id = game.id;
            if (game.questions && game.questions[index]) {
              question.id = (game.questions[index] as any).id;
            }
          });
          await updateGameQuestions(editedQuestions);

          // Success
          isSubmitted = true;
          toastManager.add(APP_MESSAGES.GAME.EDITED_SUCCESS, '');

          setTimeout(() => {
            window.location.reload();
          }, 2500);
        } else {
          // Create new Eckchen game
          console.log('Creating Eckchen game:', finalData);
          const newGameArray = await createGame({
            gameName: 'eckchen',
            data: finalData as GameComplete,
          });
          const newGame = newGameArray[0] as GameEckchenComplete;

          // Handle questions for Eckchen games
          if (form.data.questions) {
            const gameWithQuestions = newGame;
            gameWithQuestions.questions = form.data.questions;
            if (gameWithQuestions.questions) {
              gameWithQuestions.questions.map((question: any) => {
                question.game_id = newGame.id;
                return question;
              });
              const resp = await createGameQuestions(gameWithQuestions);
              if (!resp.ok) {
                throw new Error('Failed to add questions');
              }
            }
          }
          // Success
          isSubmitted = true;
          toastManager.add(APP_MESSAGES.GAME.ADDED_SUCCESS, '');

          setTimeout(() => {
            window.location.reload();
          }, 2500);
        }
      } catch (error) {
        console.error('Error saving Eckchen game:', error);
        toastManager.add(ERRORS.GAME.FAILED_TO_ADD, '');
      }
    },
  });

  const { form, errors, enhance, isTainted, reset } = superform;

  // Question handling for Eckchen games
  const questionProxy = arrayProxy(superform, 'questions');
  const { values: questionValues, valueErrors: questionErrors } = questionProxy;

  // Function to add a new row
  function addRow() {
    let defaultRow = DEFAULT_ECKCHEN_QUESTION;
    resultsDataBody.push(defaultRow);
    const newQuestions = [...$form.questions, serializeRow(defaultRow)];
    $form.questions = newQuestions;
  }

  // Function to remove a row
  function removeRow(index: number) {
    if (
      confirm(`Bist du dir sicher, dass du die Reihe ${index + 1} löschen möchtest?`) &&
      $form.questions.length > 0
    ) {
      $form.questions.splice(index, 1);
      $form.questions = $form.questions;
    }
  }

  onMount(() => {
    // Initialize questions table
    if (resultsDataBody.length === 0) {
      addRow();
    }

    // Populate form with existing game data
    if (game && isEckchenGame(game)) {
      // Handle name field specially for Eckchen
      setTimeout(() => {
        const { value } = formFieldProxy(superform, 'name');
        value.set(game.name);
      }, 0);

      $form.release_date = game.release_date;
      $form.published = game.active || false;
    }

    // Initialize questions data
    if (!isSubmitted) {
      if (resultsDataBody.length > 0 && $form.questions.length === 0) {
        const newQuestions = [...$form.questions, ...resultsDataBody.map(row => serializeRow(row))];

        setTimeout(() => {
          $form.questions = newQuestions;
        }, 0);
      }
    }

    // Set default date if empty
    if ($form.release_date === '') {
      addCustomDate();
    }
  });

  const addCustomDate = async () => {
    try {
      const lastGameDate = await getNextAvailableDateForGame('eckchen');
      const lastGameDateFormat = new SvelteDate(lastGameDate);
      lastGameDateFormat.setDate(lastGameDateFormat.getDate() + 1);
      const nextGameDate = lastGameDateFormat.toISOString().split('T')[0];
      $form.release_date = nextGameDate;
    } catch (error) {
      console.error('Error fetching next available date:', error);
    }
  };

  function resetAll() {
    reset();
    resultsDataBody = [];
    beginning_option = null;
    if (game) {
      view.updateSelectedGameId(-1);
      view.updateView('dashboard');
    }
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
    viewName="Eckchen Spiel bearbeiten"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="eckchen"
  />
{:else}
  <ViewNavigation
    viewName="Neues Eckchen Spiel erstellen"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="eckchen"
  />
{/if}

<form class="my-z-ds-24" method="POST" enctype="multipart/form-data" use:enhance>
  <!-- Name Field -->
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 relative gap-z-ds-4"
  >
    <label class="text-md font-bold" for="name">Name des Spiels:</label>
    <div class="relative">
      <input
        class="border py-z-ds-8 w-full sm:w-[250px] px-z-ds-12 invalid:border-red-600 border-black text-md"
        name="name"
        id="name"
        type="text"
        placeholder="Geben Sie den Namen des Spiels ein"
        aria-invalid={$errors.name ? 'true' : undefined}
        bind:value={$form.name}
      />

      {#if $errors.name}
        <div
          in:blur
          class="text-red-500 invalid flex items-center gap-z-ds-4 text-xs sm:max-w-[250px] mt-2"
        >
          <IconHandler
            iconName="error"
            extraClasses="min-w-4 min-h-4 w-4 h-4 text-z-ds-color-accent-100"
          />
          <span class="text-xs">{$errors.name}</span>
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
        class="border py-z-ds-8 w-full sm:w-[250px] px-z-ds-12 border-black text-md"
        name="release_date"
        id="release_date"
        type="date"
        aria-invalid={$errors.release_date ? 'true' : undefined}
        bind:value={$form.release_date}
      />

      {#if $errors.release_date}
        <div
          in:blur
          class="text-red-500 invalid flex items-center gap-z-ds-4 text-xs sm:max-w-[250px] mt-2"
        >
          <IconHandler
            iconName="error"
            extraClasses="min-w-4 min-h-4 w-4 h-4 text-z-ds-color-accent-100"
          />
          <span class="text-xs">{$errors.release_date}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Published Field -->
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 relative gap-z-ds-4"
  >
    <label class="text-md font-bold" for="published">Veröffentlicht:</label>
    <div class="relative">
      <input
        class="accent-black border py-z-ds-8 px-z-ds-12 border-black text-md w-5 h-5"
        name="published"
        id="published"
        type="checkbox"
        bind:checked={$form.published}
      />
    </div>
  </div>

  <!-- Questions table -->
  <Separator />

  <div class="flex justify-between items-center w-full gap-z-ds-8 my-z-ds-24">
    <div class="font-bold text-nowrap">Fragen des Spiels</div>
  </div>

  <div class="relative overflow-x-auto overflow-y-visible">
    <table class="w-full text-sm text-left rtl:text-right text-gray-900">
      <thead>
        <tr>
          <th>Nr</th>
          <th>Frage</th>
          <th>Antwort</th>
          <th>X</th>
          <th>Y</th>
          <th>Dir.</th>
          <th>Beschreibung</th>
          {#if beginning_option !== 'edit' && !game}
            <th class="!border-0">
              <button
                title="Add new row"
                class="z-ds-button z-ds-button-outline font-light min-w-[30px]"
                type="button"
                onclick={addRow}>+</button
              >
            </th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each $questionValues as _, i (i)}
          <tr
            in:blur={{ duration: 300, delay: 0, easing: cubicInOut }}
            out:blur={{ duration: 300, delay: 0, easing: cubicInOut }}
          >
            <td>
              <input
                name="nr"
                type="number"
                class="w-full bg-transparent"
                aria-invalid={$questionErrors?.[i]?.nr ? 'true' : undefined}
                bind:value={$questionValues[i].nr}
              />
            </td>
            <td class="w-[220px]">
              <textarea
                name="question"
                class="w-full bg-transparent"
                aria-invalid={$questionErrors?.[i]?.question ? 'true' : undefined}
                bind:value={$questionValues[i].question}
              ></textarea>
            </td>
            <td class="w-[150px]">
              <textarea
                name="answer"
                class="w-full bg-transparent"
                aria-invalid={$questionErrors?.[i]?.answer ? 'true' : undefined}
                bind:value={$questionValues[i].answer}
              ></textarea>
            </td>
            <td>
              <input
                name="xc"
                type="number"
                class="w-full bg-transparent"
                aria-invalid={$questionErrors?.[i]?.xc ? 'true' : undefined}
                bind:value={$questionValues[i].xc}
              />
            </td>
            <td>
              <input
                name="yc"
                type="number"
                class="w-full bg-transparent"
                aria-invalid={$questionErrors?.[i]?.yc ? 'true' : undefined}
                bind:value={$questionValues[i].yc}
              />
            </td>
            <td>
              <input
                name="direction"
                class="w-full bg-transparent"
                aria-invalid={$questionErrors?.[i]?.direction ? 'true' : undefined}
                bind:value={$questionValues[i].direction}
              />
            </td>

            <td class="w-[220px]">
              <textarea
                name="description"
                class="w-full bg-transparent"
                aria-invalid={$questionErrors?.[i]?.description ? 'true' : undefined}
                bind:value={$questionValues[i].description}
              ></textarea>
            </td>

            {#if beginning_option !== 'edit' && !game}
              <td class="!border-0">
                <button
                  title="Remove this row"
                  class="z-ds-button min-w-[30px] z-ds-button-outline"
                  type="button"
                  onclick={() => removeRow(i)}
                >
                  -
                </button>
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if $errors.questions?._errors || $questionErrors.some((error: any) => error?.nr || error?.xc || error?.yc || error?.direction || error?.description || error?.question || error?.answer)}
    <div
      role="alert"
      aria-atomic="true"
      class="flex flex-col justify-center mx-auto mt-12 w-fit border-red-500 border text-red-500 p-4"
    >
      <div class="flex items-center gap-3 mb-3">
        <IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
        <span id="error-heading">Bitte, korrigieren Sie die Fehler hier:</span>
      </div>

      <ul
        aria-live="assertive"
        class="flex flex-col justify-center list-inside list-disc max-w-[300px]"
        aria-labelledby="error-heading"
      >
        {#each $questionErrors as _, i (i)}
          {#if $questionErrors?.[i]?.nr}
            <li class="px-2 text-sm">
              [R: {i + 1}] - {$questionErrors?.[i]?.nr}
            </li>
          {/if}
          {#if $questionErrors?.[i]?.xc}
            <li class="px-2 text-sm">
              [R: {i + 1}] - {$questionErrors?.[i]?.xc}
            </li>
          {/if}
          {#if $questionErrors?.[i]?.yc}
            <li class="px-2 text-sm">
              [R: {i + 1}] - {$questionErrors?.[i]?.yc}
            </li>
          {/if}
          {#if $questionErrors?.[i]?.direction}
            <li class="px-2 text-sm">
              [R: {i + 1}] - {$questionErrors?.[i]?.direction}
            </li>
          {/if}
          {#if $questionErrors?.[i]?.description}
            <li class="px-2 text-sm">
              [R: {i + 1}] - {$questionErrors?.[i]?.description}
            </li>
          {/if}
          {#if $questionErrors?.[i]?.question}
            <li class="px-2 text-sm">
              [R: {i + 1}] - {$questionErrors?.[i]?.question}
            </li>
          {/if}
          {#if $questionErrors?.[i]?.answer}
            <li class="px-2 text-sm">
              [R: {i + 1}] - {$questionErrors?.[i]?.answer}
            </li>
          {/if}
        {/each}

        {#if $errors.questions?._errors}
          <li class="px-2 text-sm">Errors: {$errors.questions._errors}</li>
        {/if}
      </ul>
    </div>
  {/if}

  <div class="flex flex-row gap-4 items-center my-12 mx-auto w-full justify-center">
    <button class="z-ds-button" type="submit">
      {#if beginning_option === 'edit'}
        Veränderungen speichern
      {:else}
        Neues Eckchen Spiel erstellen
      {/if}
    </button>
  </div>
</form>

<style>
  textarea {
    field-sizing: content;
  }
</style>
