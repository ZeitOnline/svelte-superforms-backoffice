<script lang="ts">
	import AddGameTable from '$components/AddGameTable.svelte';
	import GenerateGameTable from '$components/GenerateGameTable.svelte';
	import type { PageData } from '../routes/$types';
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { ViewStateStore } from '../stores/view-state-store.svelte';
	import ViewNavigation from '$components/ViewNavigation.svelte';

	let { data, store } = $props<{ data: PageData; store: ViewStateStore }>();

	let resultsDataBody: string[][] = $state([]);
	
	function handleBackToDashboard() {
		store.updateView("dashboard");
	}
</script>

<ViewWrapper>
	<ViewNavigation
		viewName="Create New Game"
		mainAction={handleBackToDashboard}
		mainActionText="Back"
	/>

	{#if resultsDataBody.length > 0}
		<AddGameTable {data} bind:resultsDataBody />
	{:else}
		<GenerateGameTable {data} bind:resultsDataBody />
	{/if}
</ViewWrapper>
