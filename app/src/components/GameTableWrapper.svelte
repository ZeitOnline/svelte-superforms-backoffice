<script lang="ts">
	import WortigerGameForm from './games/wortiger/WortigerGameForm.svelte';
	import EckchenGameForm from './games/eckchen/EckchenGameForm.svelte';
	import type { BeginningOptions, DataProps, GameComplete, GameEckchenComplete, GameSpellingBeeComplete, GameType, GameWortigerComplete } from '$types';
	import type { ViewStateStore } from '$stores/view-state-store.svelte';
    import SpellingBeeGameForm from './games/spelling-bee/SpellingBeeGameForm.svelte';

	type Props = {
		resultsDataBody: string[][];
		data: DataProps;
		game?: GameComplete;
		beginning_option: BeginningOptions;
		store: ViewStateStore;
		gameName: GameType;
	};

	let {
		resultsDataBody = $bindable(),
		data,
		game,
		beginning_option = $bindable(),
		store,
        gameName
	}: Props = $props();

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
		data={data as any}
		game={game as GameEckchenComplete}
		bind:beginning_option
		bind:resultsDataBody
		{store}
	/>
{:else if gameName === 'spelling-bee'}
	<SpellingBeeGameForm
		data={data as any}
		game={game as GameSpellingBeeComplete}
		bind:beginning_option
		bind:resultsDataBody
		{store}
	/>
{/if}
