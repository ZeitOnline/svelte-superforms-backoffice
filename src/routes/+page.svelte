<script lang="ts">
	import type { PageData } from './$types';
	import AddGameTable from '../components/AddGameTable.svelte';
	import GenerateGameTable from '../components/GenerateGameTable.svelte';
	import EckchenLogo from '../components/EckchenLogo.svelte';

	let { data } = $props<{ data: PageData }>();

	let resultsDataHeader: Array<string> = $state([]);
	let resultsDataBody: string[][] = $state([]);
</script>

<div class="flex flex-col items-center justify-between gap-3 my-12">
	<h1 class="text-3xl">Backoffice Eckchen</h1>
	<EckchenLogo />
</div>

{#if resultsDataHeader.length > 0 && resultsDataBody.length > 0}
	<AddGameTable {data} bind:resultsDataBody bind:resultsDataHeader />
{:else}
	<GenerateGameTable {data} bind:resultsDataBody bind:resultsDataHeader />
{/if}
