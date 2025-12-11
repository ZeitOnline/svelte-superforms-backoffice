<script lang="ts">
  import { view } from '../stores/view-state-store.svelte';
  import type { BeginningOptions, DataProps } from '$types';

  import GameCreator from '$components/GameCreator.svelte';
  import CSVGameFileUploader from '$components/CSVGameFileUploader.svelte';
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import ViewNavigation from '$components/ViewNavigation.svelte';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import WortigerBulkEditor from '$components/games/wortiger/WortigerBulkEditor.svelte';

  type Props = {
    data: DataProps;
  };
  let { data }: Props = $props();

  let resultsDataBody: string[][] = $state([]);
  let beginning_option: BeginningOptions = $state(null);

  function handleBackToDashboard() {
    view.updateView('dashboard');
  }
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

      {#if data.gameType!== 'wortgeflecht'}
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
      {/if}
    </div>
  {/if}

  {#if beginning_option === 'scratch'}
    <GameCreator {data} bind:beginning_option bind:resultsDataBody gameName={data.gameType} />
  {/if}

  {#if beginning_option === 'csv'}
    {#if resultsDataBody.length > 0}
      {#if data.gameType === 'eckchen' || data.gameType === 'spelling-bee'}
        <!-- Eckchen loads the question from the csv into the table  -->
        <GameCreator
          {data}
          bind:beginning_option
          bind:resultsDataBody
          gameName={data.gameType}
        />
      {:else if data.gameType === 'wortiger'}
        <!-- Wortiger allows a bulk upload from the csv directly into the db -->
        <WortigerBulkEditor
          {data}
          bind:beginning_option
          bind:resultsDataBody
          levels={[4, 5, 6, 7]}
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
