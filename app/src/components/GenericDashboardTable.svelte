<script lang="ts">
	import type { GameComplete, GameType, TableColumn } from '$types';
	import { cubicInOut } from 'svelte/easing';
	import type { ViewStateStore } from '$stores/view-state-store.svelte';
	import { debounce, highlightMatch, searchInGame, isGameActive } from '$utils';
	import { blur } from 'svelte/transition';
	import IconHandler from './icons/IconHandler.svelte';
	import { TableFilters, TableSearch, TablePagination } from './table';
	import { CloseIcon, EyeIcon, TickIcon } from './icons';
    import { afterNavigate } from '$app/navigation';
    import { page } from '$app/state';
    import { CONFIG_GAMES } from '../config/games.config';

	const ITEMS_PER_PAGE = 10;

	let { store, games, gameName }: { store: ViewStateStore; games: GameComplete[], gameName: GameType } = $props();

	let currentGameConfig = $state(CONFIG_GAMES[gameName]);
	let searchTerm = $state('');
	let debouncedSearchTerm = $state('');

	afterNavigate(() => {
		if (page.route.id === '/wortiger') {
			currentGameConfig = CONFIG_GAMES["wortiger"];
		} else if (page.route.id === '/eckchen') {
			currentGameConfig = CONFIG_GAMES["eckchen"];
		}

	})

	let items = $state(games);

	let filters = $state({
		az: false,
		za: false,
		dateAsc: false,
		dateDesc: true,
		active: false,
		notActive: false
	});

	// Generic sorting logic
	let filteredByOptionsItems = $derived(() => {
		let filteredItems = [...items];

		const firstColumn = currentGameConfig.table.columns.find((col: TableColumn) => col.sortable);
		if (firstColumn) {
			if (filters.az) {
				filteredItems.sort((a, b) => {
					const aVal = firstColumn.getValue(a).toString();
					const bVal = firstColumn.getValue(b).toString();
					return aVal.localeCompare(bVal);
				});
			} else if (filters.za) {
				filteredItems.sort((a, b) => {
					const aVal = firstColumn.getValue(a).toString();
					const bVal = firstColumn.getValue(b).toString();
					return bVal.localeCompare(aVal);
				});
			}
		}

		// Date sorting
		if (filters.dateAsc) {
			filteredItems.sort(
				(a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
			);
		} else if (filters.dateDesc) {
			filteredItems.sort(
				(a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
			);
		}

		// Active status filtering
		if (filters.active) {
			filteredItems = filteredItems.filter((item) => isGameActive(item));
			// console.log('After active filter:', filteredItems.length);
		} else if (filters.notActive) {
			filteredItems = filteredItems.filter((item) => !isGameActive(item));
			// console.log('After notActive filter:', filteredItems.length);
		}

		// console.log('Final filtered items:', filteredItems.length);
		return filteredItems;
	});

	// Generic search logic using the configuration
	let filteredBySearchItems = $derived(() => {
		return filteredByOptionsItems().filter((item) =>
			searchInGame(item, debouncedSearchTerm, currentGameConfig.table.columns)
		);
	});

	let currentPage: number = $state(1);
	let totalPages: number = $derived(Math.ceil(filteredBySearchItems().length / ITEMS_PER_PAGE));

	let paginatedItems = $derived(
		filteredBySearchItems().slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
	);

	// Only for Eckchen - twenty latest active games for the eye icon
	let twentyLatestActiveGames = $derived(() => {
		if (!currentGameConfig.table.hasLiveView) return [];

		return items
			.filter((item) => isGameActive(item))
			.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
			.slice(0, 20);
	});

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
			notActive: false
		};
		currentPage = 1;
	}

	function toggleFilter(filter: string) {
		currentPage = 1;

		// Some of the filter should have mutual exclusivity
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

	// Helper function to render cell content with highlighting
	function renderCellContent(game: GameComplete, column: TableColumn): string | number  {
		const value = column.getValue(game);
		const displayValue = column.getDisplayValue ? column.getDisplayValue(game) : value;

		if (!column.searchable) {
			return displayValue.toString();
		}

		if (!value) return displayValue;

		return highlightMatch(displayValue, debouncedSearchTerm) as string;
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
				aufsteigendes Datum
			</button>
			<button
				class="filter-button"
				class:active={filters.dateDesc}
				onclick={() => toggleFilter('dateDesc')}
			>
				absteigendes Datum
			</button>
		</div>
		<div class="flex flex-col gap-2">
			<button
				class="filter-button text-z-ds-color-success-100"
				class:active={filters.active}
				onclick={() => toggleFilter('active')}
			>
				<TickIcon extraClasses="text-z-ds-color-success-100" />
			</button>
			<button
				class="filter-button"
				class:active={filters.notActive}
				onclick={() => toggleFilter('notActive')}
			>
				<CloseIcon extraClasses="text-z-ds-color-error-70" />
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
				<!-- Generate headers dynamically from configuration -->
				{#each currentGameConfig.table.columns as column, index (index)}
					<th class={column.key === 'name' || column.key === 'level' ? 'text-nowrap' : ''}>
						{column.label}
					</th>
				{/each}
				<th class="text-right">Aktionen</th>
			</tr>
		</thead>
		<tbody>
			{#if paginatedItems.length > 0}
				{#each paginatedItems as item (item.id)}
					{@const isOneOfTwentyLatestActiveGames = currentGameConfig.table.hasLiveView &&
						twentyLatestActiveGames().some((game) => game.id === item.id)}

					<tr in:blur={{ duration: 300, delay: 0, easing: cubicInOut }}>
						<!-- Generate cells dynamically from configuration -->
						{#each currentGameConfig.table.columns as column, index (index)}
							<td>
								{#if column.key === 'active'}
									<!-- Special handling for active column -->
									{#if isGameActive(item)}
										<div class="flex items-center gap-z-ds-4">
											<TickIcon
												extraClasses="text-z-ds-color-success-100 w-5 h-5"
												title="In der Datenbank aktiv"
											/>
											{#if isOneOfTwentyLatestActiveGames}
												<a
													title={`Das Spiel mit ID ${item.id} im ${currentGameConfig.label} anschauen`}
													target="_blank"
													rel="nofollow noopener"
													href={`${currentGameConfig.productionUrl}/#${item.id}`}
												>
													<EyeIcon
														extraClasses="text-black w-5 h-5"
														title="Aktuell im Eckchen-Spiel sichtbar"
													/>
												</a>
											{/if}
										</div>
									{:else}
										<CloseIcon extraClasses="text-z-ds-color-error-70 w-7 h-7" />
									{/if}
								{:else if column.key === 'solution' && !column.getValue(item)}
									<!-- Special handling for missing solution -->
									<span class="text-z-ds-color-error-70">Keine Lösung</span>
								{:else}
									<!-- Regular cell content -->
									{@html renderCellContent(item, column)}
								{/if}
							</td>
						{/each}

						<!-- Actions column -->
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
					<td colspan={currentGameConfig.table.columns.length + 1} class="text-center py-z-ds-8">
						No data found
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

<TablePagination bind:currentPage {totalPages} />

<style lang="postcss">
	@reference "../app.css";

	.filter-button {
		@apply bg-white text-xs px-2 py-1 rounded-md cursor-pointer border border-black hover:bg-gray-200 focus:bg-gray-200;
	}
	.filter-button.active {
		@apply bg-black text-white;
	}
</style>
