<script lang="ts">
  import { DashboardView, DeleteGameView, EditGameView, NewGameView } from '$views';
  import { viewStateStore, type ViewStateStore } from '$stores/view-state-store.svelte';
  import type { GameType } from '$types';

  let { data } = $props();

  let store: ViewStateStore = viewStateStore();
  let gameName = $derived<GameType>(data.gameType);
</script>

{#if store.view == 'new-game'}
  <NewGameView {store} {data} {gameName} />
{:else if store.view == 'dashboard'}
  <DashboardView {store} games={data.games} {gameName} />
{:else if store.view == 'edit-game'}
  <EditGameView {store} {data} {gameName} />
{:else if store.view == 'delete-game'}
  <DeleteGameView {store} games={data.games} {gameName} />
{:else}
  <DashboardView {store} games={data.games} {gameName} />
{/if}
