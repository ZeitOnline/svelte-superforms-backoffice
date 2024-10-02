<script lang="ts">
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { BeginningOptions, GameComplete, QuestionComplete } from '$types';
	import { type ViewStateStore } from '../stores/view-state-store.svelte';
	import GameTable from '$components/GameTable.svelte';
	import type { PageData } from '../routes/$types';
	import { getAllQuestionsByGameId } from '$lib/queries';
	import { onMount } from 'svelte';

	let { store, data }: { store: ViewStateStore; data: PageData } = $props();

	let resultsDataBody: string[][] = $state([]);
	let beginning_option: BeginningOptions = $state('edit');

	const game = data.games.find((game: GameComplete) => game.id === store.selectedGameId);

	async function populateResultBodyForGame(id: number) {
		const questions = await getAllQuestionsByGameId(id);
		game.questions = questions;
		resultsDataBody = questions.map((question: QuestionComplete) => {
			return [
				String(question.nr),
				String(question.question),
				String(question.answer),
				String(question.xc),
				String(question.yc),
				String(question.direction),
				String(question.description)
			];
		});
	}

	onMount(async () => {
		if (!game) {
			store.updateSelectedGameId(-1);
			store.updateView('dashboard');
		} else {
			await populateResultBodyForGame(game.id);
		}
	});
</script>

<ViewWrapper>
	{#if resultsDataBody.length > 0}
		<GameTable {data} {game} {store} bind:beginning_option bind:resultsDataBody />
	{/if}
</ViewWrapper>
