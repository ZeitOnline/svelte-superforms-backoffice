<script lang="ts">
  import type { GameComplete, GameSpellingBeeComplete } from '$types';
  import { superForm, setError } from 'sveltekit-superforms';
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

  type DataProps = {
    games: GameSpellingBeeComplete[];
    generateGameForm: SuperValidated<any>;
    saveGameForm: SuperValidated<any>;
  };

  type SpellingBeeGameFormProps = {
    data: DataProps;
    game?: GameSpellingBeeComplete;
    beginning_option: BeginningOptions;
    resultsDataBody?: string[][];
  };

  let { data, game, beginning_option = $bindable(), resultsDataBody = $bindable() }: SpellingBeeGameFormProps = $props();

  const toastManager = getToastState();
  let isSubmitted = false;

  const saveGameFormSchema = CONFIG_GAMES['spelling-bee'].schemas.saveGameFormSchema;

  const superform = superForm(data.saveGameForm, {
    validators: zodClient(saveGameFormSchema as unknown as ZodObjectType),
    SPA: true,
    resetForm: false,
    taintedMessage: isSubmitted ? false : true,
    async onUpdate({ form }) {
      try {
        const finalData = {
          name: form.data.name,
          start_time: form.data.start_time,
          wordcloud: form.data.wordcloud
        };

        // Validation logic
        if (beginning_option === 'edit' && game && isSpellingBeeGame(game)) {
          if (game.name !== form.data.name) {
            if (data.games.some((g) => g.name === form.data.name)) {
              setError(form, 'name', ERRORS.GAME.NAME.TAKEN);
              return;
            }
          }
          if (game.start_time !== form.data.start_time) {
            if (data.games.some((g) => g.start_time === form.data.start_time)) {
              setError(form, 'start_time', ERRORS.GAME.RELEASE_DATE.TAKEN);
              return;
            }
          }
          if (game.wordcloud !== form.data.wordcloud) {
            if (data.games.some((g) => g.wordcloud === form.data.wordcloud)) {
              setError(form, 'wordcloud', 'Diese Wortwolke existiert bereits.');
              return;
            }
          }
        } else {
          // Create validation
          if (data.games.some((g) => g.name === form.data.name)) {
            setError(form, 'name', ERRORS.GAME.NAME.TAKEN);
            return;
          }
          if (data.games.some((g) => g.start_time === form.data.start_time)) {
            setError(form, 'start_time', ERRORS.GAME.RELEASE_DATE.TAKEN);
            return;
          }
          if (data.games.some((g) => g.wordcloud === form.data.wordcloud)) {
            setError(form, 'wordcloud', 'Diese Wortwolke existiert bereits.');
            return;
          }
        }

        if (!form.valid) return;

        if (beginning_option !== "edit") {
          await createGame({ gameName: 'spelling-bee', data: finalData as GameComplete });
        } else {
          await updateGame({ gameName: 'spelling-bee', gameId: game!.id, data: finalData as GameComplete });
        }

        isSubmitted = true;
        toastManager.add(APP_MESSAGES.GAME.ADDED_SUCCESS, '');

        setTimeout(() => window.location.reload(), 2500);
      } catch (error) {
        console.error('Error saving Spelling Bee game:', error);
        toastManager.add(ERRORS.GAME.FAILED_TO_ADD, '');
      }
    }
  });

  const { form, errors, enhance, isTainted, reset } = superform;

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
        console.log('okay')
        resetAll();
      }
    } else resetAll();
  }
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
  <div class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 gap-z-ds-4">
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
  <div class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 gap-z-ds-4">
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
  <div class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 gap-z-ds-4">
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
      />
      {#if $errors.wordcloud}
        <div in:blur class="text-red-500 flex flex-wrap max-w-[200px] items-center gap-2 text-xs mt-2">
          <IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
          <span>{$errors.wordcloud}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="flex justify-center mt-12">
    <button class="z-ds-button" type="submit">
      {#if beginning_option === 'edit'}
        Veränderungen speichern
      {:else}
        Neues Spelling Bee Spiel erstellen
      {/if}
    </button>
  </div>
</form>
