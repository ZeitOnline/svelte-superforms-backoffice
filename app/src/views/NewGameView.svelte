<script lang="ts">
  import type { ViewStateStore } from '../stores/view-state-store.svelte';
  import type { BeginningOptions, DataProps, GameType } from '$types';

  import GameTableWrapper from '$components/GameTableWrapper.svelte';
  import CSVGameFileUploader from '$components/CSVGameFileUploader.svelte';
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import ViewNavigation from '$components/ViewNavigation.svelte';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import WortigerBulkEditor from '$components/games/wortiger/WortigerBulkEditor.svelte';

  type Props = {
    data: DataProps;
    store: ViewStateStore;
    gameName: GameType;
  };
  let { data, store, gameName }: Props = $props();

  let resultsDataBody: string[][] = $state([]);
  let beginning_option: BeginningOptions = $state(null);

  function handleBackToDashboard() {
    store.updateView('dashboard');
  }
</script>

<ViewWrapper>
  {#if beginning_option === null}
    <ViewNavigation
      viewName="Neues Spiel erstellen"
      mainAction={handleBackToDashboard}
      mainActionText="Zurück"
      {gameName}
    />
    <div class="flex items-center justify-between gap-z-ds-8">
      <button
        class="relative flex-1 z-ds-button z-ds-button-outline flex items-center min-h-[200px] text-sm"
        onclick={() => {
          beginning_option = 'scratch';
        }}
      >
        <IconHandler
          iconName="update"
          extraClasses="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-48 h-48 opacity-5"
        />
        Manuell hinzufügen
      </button>

      <button
        class="relative flex-1 z-ds-button z-ds-button-outline flex items-center min-h-[200px] text-sm"
        onclick={() => {
          beginning_option = 'csv';
        }}
      >
        <IconHandler
          iconName="upload"
          extraClasses="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-48 h-48 opacity-5"
        />
        Über CSV hinzufügen
      </button>
    </div>
  {/if}

  {#if beginning_option === 'scratch'}
    <GameTableWrapper {store} {data} bind:beginning_option bind:resultsDataBody {gameName} />
  {/if}

  {#if beginning_option === 'csv'}
    {#if resultsDataBody.length > 0}
      {#if gameName === 'eckchen'}
	  	<!-- Eckchen loads the question from the csv into the table  -->
        <GameTableWrapper {store} {data} bind:beginning_option bind:resultsDataBody {gameName} />
      {:else if gameName === 'wortiger'}
	    <!-- Wortiger allows a bulk upload from the csv directly into the db -->
        <WortigerBulkEditor
          {data}
          {store}
          bind:beginning_option
          bind:resultsDataBody
          levels={[4, 5, 6, 7]}
        />
      {/if}
    {:else}
      <CSVGameFileUploader {data} bind:beginning_option bind:resultsDataBody {gameName} />
    {/if}
  {/if}
</ViewWrapper>
