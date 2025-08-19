<script lang="ts">
	import GameTableWrapper from '$components/GameTableWrapper.svelte';
	import GenerateGameTable from '$components/GenerateGameTable.svelte';
	import type { PageData } from '../routes/$types';
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { ViewStateStore } from '../stores/view-state-store.svelte';
	import ViewNavigation from '$components/ViewNavigation.svelte';
	import IconHandler from '$components/icons/IconHandler.svelte';
	import type { BeginningOptions, GameType } from '$types';

	type Props = {
		data: PageData;
		store: ViewStateStore;
		gameName: GameType;
	};
	let { data, store, gameName }: Props = $props();

	let resultsDataBody: string[][] = $state([]);
	let beginning_option: BeginningOptions = $state(null);

	function handleBackToDashboard() {
		store.updateView('dashboard');
	}
</script>

<ViewWrapper>
	{#if beginning_option === null}
		<ViewNavigation
			viewName="Neues Spiel erstellen"
			mainAction={handleBackToDashboard}
			mainActionText="Zurück"
			{gameName}
		/>
		<div class="flex items-center justify-between gap-z-ds-8">
			<button
				class="relative flex-1 z-ds-button z-ds-button-outline flex items-center min-h-[200px] text-sm"
				onclick={() => {
					beginning_option = 'scratch';
				}}
			>
				<IconHandler
					iconName="update"
					extraClasses="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-48 h-48 opacity-5"
				/>
				Manuell hinzufügen
			</button>

			<button
				class="relative flex-1 z-ds-button z-ds-button-outline flex items-center min-h-[200px] text-sm"
				onclick={() => {
					beginning_option = 'csv';
				}}
			>
				<IconHandler
					iconName="upload"
					extraClasses="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-48 h-48 opacity-5"
				/>
				Über CSV hinzufügen
			</button>
		</div>
	{/if}

	{#if beginning_option === 'scratch'}
		<GameTableWrapper {store} {data} bind:beginning_option bind:resultsDataBody {gameName} />
	{/if}

	{#if beginning_option === 'csv'}
		{#if resultsDataBody.length > 0}
			<GameTableWrapper {store} {data} bind:beginning_option bind:resultsDataBody {gameName}/>
		{:else}
			<GenerateGameTable data={data as any} bind:beginning_option bind:resultsDataBody {gameName} />
		{/if}
	{/if}
</ViewWrapper>
