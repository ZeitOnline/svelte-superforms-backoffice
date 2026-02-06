<script lang="ts">
  import type { BeginningOptions, DataProps, GameType } from '$types';
  import { superForm, setError } from 'sveltekit-superforms';
  import Papa from 'papaparse';
  import { dev } from '$app/environment';
  import ViewNavigation from './ViewNavigation.svelte';
  import { zodClient, type ZodObjectType } from 'sveltekit-superforms/adapters';
  import { ERRORS } from '$lib/error-messages';
  import { APP_MESSAGES } from '$lib/app-messages';
  import { CONFIG_GAMES } from '$config/games.config';
  import { canBeBuiltFromWordcloud } from '$schemas/spelling-bee';

  function parseCsv(file: File): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      Papa.parse<string[]>(file, {
        skipEmptyLines: true,
        delimiter: '', // auto-detect
        worker: false, // keep on main thread to avoid any reactivity weirdness
        complete: results => {
          if (results.errors && results.errors.length) {
            // bubble first parse error (you can aggregate if you prefer)
            return reject(new Error(results.errors[0].message));
          }
          resolve(results.data as unknown as string[][]);
        },
        error: err => reject(err),
      });
    });
  }

  let {
    gameName,
    resultsDataBody = $bindable(),
    data,
    beginning_option = $bindable(),
  }: {
    gameName: GameType;
    resultsDataBody: string[][];
    data: DataProps;
    beginning_option: BeginningOptions;
  } = $props();

  let isDragging = $state(false);
  let fileInput = $state<HTMLInputElement | null>(null);

  const generateGameSchema = $derived(
    CONFIG_GAMES[gameName].schemas.generateGameSchema as unknown as ZodObjectType,
  );

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, isTainted, reset } = superForm(data.generateGameForm, {
    resetForm: false,
    validators: zodClient(generateGameSchema),
    SPA: true,
    taintedMessage: true,
    invalidateAll: false,
    onChange(event) {
      if (dev) {
        if (event.target) {
          // Form input event
          console.log(event.path, 'was changed with', event.target, 'in form', event.formElement);
        } else {
          // Programmatic event
          console.log('Fields updated:', event.paths);
        }
      }

      if ($form.csv) {
        isDragging = false;
      }
    },
    async onUpdate({ form }) {
      if (!form.valid) return;

      try {
        const rows = await parseCsv(form.data.csv);

        if (!rows?.length) {
          setError(form, 'csv', ERRORS.CSV.EMPTY);
          return;
        }

        const header = (rows[0] ?? []).map(h => (h ?? '').trim());
        const body = rows.slice(1).map(r => r.map(c => (c ?? '').trim()));

        const fieldSize = header.length;

        if (gameName === 'eckchen') {
          if (fieldSize !== 7) {
            setError(form, 'csv', ERRORS.ECKCHEN.CSV.NUMBER_OF_COLUMNS);
            return;
          }
        } else if (gameName === 'wortiger') {
          if (fieldSize !== 5) {
            setError(form, 'csv', ERRORS.WORTIGER.CSV.NUMBER_OF_COLUMNS);
            return;
          }
        } else if (gameName === 'spelling-bee') {
          if (fieldSize !== 6) {
            setError(form, 'csv', ERRORS.SPELLING_BEE.CSV.NUMBER_OF_COLUMNS);
            return;
          }
        }

        // ensure there’s at least one non-empty row
        const cleaned = body.filter(row => !row.every(cell => cell === '' || cell === '\x1A'));
        if (cleaned.length === 0) {
          setError(form, 'csv', ERRORS.CSV.EMPTY);
          return;
        }

        if (gameName === 'spelling-bee') {
          const wordclouds = cleaned
            .map(row => (row[0] ?? '').trim().toUpperCase())
            .filter(Boolean);
          const [wordcloud] = wordclouds;

          if (!wordcloud || wordcloud.length !== 9) {
            setError(form, 'csv', ERRORS.SPELLING_BEE.CSV.WORDCLOUD_INVALID);
            return;
          }

          if (wordclouds.some(value => value !== wordcloud)) {
            setError(form, 'csv', ERRORS.SPELLING_BEE.CSV.WORDCLOUD_MISMATCH);
            return;
          }

          const solutions = cleaned.map(row => (row[1] ?? '').trim()).filter(Boolean);
          if (solutions.length === 0) {
            setError(form, 'csv', ERRORS.SPELLING_BEE.CSV.NO_SOLUTIONS);
            return;
          }

          const hasIncompatibleSolution = solutions.some(
            solution => !canBeBuiltFromWordcloud(solution, wordcloud),
          );
          if (hasIncompatibleSolution) {
            setError(form, 'csv', ERRORS.SPELLING_BEE.CSV.SOLUTION_INCOMPATIBLE);
            return;
          }
        }

        resultsDataBody = [];
        resultsDataBody.push(...cleaned);
      } catch (error) {
        console.error('CSV parse error:', error);
        setError(form, 'csv', ERRORS.CSV.PARSE);
      }
    },
  });

  function handleGlobalDrop(event: DragEvent) {
    event.preventDefault();
    if (isDragging) {
      isDragging = false;

      const file = event.dataTransfer?.files?.[0];

      if (file) {
        $form.csv = file;
        if (fileInput) fileInput.files = event.dataTransfer?.files;
      }
    }
  }

  $effect(() => {
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleGlobalDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  });

  function handleDragEnter(event: DragEvent) {
    isDragging = true;
    event.preventDefault();
  }

  function handleDragLeave(event: DragEvent) {
    isDragging = false;
    event.preventDefault();
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function resetAll(): void {
    reset();
    resultsDataBody = [];
    beginning_option = null;
  }

  function handleBackToDashboard(): void {
    if (isTainted()) {
      if (confirm(APP_MESSAGES.LEAVE_PAGE)) {
        console.log('user decided to leave GenerateGameTable');
        resetAll();
      } else {
        console.log('user decided to stay');
      }
    } else {
      resetAll();
    }
  }
</script>

<ViewNavigation
  viewName="Neues Spiel erstellen"
  mainAction={handleBackToDashboard}
  mainActionText="Zurück"
  {gameName}
/>

<form
  class="flex flex-col w-full items-center my-12"
  method="POST"
  enctype="multipart/form-data"
  action="?/generateGame"
  use:enhance
>
  <div class="group flex flex-col items-center w-fit">
    <input
      ondragenter={handleDragEnter}
      ondragleave={handleDragLeave}
      ondragover={handleDragOver}
      class="peer opacity-0 pointer-events-auto text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 p-4"
      type="file"
      name="csv"
      accept=".csv"
      oninput={e => ($form.csv = e.currentTarget.files?.item(0) as File)}
    />
    <label
      class="text-sm w-fit -mt-14 flex flex-col justify-center text-center items-center font-bold gap-2 peer-focus:outline-offset-2 peer-focus:outline-2 peer-focus:outline-blue-500"
      for="csv"
      aria-live="polite"
      aria-atomic="true"
      role="status"
      aria-dropeffect={isDragging ? 'copy' : 'none'}
    >
      <span
        class={`${isDragging ? 'bg-gray-200' : 'bg-white'} ${$form.csv ? 'bg-white' : ''} border border-black px-5 py-4 group-hover:bg-gray-200 group-focus:bg-gray-200`}
      >
        {#if isDragging}
          <span>Fast geschafft!</span>
        {:else if $form.csv}
          <p>Ausgewählte Datei: {$form.csv.name}</p>
        {:else}
          <span>Eine CSV-Datei hierhin ziehen. Max 100kb.</span>
        {/if}
      </span>
    </label>
  </div>

  {#if $errors.csv}
    <span class="border-red-500 border text-red-500 my-5 px-2 py-1 text-sm">
      Fehler: {$errors.csv}
    </span>
  {/if}

  {#if $form.csv}
    <div class="flex flex-col items-center my-12 mx-auto w-full justify-center">
      <button class="z-ds-button">Absenden</button>
    </div>
  {/if}
</form>
