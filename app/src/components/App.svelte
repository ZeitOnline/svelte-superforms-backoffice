<script lang="ts">
  import { DashboardView, DeleteGameView, EditGameView, NewGameView } from '$views';
  import { viewStateStore, type ViewStateStore } from '$stores/view-state-store.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
    import type { GameType } from '$types';

  let store: ViewStateStore = viewStateStore();
  let gameName = $state<GameType>();

  onMount(() => {
    if (page.route.id === '/eckchen') {
      gameName = 'eckchen';
    } else if (page.route.id === '/wortiger') {
      gameName = 'wortiger';
    }
  });

  let { data } = $props();
</script>

{#if !gameName}
  <p>Loading...</p>
{:else if store.view == 'new-game'}
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
