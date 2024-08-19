<script lang="ts">
	import type { PageData } from './$types';
	import AddGameTable from '../components/AddGameTable.svelte';
	import GenerateGameTable from '../components/GenerateGameTable.svelte';

	let { data } = $props<{ data: PageData }>();

	let resultsDataHeader: Array<string> = $state([]);
	let resultsDataBody: Array<string> = $state([]);
	
</script>

<GenerateGameTable {data} bind:resultsDataBody={resultsDataBody} bind:resultsDataHeader={resultsDataHeader} />

<AddGameTable {data} bind:resultsDataBody={resultsDataBody} bind:resultsDataHeader={resultsDataHeader} />