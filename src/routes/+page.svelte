<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$components/Header.svelte';
	import NewGameView from '$views/NewGameView.svelte';
	import DashboardView from '$views/DashboardView.svelte';
	import type { View } from '$types';
	import EditGameView from '$views/EditGameView.svelte';

	let { data } = $props<{ data: PageData }>();

	let view = $state<View>("dashboard");

</script>

<Header />

{#if view == "new-game"}
	<NewGameView bind:view={view} {data} />
{:else if view == "dashboard"}
	<DashboardView bind:view={view} {data} />
{:else if view == "edit-game"}
	<EditGameView bind:view={view} {data} />
{:else if view == "delete-game"}
	<p>Delete game</p>
{:else}
	<p>404</p>
{/if}