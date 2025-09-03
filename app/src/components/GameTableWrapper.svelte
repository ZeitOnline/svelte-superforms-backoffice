<script lang="ts">
	import WortigerGameForm from './games/wortiger/WortigerGameForm.svelte';
	import EckchenGameForm from './games/eckchen/EckchenGameForm.svelte';
	import type { PageData } from '../routes/$types';
	import type { BeginningOptions, GameComplete, GameEckchenComplete, GameType, GameWortigerComplete } from '$types';
	import type { ViewStateStore } from '$stores/view-state-store.svelte';

	let {
		resultsDataBody = $bindable(),
		data,
		game,
		beginning_option = $bindable(),
		store,
        gameName
	}: {
		resultsDataBody: string[][];
		data: PageData;
		game?: GameComplete;
		beginning_option: BeginningOptions;
		store: ViewStateStore;
        gameName: GameType
	} = $props();

</script>

{#if gameName === 'wortiger'}
	<WortigerGameForm
		data={data as any}
		game={game as GameWortigerComplete}
		bind:beginning_option
		{store}
	/>
{:else if gameName === 'eckchen'}
	<EckchenGameForm
		bind:resultsDataBody
		data={data as any}
		game={game as GameEckchenComplete}
		bind:beginning_option
		{store}
	/>
{/if}
