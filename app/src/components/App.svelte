<script lang="ts">
	import ActivityLogsView from '$views/ActivityLogsView.svelte';
	import DashboardView from '$views/DashboardView.svelte';
	import DeleteGameView from '$views/DeleteGameView.svelte';
	import EditGameView from '$views/EditGameView.svelte';
	import NewGameView from '$views/NewGameView.svelte';
	import type { PageData } from '../routes/$types';
	import { viewStateStore, type ViewStateStore } from '../stores/view-state-store.svelte';
	import Header from './Header.svelte';

	let store: ViewStateStore = viewStateStore();
	let { data }: { data: PageData } = $props();
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
{:else if store.view == 'activity-logs'}
	<ActivityLogsView {store} />
{:else}
	<DashboardView {store} games={data.games} />
{/if}
