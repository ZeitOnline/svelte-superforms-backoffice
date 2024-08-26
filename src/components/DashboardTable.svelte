<script lang="ts">
	import type { Game } from '$types';
	import { cubicInOut } from 'svelte/easing';
	import type { ViewStateStore } from '../stores/view-state-store.svelte';
	import { debounce, highlightMatch, transformedPublishedData } from '../utils';
	import DashboardPagination from './DashboardPagination.svelte';
	import { blur } from 'svelte/transition';
	import IconHandler from './icons/IconHandler.svelte';

	const ITEMS_PER_PAGE = 10;

	let { store, games }: { store: ViewStateStore; games: Game[] } = $props();

	let searchTerm = $state('');
	let debouncedSearchTerm = $state('');

	let items = $state(games);

	let filteredItems = $derived(
		items
			.filter((item) => {
				const term = debouncedSearchTerm.toLowerCase();
				return (
					item.name.toLowerCase().includes(term) ||
					transformedPublishedData(item.release_date).toLowerCase().includes(term)
				);
			})
			.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
	);

	let currentPage: number = $state(1);
	let totalPages: number = $derived(Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

	let paginatedItems = $derived(
		filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
	);

	const handleEditGame = (id: number) => {
		store.updateView('edit-game');
		store.updateSelectedGameId(id);
	};

	const handleDeleteGame = (id: number) => {
		store.updateSelectedGameId(id);
		store.updateView('delete-game');
	};

	const handleSearch = debounce((value: string) => {
		debouncedSearchTerm = value;
		currentPage = 1;
	}, 400);

	$effect(() => {
		handleSearch(searchTerm);
	});
</script>

<!-- Table of the dashboard with search  -->
<div class="flex items-center justify-end gap-z-ds-8">
	<IconHandler iconName="search" />
	<input
		bind:value={searchTerm}
		placeholder="Game4024"
		class="placeholder:text-xs text-xs py-z-ds-4 border-b border-z-ds-general-black-100 px-z-ds-8"
		type="search"
		name="table-data"
		id="table-data"
		aria-label="Search games in the table below"
		aria-controls="search-results-table"
	/>
</div>

<div class="relative overflow-x-auto py-z-ds-8 my-z-ds-24" aria-live="polite">
	<table
		id="search-results-table"
		class="w-full text-sm text-left rtl:text-right text-z-ds-general-black-100"
	>
		<thead>
			<tr>
				<th class="text-nowrap">Name des Spiels</th>
				<th>Datum</th>
				<th>Aktiv</th>
				<th class="text-right">Aktionen</th>
			</tr>
		</thead>
		<tbody>
			{#if paginatedItems.length > 0}
				{#each paginatedItems as item (item.id)}
					<tr in:blur={{ duration: 300, delay: 0, easing: cubicInOut }}>
						<td>{@html highlightMatch(item.name, debouncedSearchTerm)}</td>
						<td
							>{@html highlightMatch(
								transformedPublishedData(item.release_date),
								debouncedSearchTerm
							)}</td
						>
						<td>{item.active ? '✅' : '❌'}</td>
						<td>
							<div class="flex items-center justify-end gap-z-ds-4">
								<button
									aria-label="Spiel bearbeiten"
									onclick={() => handleEditGame(item.id)}
									class="z-ds-button z-ds-button-outline"
								>
									<IconHandler iconName="update" />
								</button>
								<button
									aria-label="Spiel löschen"
									onclick={() => handleDeleteGame(item.id)}
									class="z-ds-button"
								>
									<IconHandler iconName="delete" extraClasses="w-5 h-5" />
								</button>
							</div>
						</td>
					</tr>
				{/each}
			{:else}
				<tr>
					<td colspan="5" class="text-center py-z-ds-8">No data found</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

<DashboardPagination bind:currentPage {totalPages} />
