<script lang="ts">
  import { enhance } from '$app/forms';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import ViewNavigation from '$components/ViewNavigation.svelte';
  import { checkPuzzle, type Puzzle } from '$lib/games/wortgeflecht';
  import { view } from '$stores/view-state-store.svelte';
  import type { BeginningOptions, DataProps, GameComplete } from '$types';

  let {
    beginning_option = $bindable(),
    data,
    game,
  }: {
    beginning_option: BeginningOptions;
    data: DataProps;
    game?: GameComplete;
  } = $props();

  const INITIAL_DEFAULT_PUZZLE: Puzzle = {
    id: 123455,
    theme: 'Mein erstes Wortgeflecht',
    words: ['Beispiel', 'Wort', 'Geflecht', 'Svelte', 'Backoffice', 'Zeit', 'Autor', 'Spiel'],
    grid: Array(48).fill('.'),
    frozen: false,
    inProd: false,
    notes: '',
    publishDate: null,
    explainer: '',
    valid: true,
    locations: [],
  };
  let puzzle: Puzzle = $state(INITIAL_DEFAULT_PUZZLE);
  let words = $state(puzzle.words);
  let highlightLocations: number[][] | boolean = $state(false);

  let wordsStr = $derived(
    puzzle.words
      .filter(e => e != '')
      .map(e => e.trim())
      .join('|'),
  );
  let gridStr = $derived(puzzle.grid.join(''));

  let bannerOpen = $state(false),
    bannerMsg = $state('Nur ein Test');

  let imExportOpen = $state(false);

  let alertDialog = $state({
    open: false,
    title: '',
    description: '',
  });

  const showAlert = (title: string, description: string) => {
    alertDialog = { open: true, title, description };
  };

  const showBanner = (msg: string) => {
    bannerMsg = msg;
    bannerOpen = true;
  };

  const loadGrid = () => {
    const el = document.getElementById('gridStr') as HTMLInputElement;
    let str = el.value;
    if (str.length === 48) {
      puzzle.grid = Array.from(str);
      checkPuzzle(puzzle);
    } else {
      alert('Grid must have 48 characters!');
    }
  };

  const loadWords = () => {
    const el = document.getElementById('wordStr') as HTMLInputElement;
    let str = el.value;
    puzzle.words = str.split('|');
    checkPuzzle(puzzle);
  };

  function handleBackToDashboard() {
    beginning_option = null;
    console.log('Resetting selection...');
    if (game) {
      view.updateSelectedGameId(-1);
      view.updateView('dashboard');
    }
  }
</script>

{#if beginning_option === 'edit' && game}
  <ViewNavigation
    viewName="Wortgeflecht Spiel bearbeiten"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="wortgeflecht"
  />
{:else}
  <ViewNavigation
    viewName="Neues Wortgeflecht Spiel erstellen"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="wortgeflecht"
  />
{/if}

<form class="my-z-ds-24" method="POST" enctype="multipart/form-data" use:enhance>
  <!-- Name Field -->
  <div
    class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 relative gap-z-ds-4"
  >
    <label class="text-md font-bold" for="name">Name des Ratzels:</label>
    <div class="relative">
      <input
        class="border py-z-ds-8 w-full sm:w-[250px] px-z-ds-12 invalid:border-red-600 border-black text-md"
        name="name"
        id="name"
        type="text"
        placeholder="Geben Sie den Namen des Spiels ein"

      />

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
      />

    </div>
  </div>
</form>

WIP
