<script lang="ts">
  import type { DataProps } from '$types';
  import { DashboardView, DeleteGameView, EditGameView, NewGameView } from '$views';
  import { viewStateStore, type ViewStateStore } from '$stores/view-state-store.svelte';

  let { data }: { data: DataProps } = $props();

  let store: ViewStateStore = viewStateStore();
</script>

{#if store.view == 'new-game'}
  <NewGameView {store} {data} />
{:else if store.view == 'dashboard'}
  <DashboardView {store} games={data.games} gameName={data.gameType} />
{:else if store.view == 'edit-game'}
  <EditGameView {store} {data} gameName={data.gameType} />
{:else if store.view == 'delete-game'}
  <DeleteGameView {store} games={data.games} gameName={data.gameType} />
{:else}
  <DashboardView {store} games={data.games} gameName={data.gameType} />
{/if}
