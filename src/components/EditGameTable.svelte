<script lang="ts">
	import { getAllQuestionsByGameId, updateGame } from '$lib/queries';
	import type { Game, QuestionComplete } from '$types';
	import { toast } from '@zerodevx/svelte-toast';
	import type { ViewStateStore } from '../stores/view-state-store.svelte';
	import Separator from './Separator.svelte';
	import { blur } from 'svelte/transition';
	import GameRow from './GameRow.svelte';
	import { cubicInOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import IconHandler from './icons/IconHandler.svelte';
	import { debounce } from '../utils';

	let { store, game }: { store: ViewStateStore; game: Game } = $props();

	const handleSaveEditedGame = () => {
		updateGame(store.selectedGameId, {
			name: (document.getElementById('name') as HTMLInputElement)?.value as string,
			active: (document.getElementById('active') as HTMLInputElement)?.checked as boolean
		});

		toast.push('Game saved (Not working yet)', {
			theme: {
				'--toastBackground': '#333',
				'--toastColor': '#fff'
			}
		});
		store.updateSelectedGameId(-1);
		store.updateView('dashboard');
	};

	// Function to add a new row
	function addRow() {
		let defaultRow = [
			'X',
			'Example Question',
			'Example Answer',
			'1',
			'1',
			'h',
			'I am so poor I cannot even pay attention'
		];
		alert('not working yet');
	}

	// Function to remove the last row
	function removeRow(index: number) {
		if (confirm('Are you sure you want to remove this row?')) {
			// Assuming you have a data array that holds the rows
			// data.splice(index, 1);

			// You might want to update the backend or the state here as well
			toast.push('Row removed', {
				theme: {
					'--toastBackground': '#333',
					'--toastColor': '#fff'
				}
			});
		}
	}

    let searchTerm = $state('');
	let debouncedSearchTerm = $state('');

	let questions: QuestionComplete[] = $state([]);
    let filteredQuestions = $derived(
        questions
            .filter((item) => {
                const term = debouncedSearchTerm.toLowerCase();
                return (
                    item.question.toLowerCase().includes(term) ||
                    item.answer.toLowerCase().includes(term) || 
                    item.description.includes(term)
                );
            })
            .sort((a, b) => a.nr - b.nr)
    );

    onMount(async () => {
        const newQuestions = await getAllQuestionsByGameId(store.selectedGameId);
        questions = newQuestions;
    });
   
	const handleSearch = debounce((value: string) => {
		debouncedSearchTerm = value;
	}, 400);

	$effect(() => {
		handleSearch(searchTerm);
	});


</script>

<form>
	<!-- Input text name  -->
	<div class="w-full flex items-center justify-between my-z-ds-8">
		<label class="text-md font-bold" for="game_name">Name:</label>
		<input
			class="border py-z-ds-8 w-full sm:w-[250px] px-z-ds-12 border-z-ds-general-black-100 text-md"
			name="game_name"
			id="game_name"
			bind:value={game.name}
			type="text"
		/>
	</div>

	<!-- Input date  -->
	<div
		class="w-full flex flex-col sm:flex-row sm:items-center justify-between py-z-ds-24 gap-z-ds-4"
	>
		<label class="text-md font-bold" for="release_date">Date:</label>
		<div class="relative">
			<input
				class="border py-z-ds-8 w-full sm:w-[250px] px-z-ds-12 border-z-ds-general-black-100 text-md"
				name="release_date"
				id="release_date"
				type="date"
				bind:value={game.release_date}
			/>
		</div>
	</div>

	<!-- Input checkbox actice  -->
	<div class="w-full flex items-center justify-between my-z-ds-8">
		<label class="text-md font-bold" for="active">Aktiv:</label>
		<input
			class="accent-z-ds-general-black-100 border py-z-ds-8 px-z-ds-12 border-z-ds-general-black-100 text-md"
			name="active"
			id="active"
			bind:checked={game.active}
			type="checkbox"
		/>
	</div>

	<Separator />

	<div class="flex justify-between items-center w-full gap-z-ds-8 my-z-ds-24">
		<div class="font-bold text-nowrap">Fragen des Spiels</div>

		<div class="flex w-full justify-end gap-z-ds-4">
			<button
				title="Add new row"
				class="z-ds-button z-ds-button-outline min-w-[30px]"
				type="button"
				onclick={addRow}>
                +
            </button>
		</div>
	</div>

    <!-- Table of the dashboard with search  -->
    <div class="flex items-center justify-end gap-z-ds-8">
        <IconHandler iconName="search" />
        <input
            bind:value={searchTerm}
            placeholder="Rate ewig!"
            class="placeholder:text-xs text-xs py-z-ds-4 border-b border-z-ds-general-black-100 px-z-ds-8"
            type="search"
            name="table-data"
            id="table-data"
            aria-label="Search games in the table below"
            aria-controls="search-results-table"
        />
    </div>

	<!-- All the questions of the game  -->
	<div class="relative overflow-x-auto py-z-ds-8 my-z-ds-24" aria-live="polite">
		<table
			id="search-results-table"
			class="w-full text-sm text-left rtl:text-right text-z-ds-general-black-100"
		>
			<thead>
				<tr>
					<th>Nr</th>
					<th>Frage</th>
					<th>Antwort</th>
					<th>X</th>
					<th>Y</th>
					<th>Ausrichtung</th>
					<th>Beschreibung</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#if questions.length === 0}
					{#each Array(8).fill(null) as _}
						<tr>
							<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
							<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
							<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
							<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
							<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
							<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
							<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
							<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
						</tr>
					{/each}
				{:else}
					{#each filteredQuestions as item, index}
						<tr in:blur={{ duration: 300, delay: 0, easing: cubicInOut }}>
							<GameRow bind:dataToBind={item.nr} />
							<GameRow bind:dataToBind={item.question} />
							<GameRow bind:dataToBind={item.answer} />
							<GameRow bind:dataToBind={item.xc} />
							<GameRow bind:dataToBind={item.yc} />
							<GameRow bind:dataToBind={item.direction} />
							<GameRow bind:dataToBind={item.description} />
							<td>
								<button
									title="Remove this row"
									class="z-ds-button z-ds-button-outline min-w-[30px]"
									type="button"
									onclick={() => removeRow(index)}
								>
									-
								</button>
							</td>
						</tr>
					{/each}
                {/if}
			</tbody>
		</table>
	</div>

	<div class="flex justify-center mt-z-ds-32">
		<button type="submit" class="z-ds-button" onclick={handleSaveEditedGame}> Speichern </button>
	</div>
</form>
