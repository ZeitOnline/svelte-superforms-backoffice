<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$components/Header.svelte';
	import NewGameView from '$views/NewGameView.svelte';
	import DashboardView from '$views/DashboardView.svelte';
	import type { View } from '$types';

	let { data } = $props<{ data: PageData }>();

	let view = $state<View>("dashboard");

</script>

<Header />

{#if view == "new-game"}
	<NewGameView bind:view={view} {data} />
{:else}
	<DashboardView bind:view={view} />
{/if}