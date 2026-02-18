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
    buildWortgeflechtPreviewFromRows,
    generateWortgeflechtLayout,
    parseWortgeflechtWords,
    toGridRows,
    type WortgeflechtWordPath,
  } from '$lib/games/wortgeflecht-generator';
  import {
    hasSameWordSetForWortgeflecht,
    normalizeWortgeflechtWordKey,
    normalizeWortgeflechtWordLines,
    normalizeWortgeflechtWordLineValue,
    validateWortgeflechtGenerationInput,
  } from '$lib/games/wortgeflecht-utils';
  import {
    saveWortgeflechtGameFormSchema,
    type SaveWortgeflechtGameFormSchema,
  } from '$schemas/wortgeflecht';
  import WordListEditor from './WordListEditor.svelte';
  import GridPreview from './GridPreview.svelte';

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

  const EMPTY_GRID = Array<string>(48).fill('\u00A0');
  const GRID_CELL_SIZE = 40;
  const PATH_COLORS = [
    { fill: '#f8d7da', stroke: '#d94f70' },
    { fill: '#ffe8b5', stroke: '#c99800' },
    { fill: '#cffafe', stroke: '#0f9fb0' },
    { fill: '#d1fae5', stroke: '#169c74' },
    { fill: '#e0e7ff', stroke: '#4f74d9' },
    { fill: '#fce7f3', stroke: '#cc5f97' },
    { fill: '#fae8ff', stroke: '#9660cc' },
    { fill: '#fef3c7', stroke: '#b08a07' },
  ];
  const DEBUG_WORDS = ['blumig', 'modrig', 'säuerlich', 'stechend', 'süßlich', 'muffig', 'ranzig'];
  const toastManager = getToastState();
  let rows = $state<WortgeflechtLetterRow[]>([]);
  let rowsError = $state<string | null>(null);
  let initialRowsSnapshot = $state('');
  let wordLines = $state<string[]>(['']);
  let generatorError = $state<string | null>(null);
  let invalidInputWords = $state<string[]>([]);
  let totalLetters = $state(0);
  let wordCount = $state(0);
  let isGenerating = $state(false);
  let generatedGrid = $state<string[]>(EMPTY_GRID);
  let generatedPaths = $state<WortgeflechtWordPath[]>([]);
  const generatedGridRows = $derived(toGridRows(generatedGrid));
  const coloredPaths = $derived(
    generatedPaths.map((path, index) => {
      const color = PATH_COLORS[index % PATH_COLORS.length];
      return {
        ...path,
        id: `path-${index}`,
        fill: color.fill,
        stroke: color.stroke,
        points: path.cells
          .map(cell => `${cell.x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2},${cell.y * GRID_CELL_SIZE + GRID_CELL_SIZE / 2}`)
          .join(' '),
        start: path.cells[0],
        end: path.cells[path.cells.length - 1],
      };
    }),
  );
  const wordStyleByWord = $derived(
    new Map(
      coloredPaths.map(path => [
        normalizeWortgeflechtWordKey(path.word),
        `border-left: 6px solid ${path.stroke}; background-color: ${path.fill};`,
      ]),
    ),
  );

  function getWordRowStyle(line: string) {
    const key = normalizeWortgeflechtWordKey(line);
    if (!key) return '';
    return wordStyleByWord.get(key) ?? '';
  }

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

        if (!hasSameWordSetForWortgeflecht({ wordLines, rows })) {
          rowsError = 'Bitte nach Änderungen an der Wortliste zuerst auf „Generieren“ klicken.';
          return;
        }

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
          description: (form.data.description ?? '').trim(),
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

  async function loadInitialRows() {
    if (game && isWortgeflechtGame(game)) {
      const existing = await fetchWortgeflechtLettersByGameId(game.game_id);
      rows = existing.length ? sortWortgeflechtRowsByWordThenLetter(existing) : [];
      const preview = buildWortgeflechtPreviewFromRows(rows);
      generatedGrid = preview.grid;
      generatedPaths = preview.paths;
      const orderedWords = preview.paths.map(path => path.word);
      wordLines = [...orderedWords, ''];
      return;
    }
    rows = [];
    wordLines = [''];
    generatedGrid = EMPTY_GRID.slice();
    generatedPaths = [];
  }

  function refreshWordStats() {
    const parsed = parseWortgeflechtWords(wordLines.join('\n'));
    wordCount = parsed.words.length;
    totalLetters = parsed.totalLetters;
    invalidInputWords = parsed.invalidWords;
  }

  function updateWordLine(index: number, value: string) {
    const next = wordLines.slice();
    next[index] = normalizeWortgeflechtWordLineValue(value);
    wordLines = normalizeWortgeflechtWordLines(next);
    refreshWordStats();
  }

  function removeWordLine(index: number) {
    if (wordLines.length === 1) {
      wordLines = [''];
      refreshWordStats();
      return;
    }
    const next = wordLines.slice();
    next.splice(index, 1);
    wordLines = normalizeWortgeflechtWordLines(next.length ? next : ['']);
    refreshWordStats();
  }

  function addWordLine() {
    const next = wordLines.slice();
    if (next[next.length - 1].trim() !== '') {
      next.push('');
    }
    wordLines = normalizeWortgeflechtWordLines(next);
  }

  function fillDebugWords() {
    wordLines = [...DEBUG_WORDS, ''];
    generatorError = null;
    rowsError = null;
    refreshWordStats();
  }

  async function generateGridFromWords() {
    refreshWordStats();
    generatorError = null;
    rowsError = null;

    const validation = validateWortgeflechtGenerationInput(wordLines);
    if (validation.error) {
      generatorError = validation.error;
      return;
    }

    isGenerating = true;
    try {
      const generated = generateWortgeflechtLayout({ words: validation.parsed.words, attempts: 50 });
      if (!generated) {
        generatorError =
          'Kein valides Gitter gefunden. Bitte Wortliste prüfen oder erneut auf "Generieren" klicken.';
        generatedGrid = EMPTY_GRID.slice();
        generatedPaths = [];
        rows = [];
        return;
      }
      generatedGrid = generated.grid;
      generatedPaths = generated.paths;
      rows = sortWortgeflechtRowsByWordThenLetter(generated.rows);
    } finally {
      isGenerating = false;
    }
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
      $form.description = game.description ?? '';
      $form.published_at = normalizeDate(game.published_at);
      $form.active = game.active ?? false;
    } else if (!$form.published_at) {
      await addCustomDate();
    }

    await loadInitialRows();
    wordLines = normalizeWortgeflechtWordLines(wordLines);
    refreshWordStats();
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
    class="w-full flex flex-col sm:flex-row sm:items-start justify-between pb-z-ds-24 relative gap-z-ds-4"
  >
    <label class="text-md font-bold mt-2" for="description">Beschreibung:</label>
    <div class="relative w-full sm:w-62.5">
      <textarea
        class="border py-z-ds-8 w-full px-z-ds-12 border-black text-md min-h-[96px]"
        name="description"
        id="description"
        placeholder="Kurzbeschreibung des Rätsels"
        bind:value={$form.description}
      ></textarea>
      {#if $errors.description}
        <div in:blur class="text-red-500 invalid flex items-center gap-z-ds-4 text-xs mt-2">
          <IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
          <span>{$errors.description}</span>
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

  <section class="grid grid-cols-1 xl:grid-cols-2 gap-z-ds-24 my-z-ds-24">
    <WordListEditor
      state={{
        wordLines,
        wordCount,
        totalLetters,
        invalidInputWords,
        generatorError,
        rowsError,
        isGenerating,
        hasGeneratedRows: rows.length > 0,
        getWordRowStyle,
      }}
      actions={{
        onFillDebugWords: fillDebugWords,
        onAddWordLine: addWordLine,
        onUpdateWordLine: updateWordLine,
        onRemoveWordLine: removeWordLine,
        onGenerateGrid: generateGridFromWords,
      }}
    />
    <GridPreview {coloredPaths} {generatedGridRows} />
  </section>

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
