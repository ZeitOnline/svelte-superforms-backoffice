<script lang="ts">
	import type { Game, View } from "$types";
	import { debounce, highlightMatch, transformedPublishedData } from "../utils";
	import SearchIcon from "./icons/SearchIcon.svelte";

    let {
        selectedGameId = $bindable(),
		games,
		view = $bindable()
	}: {
        selectedGameId: string;
		games: Game[];
		view: View;
	} = $props();

    let searchTerm = $state("");
	let debouncedSearchTerm = $state("");

	let items = $state(games);

	let filteredItems = $derived(items
		.filter((item) => {
			const term = debouncedSearchTerm.toLowerCase();
			return (
				item.name.toLowerCase().includes(term) ||
				item.id.includes(term) ||
				transformedPublishedData(item.publishedAt).toLowerCase().includes(term)
			);
		})
		.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()))

    const handleEditGame = (id: string) => {
        view = "edit-game";
        selectedGameId = id;
    }

    const handleDeleteGame = (id: string) => {
        view = "delete-game";
        selectedGameId = id;
    }

	const handleSearch = debounce((value: string) => {
		debouncedSearchTerm = value;
	}, 400);

	$effect(() => {
		handleSearch(searchTerm);
	});	
</script>

<!-- Table of the dashboard with search  -->
<div class="flex items-center justify-end gap-z-ds-8">
    <SearchIcon />
    <input bind:value={searchTerm} placeholder="Game 200" class="placeholder:text-xs text-xs py-z-ds-4 border-b border-z-ds-general-black-100 px-z-ds-8" type="search" name="table-data" id="table-data" aria-label="Search games in the table below" aria-controls="search-results-table" />
</div>

<div class="relative overflow-x-auto border border-z-ds-general-black-100 rounded-lg my-z-ds-24" aria-live="polite">
    <table id="search-results-table" class="w-full text-sm text-left rtl:text-right text-z-ds-general-black-100 ">
        <thead>
            <tr>
                <th class="text-nowrap">Name of the game</th>
                <th>Datum</th>
                <th>Published</th>
                <th class="text-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            {#if filteredItems.length > 0}
                {#each filteredItems as item (item.id)}
                    <tr>
                        <td>{@html highlightMatch(item.name, debouncedSearchTerm)}</td>
                        <td>{@html highlightMatch(
                            transformedPublishedData(item.publishedAt),
                            debouncedSearchTerm
                        )}</td>
                        <td>{item.isActive ? "✅ Yes " : "❌ No"}</td>
                        <td class="flex items-center justify-end gap-z-ds-4">
                            <button onclick={() => handleEditGame(item.id)} class="z-ds-button z-ds-button-outline">Edit</button>
                            <button onclick={() => handleDeleteGame(item.id)} class="z-ds-button">Delete</button>
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

<style>
    tr th,
    tr td {
        padding: var(--z-ds-space-m) var(--z-ds-space-l);
    }
</style>