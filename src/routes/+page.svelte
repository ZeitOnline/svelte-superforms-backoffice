<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$components/Header.svelte';
	import NewGameView from '$views/NewGameView.svelte';
	import DashboardView from '$views/DashboardView.svelte';
	import EditGameView from '$views/EditGameView.svelte';
	import DeleteGameView from '$views/DeleteGameView.svelte';
	import {viewStateStore, type ViewStateStore} from '../stores/view-state-store.svelte';

	let { data } = $props<{ data: PageData }>();

	let store: ViewStateStore = viewStateStore("dashboard")
</script>

<Header />

{#if store.view == 'new-game'}
	<NewGameView {store} {data} />
{:else if store.view == 'dashboard'}
	<DashboardView {store} games={data.games} />
{:else if store.view == 'edit-game'}
	<EditGameView {store} games={data.games} />
{:else if store.view == 'delete-game'}
	<DeleteGameView {store} games={data.games} />
{:else}
	<DashboardView {store} games={data.games} />
{/if}
