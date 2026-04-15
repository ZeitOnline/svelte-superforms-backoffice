<script lang="ts">
  import { view } from '$stores/view-state-store.svelte';
  import type { BeginningOptions, CsvResultsRenderMode, DataProps, GameType, IconOption } from '$types';

  import GameTableWrapper from '$components/GameTableWrapper.svelte';
  import CSVGameFileUploader from '$components/CSVGameFileUploader.svelte';
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import ViewNavigation from '$components/ViewNavigation.svelte';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import WortigerBulkEditor from '$components/games/wortiger/WortigerBulkEditor.svelte';
  import { CONFIG_GAMES } from '$config/games.config';

  type Props = {
    data: DataProps;
  };

  let { data }: Props = $props();

  let resultsDataBody: string[][] = $state([]);
  let beginning_option: BeginningOptions = $state(null);

  function handleBackToDashboard() {
    view.updateView('dashboard');
  }

  const ACTIONS = [
    {
      name: 'scratch',
      label: 'Manuell hinzufügen',
      icon: 'update',
    },
    {
      name: 'csv',
      label: 'Über CSV hinzufügen',
      icon: 'upload',
    },
  ];

  const CSV_RESULTS_RENDER_MODE: Partial<Record<GameType, CsvResultsRenderMode>> = {
    eckchen: 'table',
    'spelling-bee': 'table',
    wortiger: 'bulk',
  };

  const canCSV = $derived(
    data.gameType && CONFIG_GAMES[data.gameType].creationModes.includes('csv'),
  );

  const csvResultsRenderMode = $derived(CSV_RESULTS_RENDER_MODE[data.gameType]);

</script>

<ViewWrapper>
  {#if beginning_option === null}
    <ViewNavigation
      viewName="Neues Spiel erstellen"
      mainAction={handleBackToDashboard}
      mainActionText="Zurück"
      gameName={data.gameType}
    />
    <div class="flex items-center justify-between gap-z-ds-8">
      {#each ACTIONS as action (action.name)}
          <!-- add hidden if action.name === 'csv' && !canCSV -->
        <button
          class={[
            'relative flex-1 z-ds-button z-ds-button-outline flex items-center min-h-50 text-sm',
            action.name === 'csv' && !canCSV ? 'hidden!' : '',
          ].join(' ')}
          onclick={() => {
            beginning_option = action.name as BeginningOptions;
          }}
        >
          <IconHandler
            iconName={action.icon as IconOption}
            extraClasses="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-48 h-48 opacity-5"
          />
          {action.label}
        </button>
      {/each}
    </div>
  {/if}

  {#if beginning_option === 'scratch'}
    <GameTableWrapper {data} bind:beginning_option bind:resultsDataBody gameName={data.gameType} />
  {/if}

  {#if beginning_option === 'csv'}
    {#if resultsDataBody.length > 0}
      {#if csvResultsRenderMode === 'table'}
        <GameTableWrapper
          {data}
          bind:beginning_option
          bind:resultsDataBody
          gameName={data.gameType}
        />
      {:else if csvResultsRenderMode === 'bulk'}
        <WortigerBulkEditor
          {data}
          bind:beginning_option
          bind:resultsDataBody
        />
      {/if}
    {:else}
      <CSVGameFileUploader
        {data}
        bind:beginning_option
        bind:resultsDataBody
        gameName={data.gameType}
      />
    {/if}
  {/if}
</ViewWrapper>
