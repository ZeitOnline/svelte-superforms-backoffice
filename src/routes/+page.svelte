<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$components/Header.svelte';
	import NewGameView from '$views/NewGameView.svelte';
	import DashboardView from '$views/DashboardView.svelte';
	import type { View } from '$types';
	import EditGameView from '$views/EditGameView.svelte';
	import DeleteGameView from '$views/DeleteGameView.svelte';

	let { data } = $props<{ data: PageData }>();

	let view = $state<View>('dashboard');
	let selectedGameId = $state("");
</script>

<Header />

{#if view == 'new-game'}
	<NewGameView bind:view {data} />
{:else if view == 'dashboard'}
	<DashboardView bind:view bind:selectedGameId games={data.games} />
{:else if view == 'edit-game'}
	<EditGameView bind:view bind:selectedGameId games={data.games} />
{:else if view == 'delete-game'}
	<DeleteGameView bind:view bind:selectedGameId games={data.games} />
{:else}
	<DashboardView bind:view bind:selectedGameId games={data.games} />
{/if}
