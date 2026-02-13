<script lang="ts">
  import type { BeginningOptions, GameWortgeflechtComplete } from '$types';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { superForm, setError } from 'sveltekit-superforms';
  import { zodClient, type ZodObjectType } from 'sveltekit-superforms/adapters';
  import { onMount } from 'svelte';
  import { blur } from 'svelte/transition';
  import { SvelteDate } from 'svelte/reactivity';
  import ViewNavigation from '../../ViewNavigation.svelte';
  import IconHandler from '../../icons/IconHandler.svelte';
  import { APP_MESSAGES } from '$lib/app-messages';
  import { ERRORS } from '$lib/error-messages';
  import { view } from '$stores/view-state-store.svelte';
  import { getToastState } from '$lib/toast-state.svelte';
  import { getNextAvailableDateForGame } from '$lib/queries';
  import { isWortgeflechtGame } from '$utils';
  import {
    fetchWortgeflechtLettersByGameId,
    replaceWortgeflechtLettersByGameId,
    sortWortgeflechtRowsByWordThenLetter,
    type WortgeflechtLetterRow,
    upsertWortgeflechtGame,
  } from '$lib/games/wortgeflecht';
  import {
    saveWortgeflechtGameFormSchema,
    type SaveWortgeflechtGameFormSchema,
  } from '$schemas/wortgeflecht';

  type DataProps = {
    games: GameWortgeflechtComplete[];
    generateGameForm: SuperValidated<SaveWortgeflechtGameFormSchema>;
    saveGameForm: SuperValidated<SaveWortgeflechtGameFormSchema>;
  };

  type Props = {
    data: DataProps;
    game?: GameWortgeflechtComplete;
    beginning_option: BeginningOptions;
  };

  let { data, game, beginning_option = $bindable() }: Props = $props();

  const EMPTY_ROW: WortgeflechtLetterRow = { word: '', letter: '', cx: 0, cy: 0 };
  const toastManager = getToastState();
  let isSubmitted = $state(false);
  let rows = $state<WortgeflechtLetterRow[]>([]);
  let rowsError = $state<string | null>(null);
  let initialRowsSnapshot = $state('');

  // svelte-ignore state_referenced_locally
  const wortgeflechtForm = data.saveGameForm;

  const superform = superForm(wortgeflechtForm as SuperValidated<SaveWortgeflechtGameFormSchema>, {
    validators: zodClient(saveWortgeflechtGameFormSchema as unknown as ZodObjectType),
    SPA: true,
    resetForm: false,
    taintedMessage: true,
    async onUpdate({ form }) {
      try {
        rowsError = null;
        const normalizedRows = sortWortgeflechtRowsByWordThenLetter(normalizeRows(rows));
        const rowsValidationMsg = validateRows(normalizedRows);
        if (rowsValidationMsg) {
          rowsError = rowsValidationMsg;
          return;
        }

        if (beginning_option === 'edit' && game && isWortgeflechtGame(game)) {
          const currentDate = normalizeDate(game.published_at);
          const nextDate = normalizeDate(form.data.published_at);
          if (
            currentDate !== nextDate &&
            data.games.some(g => g.id !== game.id && normalizeDate(g.published_at) === nextDate)
          ) {
            setError(form, 'published_at', ERRORS.GAME.RELEASE_DATE.TAKEN);
            return;
          }
        } else if (
          data.games.some(g => normalizeDate(g.published_at) === normalizeDate(form.data.published_at))
        ) {
          setError(form, 'published_at', ERRORS.GAME.RELEASE_DATE.TAKEN);
          return;
        }

        if (!form.valid) return;

        const payload = {
          name: form.data.name.trim(),
          published_at: normalizeDate(form.data.published_at),
          active: form.data.active,
        };

        const savedGame = await upsertWortgeflechtGame({
          id: beginning_option === 'edit' && game ? game.id : undefined,
          data: payload,
        });

        await replaceWortgeflechtLettersByGameId({
          gameId: savedGame.game_id,
          rows: normalizedRows,
        });

        isSubmitted = true;
        toastManager.add(
          beginning_option === 'edit' ? APP_MESSAGES.GAME.EDITED_SUCCESS : APP_MESSAGES.GAME.ADDED_SUCCESS,
          '',
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Error saving Wortgeflecht game:', error);
        toastManager.add(ERRORS.GAME.FAILED_TO_ADD, '');
      }
    },
  });

  const { form, errors, enhance, isTainted, reset } = superform;

  const normalizeDate = (value: string) => (value ?? '').split('T')[0]?.split(' ')[0] ?? '';

  const normalizeRows = (input: WortgeflechtLetterRow[]) =>
    input.map(row => ({
      word: (row.word ?? '').trim(),
      letter: (row.letter ?? '').trim(),
      cx: Number(row.cx),
      cy: Number(row.cy),
    }));

  const validateRows = (input: WortgeflechtLetterRow[]): string | null => {
    if (input.length === 0) return 'Bitte mindestens eine Buchstaben-Zeile hinzufügen.';

    for (let i = 0; i < input.length; i++) {
      const row = input[i];
      if (!row.word) return `Zeile ${i + 1}: Wort fehlt.`;
      if (!row.letter || row.letter.length !== 1) return `Zeile ${i + 1}: Buchstabe muss genau 1 Zeichen sein.`;
      if (!Number.isInteger(row.cx) || row.cx < 0) return `Zeile ${i + 1}: X muss eine Zahl >= 0 sein.`;
      if (!Number.isInteger(row.cy) || row.cy < 0) return `Zeile ${i + 1}: Y muss eine Zahl >= 0 sein.`;
    }
    return null;
  };

  const snapshotRows = (input: WortgeflechtLetterRow[]) =>
    JSON.stringify(
      input.map(r => ({
        word: r.word,
        letter: r.letter,
        cx: Number(r.cx),
        cy: Number(r.cy),
      })),
    );

  function addRow() {
    rows.push({ ...EMPTY_ROW });
  }

  function removeRow(index: number) {
    if (rows.length === 1) return;
    if (!confirm(`Zeile ${index + 1} löschen?`)) return;
    rows.splice(index, 1);
  }

  async function loadInitialRows() {
    if (game && isWortgeflechtGame(game)) {
      const existing = await fetchWortgeflechtLettersByGameId(game.game_id);
      rows = existing.length ? sortWortgeflechtRowsByWordThenLetter(existing) : [{ ...EMPTY_ROW }];
      return;
    }
    rows = [{ ...EMPTY_ROW }];
  }

  const addCustomDate = async () => {
    try {
      const lastGameDate = await getNextAvailableDateForGame('wortgeflecht');
      const base = normalizeDate(lastGameDate);
      const d = new SvelteDate(base || new Date().toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
      $form.published_at = d.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error fetching next available date:', error);
    }
  };

  onMount(async () => {
    if (game && isWortgeflechtGame(game)) {
      $form.name = game.name;
      $form.published_at = normalizeDate(game.published_at);
      $form.active = game.active ?? false;
    } else if (!$form.published_at) {
      await addCustomDate();
    }

    await loadInitialRows();
    initialRowsSnapshot = snapshotRows(rows);
  });

  function resetAll() {
    reset();
    beginning_option = null;
    if (game) {
      view.updateSelectedGameId(-1);
      view.updateView('dashboard');
    }
  }

  function handleBackToDashboard() {
    const rowsChanged = snapshotRows(rows) !== initialRowsSnapshot;
    if (isTainted() || rowsChanged) {
      if (confirm(APP_MESSAGES.LEAVE_PAGE)) {
        resetAll();
      }
      return;
    }
    resetAll();
  }
</script>

{#if beginning_option === 'edit' && game}
  <ViewNavigation
    viewName="Wortgeflecht Rätsel bearbeiten"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="wortgeflecht"
  />
{:else}
  <ViewNavigation
    viewName="Neues Wortgeflecht Rätsel erstellen"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="wortgeflecht"
  />
{/if}

<form class="my-z-ds-24" method="POST" enctype="multipart/form-data" use:enhance>
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 relative gap-z-ds-4"
  >
    <label class="text-md font-bold" for="name">Name:</label>
    <div class="relative">
      <input
        class="border py-z-ds-8 w-full sm:w-62.5 px-z-ds-12 invalid:border-red-600 border-black text-md"
        name="name"
        id="name"
        type="text"
        placeholder="Name des Rätsels"
        aria-invalid={$errors.name ? 'true' : undefined}
        bind:value={$form.name}
      />
      {#if $errors.name}
        <div in:blur class="text-red-500 invalid flex items-center gap-z-ds-4 text-xs mt-2">
          <IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
          <span>{$errors.name}</span>
        </div>
      {/if}
    </div>
  </div>

  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 relative gap-z-ds-4"
  >
    <label class="text-md font-bold" for="published_at">Veröffentlichungsdatum:</label>
    <div class="relative">
      <input
        class="border py-z-ds-8 w-full sm:w-62.5 px-z-ds-12 border-black text-md"
        name="published_at"
        id="published_at"
        type="date"
        aria-invalid={$errors.published_at ? 'true' : undefined}
        bind:value={$form.published_at}
      />
      {#if $errors.published_at}
        <div in:blur class="text-red-500 invalid flex items-center gap-z-ds-4 text-xs mt-2">
          <IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
          <span>{$errors.published_at}</span>
        </div>
      {/if}
    </div>
  </div>

  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 relative gap-z-ds-4"
  >
    <label class="text-md font-bold" for="active">Aktiv:</label>
    <input
      class="accent-black border py-z-ds-8 px-z-ds-12 border-black text-md w-5 h-5"
      name="active"
      id="active"
      type="checkbox"
      bind:checked={$form.active}
    />
  </div>

  <div class="flex justify-between items-center w-full gap-z-ds-8 my-z-ds-24">
    <div class="font-bold">Buchstaben-Koordinaten</div>
    <button class="z-ds-button z-ds-button-outline" type="button" onclick={addRow}>+ Zeile</button>
  </div>

  {#if rowsError}
    <div class="border border-red-500 text-red-600 p-3 mb-4 flex items-center gap-2">
      <IconHandler iconName="error" extraClasses="w-4 h-4" />
      <span>{rowsError}</span>
    </div>
  {/if}

  <div class="relative overflow-x-auto">
    <table class="w-full text-sm text-left">
      <thead>
        <tr>
          <th class="px-2 py-2">Wort</th>
          <th class="px-2 py-2">Buchstabe</th>
          <th class="px-2 py-2">X</th>
          <th class="px-2 py-2">Y</th>
          <th class="px-2 py-2"></th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row, i (i)}
          <tr>
            <td class="px-2 py-1">
              <input class="border px-2 py-1 w-full" type="text" bind:value={row.word} />
            </td>
            <td class="px-2 py-1">
              <input class="border px-2 py-1 w-24" type="text" maxlength="1" bind:value={row.letter} />
            </td>
            <td class="px-2 py-1">
              <input class="border px-2 py-1 w-24" type="number" min="0" bind:value={row.cx} />
            </td>
            <td class="px-2 py-1">
              <input class="border px-2 py-1 w-24" type="number" min="0" bind:value={row.cy} />
            </td>
            <td class="px-2 py-1">
              <button
                class="z-ds-button z-ds-button-outline"
                type="button"
                title="Zeile löschen"
                onclick={() => removeRow(i)}
              >
                –
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="flex flex-row gap-4 items-center my-12 mx-auto w-full justify-center">
    <button class="z-ds-button" type="submit">
      {#if beginning_option === 'edit'}
        Veränderungen speichern
      {:else}
        Neues Rätsel erstellen
      {/if}
    </button>
  </div>
</form>

<style>
  table th,
  table td {
    border-bottom: 1px solid black;
  }
</style>
