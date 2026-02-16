<script lang="ts">
  import type {
    GameComplete,
    GameSpellingBeeComplete,
    GameType,
    GamesPageInfo,
    ActiveFilter,
    ActiveFilterOption,
    SortOption,
    TableColumn,
  } from '$types';
  import { DEFAULT_SORT, isSortOption } from '$lib/game-table-utils';
  import { cubicInOut } from 'svelte/easing';
  import { view } from '$stores/view-state-store.svelte';
  import {
    debounce,
    highlightMatch,
    isGameActive,
    isSpellingBeeGame,
    type HighlightSegment,
  } from '$utils';
  import { blur } from 'svelte/transition';
  import IconHandler from './icons/IconHandler.svelte';
  import { TableFilters, TableSearch, TablePagination } from './table';
  import { CloseIcon, EyeIcon, TickIcon } from './icons';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { CONFIG_GAMES } from '../config/games.config';
  import { spellingBeeStore, toggleLegend } from '$stores/spelling-bee-word.svelte';
  import WortigerLevelTabs from '$components/games/wortiger/WortigerLevelTabs.svelte';
  import HighlightedText from '$components/HighlightedText.svelte';

  type Props = {
    games: GameComplete[];
    gameName: GameType;
    gamesPage: GamesPageInfo;
    latestActiveGameIds: number[];
  };

  let { games, gameName, gamesPage, latestActiveGameIds }: Props = $props();

  const currentGameConfig = $derived(CONFIG_GAMES[gameName]);
  const normalizedGamesPage = $derived({
    page: gamesPage.page ?? 1,
    totalPages: gamesPage.totalPages ?? 1,
    search: gamesPage.search ?? '',
    sort: gamesPage.sort ?? DEFAULT_SORT,
    activeFilter: gamesPage.activeFilter ?? null,
    levelLength: gamesPage.levelLength ?? null,
  });
  let searchTerm = $derived(normalizedGamesPage.search);
  let debouncedSearchTerm = $derived(normalizedGamesPage.search);
  let currentPage = $derived(normalizedGamesPage.page);

  $effect(() => {
    searchTerm = normalizedGamesPage.search;
    debouncedSearchTerm = normalizedGamesPage.search;
    currentPage = normalizedGamesPage.page;
  });

  const hasActiveColumn = $derived(
    currentGameConfig.table.columns.some(column => column.key === 'active'),
  );

  const totalPages = $derived(normalizedGamesPage.totalPages);
  const totalResults = $derived(gamesPage.total ?? 0);
  const resultsLabel = $derived(totalResults === 1 ? 'Ergebnis' : 'Ergebnisse');

  const handleEditGame = (id: number) => {
    view.updateView('edit-game');
    view.updateSelectedGameId(id);
  };

  const handleDeleteGame = (id: number) => {
    view.updateSelectedGameId(id);
    view.updateView('delete-game');
  };

  function updateQuery(
    next: {
      page?: number;
      search?: string;
      sort?: SortOption;
      active?: ActiveFilter;
      levelLength?: number | null;
    },
    replaceState = false,
  ) {
    const url = new URL(page.url);
    const params = url.searchParams;

    if (next.page !== undefined) {
      if (next.page <= 1) {
        params.delete('page');
      } else {
        params.set('page', String(next.page));
      }
    }

    if (next.search !== undefined) {
      const value = next.search.trim();
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
    }

    if (next.sort !== undefined) {
      params.set('sort', next.sort);
    }

    if (next.active !== undefined) {
      if (next.active) {
        params.set('active', next.active);
      } else {
        params.delete('active');
      }
    }

    if (next.levelLength !== undefined) {
      if (next.levelLength) {
        params.set('level', String(next.levelLength));
      } else {
        params.delete('level');
      }
    }

    goto(`${url.pathname}?${params.toString()}`, {
      replaceState,
      keepFocus: true,
      noScroll: true,
    });
  }

  const handleSearch = debounce((value: string) => {
    updateQuery({ search: value, page: 1 }, true);
  }, 400);

  $effect(() => {
    if (searchTerm === normalizedGamesPage.search) return;
    handleSearch(searchTerm);
  });

  $effect(() => {
    if (currentPage === normalizedGamesPage.page) return;
    updateQuery({ page: currentPage });
  });

  function resetAllFilters() {
    updateQuery({ sort: DEFAULT_SORT, active: null, levelLength: null, page: 1 }, true);
  }

  function toggleFilter(filter: SortOption | ActiveFilterOption) {
    if (isSortOption(filter)) {
      const isActive = normalizedGamesPage.sort === filter;
      const nextSort = isActive ? DEFAULT_SORT : (filter as GamesPageInfo['sort']);
      updateQuery({ sort: nextSort, page: 1 }, true);
      return;
    }

    if (filter === 'active') {
      const nextActive = normalizedGamesPage.activeFilter === 'active' ? null : 'active';
      updateQuery({ active: nextActive, page: 1 }, true);
    } else if (filter === 'notActive') {
      const nextActive = normalizedGamesPage.activeFilter === 'notActive' ? null : 'notActive';
      updateQuery({ active: nextActive, page: 1 }, true);
    }
  }

  const updateWortigerLength = (length: number | null) =>
    updateQuery({ levelLength: length, page: 1 }, true);

  // Build safe, tokenized content for highlighted rendering without {@html}
  function renderCellContent(game: GameComplete, column: TableColumn): HighlightSegment[] {
    const value = column.getValue(game);
    const displayValue = column.getDisplayValue ? column.getDisplayValue(game) : value;

    if (!column.searchable) {
      return [{ text: displayValue.toString(), match: false }];
    }

    return highlightMatch(displayValue, debouncedSearchTerm);
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
      <button
        class="filter-button"
        class:active={normalizedGamesPage.sort === 'az'}
        onclick={() => toggleFilter('az')}
      >
        A-Z
      </button>
      <button
        class="filter-button"
        class:active={normalizedGamesPage.sort === 'za'}
        onclick={() => toggleFilter('za')}
      >
        Z-A
      </button>
    </div>
    <div class="flex flex-col gap-2">
      <button
        class="filter-button"
        class:active={normalizedGamesPage.sort === 'dateAsc'}
        onclick={() => toggleFilter('dateAsc')}
      >
        aufsteigendes Datum
      </button>
      <button
        class="filter-button"
        class:active={normalizedGamesPage.sort === 'dateDesc'}
        onclick={() => toggleFilter('dateDesc')}
      >
        absteigendes Datum
      </button>
    </div>
    {#if hasActiveColumn}
      <div class="flex flex-col gap-2">
        <button
          class="filter-button text-z-ds-color-success-100"
          class:active={normalizedGamesPage.activeFilter === 'active'}
          onclick={() => toggleFilter('active')}
        >
          <TickIcon extraClasses="text-z-ds-color-success-100" />
        </button>
        <button
          class="filter-button"
          class:active={normalizedGamesPage.activeFilter === 'notActive'}
          onclick={() => toggleFilter('notActive')}
        >
          <CloseIcon extraClasses="text-z-ds-color-error-70" />
        </button>
      </div>
    {/if}
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

<div class="flex items-center justify-between gap-3">
  {#if gameName === 'wortiger'}
    <WortigerLevelTabs
      apiBase={currentGameConfig.apiBase}
      endpointName={currentGameConfig.endpoints.games.name}
      levelLength={normalizedGamesPage.levelLength}
      onChange={updateWortigerLength}
    />
  {/if}

  <TableFilters {resetAllFilters} idButtonOpener="filter-opener" {popoverContent} {popoverOpener} />
</div>

<div class="text-xs text-z-ds-color-black-80 mt-3 flex justify-end">
  {#if totalResults === 0}
    0 Ergebnisse
  {:else}
    {totalResults} {resultsLabel}
  {/if}
</div>

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
      {#if games.length > 0}
        {#each games as item (item.id)}
          {@const isOneOfTwentyLatestActiveGames =
            currentGameConfig.table.hasLiveView && latestActiveGameIds.includes(item.id)}

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
                          <EyeIcon extraClasses="text-black w-5 h-5" />
                        </a>
                      {/if}
                    </div>
                  {:else}
                    <CloseIcon extraClasses="text-z-ds-color-error-70 w-7 h-7" />
                  {/if}
                {:else if gameName === 'spelling-bee' && column.key === 'wordcloud'}
                  <HighlightedText segments={renderCellContent(item, column)} />
                  {@const solutionsForGame = (item as GameSpellingBeeComplete).game_solution ?? []}
                  {@const maxPoints = solutionsForGame.reduce(
                    (max, current) => Math.max(max, current.points),
                    0,
                  )}

                  {@const wordsWithMaxPoints = solutionsForGame.filter(
                    solution => solution.points === maxPoints,
                  )}
                  <br />
                  <span class="flex text-z-ds-12"> ({solutionsForGame.length} Lösungen)</span>
                  {#if wordsWithMaxPoints.length > 0}
                    <div class="flex flex-wrap gap-1 mt-1 max-w-[100px]">
                      {#each wordsWithMaxPoints as wmp (wmp.solution)}
                        <span
                          class="text-[0.5rem] border bg-gray-200 rounded-2xl px-2 border-gray-700 py-1 mb-auto"
                        >
                          {wmp.solution}
                        </span>
                      {/each}
                    </div>
                  {/if}
                {:else if column.key === 'solution' && !column.getValue(item)}
                  <!-- Special handling for missing solution -->
                  <span class="text-z-ds-color-error-70">Keine Lösung</span>
                {:else}
                  <!-- Regular cell content -->
                  <HighlightedText segments={renderCellContent(item, column)} />
                {/if}
              </td>
            {/each}

            <!-- Actions column -->
            <td>
              <div class="flex justify-end gap-z-ds-4">
                {#if gameName === 'spelling-bee' && isSpellingBeeGame(item)}
                  {@const solutionsForGame = (item as GameSpellingBeeComplete).game_solution ?? []}

                  {#if solutionsForGame.length > 0}
                    <button
                      aria-pressed={spellingBeeStore.word === item.wordcloud}
                      aria-label="Lösungen in Store laden"
                      onclick={() => {
                        toggleLegend(item, solutionsForGame);
                      }}
                      class="z-ds-button z-ds-button-outline aria-pressed:bg-black! aria-pressed:text-white!"
                    >
                      {#if spellingBeeStore.word === item.wordcloud}
                        <IconHandler extraClasses="w-5 h-5" iconName="eye-scan" />
                      {:else}
                        <IconHandler extraClasses="w-5 h-5" iconName="eye" />
                      {/if}
                    </button>
                  {/if}
                {/if}
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
