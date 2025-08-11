<script lang="ts">
	import type { PageData } from '../routes/$types';
	import { DashboardView, DeleteGameView, EditGameView, NewGameView }  from '$views';
	import { viewStateStore, type ViewStateStore } from '$stores/view-state-store.svelte';
	import Header from './Header.svelte';

	let store: ViewStateStore = viewStateStore();
	let { data }: { data: PageData } = $props();

	// console.log('App.svelte', { data, store });
</script>

<Header />

{#if store.view == 'new-game'}
	<NewGameView {store} {data} />
{:else if store.view == 'dashboard'}
	<DashboardView {store} games={data.games} />
{:else if store.view == 'edit-game'}
	<EditGameView {store} {data} />
{:else if store.view == 'delete-game'}
	<DeleteGameView {store} games={data.games} />
{:else}
	<DashboardView {store} games={data.games} />
{/if}
