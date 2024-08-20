<script lang="ts">
	import type { PageData } from './$types';
	import Header from '../components/Header.svelte';
	import NewGameView from '../views/NewGameView.svelte';
	import DashboardView from '../views/DashboardView.svelte';

	let { data } = $props<{ data: PageData }>();

	let isNewGame = $state(false);

</script>

<Header />

{#if isNewGame}
	<NewGameView bind:isNewGame={isNewGame} {data} />
{:else}
	<DashboardView bind:isNewGame={isNewGame} />
{/if}