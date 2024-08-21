<script lang="ts">
	import AddGameTable from '$components/AddGameTable.svelte';
	import GenerateGameTable from '$components/GenerateGameTable.svelte';
	import type { PageData } from '../routes/$types';
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { ViewStateStore } from '../stores/view-state-store.svelte';

	let { data, store } = $props<{ data: PageData; store: ViewStateStore }>();

	let resultsDataHeader: Array<string> = $state([]);
	let resultsDataBody: string[][] = $state([]);

	function handleBackToDashboard() {
		store.updateView("dashboard");
	}
</script>

<ViewWrapper>
	<nav class="flex justify-between w-full items-center mb-z-ds-12">
		<div class="flex flex-col">
			<span class="font-bold">Eckchen</span>
			<span class="text-z-ds-general-black-80 text-xs">Neues Spiel erstellen</span>
		</div>

		<button class="z-ds-button" onclick={handleBackToDashboard}> Zurück </button>
	</nav>

	{#if resultsDataHeader.length > 0 && resultsDataBody.length > 0}
		<AddGameTable {data} bind:resultsDataBody bind:resultsDataHeader />
	{:else}
		<GenerateGameTable {data} bind:resultsDataBody bind:resultsDataHeader />
	{/if}
</ViewWrapper>
