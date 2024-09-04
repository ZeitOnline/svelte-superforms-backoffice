<script lang="ts">
	import type { Game } from '$types';
	import { cubicInOut } from 'svelte/easing';
	import type { ViewStateStore } from '$stores/view-state-store.svelte';
	import { debounce, highlightMatch, transformedPublishedData } from '../utils';
	import { blur } from 'svelte/transition';
	import IconHandler from './icons/IconHandler.svelte';
	import TableFilters from './TableFilters.svelte';
	import TableSearch from './TableSearch.svelte';
	import TablePagination from './TablePagination.svelte';

	const ITEMS_PER_PAGE = 10;

	let { store, games }: { store: ViewStateStore; games: Game[] } = $props();

	let searchTerm = $state('');
	let debouncedSearchTerm = $state('');

	let items = $state(games);

	// Filter states with mutual exclusivity
	let filters = $state({
		az: false,
		za: false,
		dateAsc: false,
		dateDesc: true,
		active: false,
		notActive: false,
	});

	let filteredByOptionsItems = $derived(() => {
		let filteredItems = [...items];

		// Example: Apply filtering logic based on your filter states
		if (filters.az) {
			filteredItems.sort((a, b) => a.name.localeCompare(b.name));
		} else if (filters.za) {
			filteredItems.sort((a, b) => b.name.localeCompare(a.name));
		}

		if (filters.dateAsc) {
			filteredItems.sort(
				(a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
			);
		} else if (filters.dateDesc) {
			filteredItems.sort(
				(a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
			);
		}

		if (filters.active) {
			filteredItems = filteredItems.filter((item) => item.active);
		} else if (filters.notActive) {
			filteredItems = filteredItems.filter((item) => !item.active);
		}

		return filteredItems;
	});

	let filteredBySearchItems = $derived(() => {
		const term = debouncedSearchTerm.toLowerCase();

		return filteredByOptionsItems().filter((item) => {
			return (
				item.name.toLowerCase().includes(term) ||
				transformedPublishedData(item.release_date).toLowerCase().includes(term)
			);
		});
	});

	let currentPage: number = $state(1);
	let totalPages: number = $derived(Math.ceil(filteredBySearchItems().length / ITEMS_PER_PAGE));

	let paginatedItems = $derived(
		filteredBySearchItems().slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
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

	function resetAllFilters() {
		filters = {
			az: false,
			za: false,
			dateAsc: false,
			dateDesc: true,
			active: false,
			notActive: false,
		};
		currentPage = 1;
	}

	function toggleFilter(filter: string) {
		currentPage = 1;

		if (filter === 'az') {
			filters.az = !filters.az;
			if (filters.az) filters.za = false;
		} else if (filter === 'za') {
			filters.za = !filters.za;
			if (filters.za) filters.az = false;
		} else if (filter === 'dateAsc') {
			filters.dateAsc = !filters.dateAsc;
			if (filters.dateAsc) filters.dateDesc = false;
		} else if (filter === 'dateDesc') {
			filters.dateDesc = !filters.dateDesc;
			if (filters.dateDesc) filters.dateAsc = false;
		} else if (filter === 'active') {
			filters.active = !filters.active;
			if (filters.active) filters.notActive = false;
		} else if (filter === 'notActive') {
			filters.notActive = !filters.notActive;
			if (filters.notActive) filters.active = false;
		}
	}
</script>

<TableSearch 
	bind:searchTerm 
	idSearch="dashboard-games" 
	ariaLabel="Nach Spiele suchen" 
	ariaControls="search-results-table" 
/>

<!-- Filter Options  -->
{#snippet popoverContent()}
	<div class="flex flex-wrap gap-3 mt-12">
		<div class="flex flex-col gap-2">
			<button class="filter-button" class:active={filters.az} onclick={() => toggleFilter('az')}>
				A-Z
			</button>
			<button class="filter-button" class:active={filters.za} onclick={() => toggleFilter('za')}>
				Z-A
			</button>
		</div>
		<div class="flex flex-col gap-2">
			<button
				class="filter-button"
				class:active={filters.dateAsc}
				onclick={() => toggleFilter('dateAsc')}
			>
				Date Ascending
			</button>
			<button
				class="filter-button"
				class:active={filters.dateDesc}
				onclick={() => toggleFilter('dateDesc')}
			>
				Date Descending
			</button>
		</div>
		<div class="flex flex-col gap-2">
			<button
				class="filter-button"
				class:active={filters.active}
				onclick={() => toggleFilter('active')}
			>
				✅
			</button>
			<button
				class="filter-button"
				class:active={filters.notActive}
				onclick={() => toggleFilter('notActive')}
			>
				❌
			</button>
		</div>
	</div>
{/snippet}

{#snippet popoverOpener()}
	<svg width="12" height="12" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g clip-path="url(#filter-icon)">
			<path d="M17 9H1" stroke="currentColor" stroke-width="1.5" />
			<path d="M17 4H1" stroke="currentColor" stroke-width="1.5" />
			<path d="M17 14H1" stroke="currentColor" stroke-width="1.5" />
			<circle cx="14" cy="4" r="2" fill="currentColor" />
			<circle cx="5" cy="9" r="2" fill="currentColor" />
			<circle cx="12" cy="14" r="2" fill="currentColor" />
		</g>
		<defs>
			<clipPath id="filter-icon">
				<rect width="18" height="18" fill="white" />
			</clipPath>
		</defs>
	</svg>
{/snippet}

<TableFilters {resetAllFilters} idButtonOpener="filter-opener" {popoverContent} {popoverOpener} />

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

<TablePagination bind:currentPage {totalPages} />

<style lang="postcss">
	.filter-button {
		@apply bg-white text-xs px-2 py-1 rounded-md cursor-pointer border border-black hover:bg-gray-200 focus:bg-gray-200;
	}
	.filter-button.active {
		@apply bg-black text-white;
	}
</style>
