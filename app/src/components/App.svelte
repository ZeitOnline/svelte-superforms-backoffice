<script lang="ts">
  import type { DataProps } from '$types';
  import { DashboardView, DeleteGameView, EditGameView, NewGameView } from '$views';
  import { view } from '$stores/view-state-store.svelte';

  let { data }: { data: DataProps } = $props();
</script>

{#if view.current == 'new-game'}
  <NewGameView {data} />
{:else if view.current == 'edit-game'}
  <EditGameView {data} gameName={data.gameType} />
{:else if view.current == 'delete-game'}
  <DeleteGameView games={data.games} gameName={data.gameType} />
{:else}
  <DashboardView
    games={data.games}
    gameName={data.gameType}
    gamesPage={data.gamesPage}
    latestActiveGameIds={data.latestActiveGameIds}
  />
{/if}
