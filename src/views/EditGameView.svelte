<script lang="ts">
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { Game } from '$types';
	import { toast } from '@zerodevx/svelte-toast';
	import { type ViewStateStore } from '../stores/view-state-store.svelte';
	import { getAllQuestionsByGameId, updateGame } from '$lib/queries';
	import { blur } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import ViewNavigation from '$components/ViewNavigation.svelte';

	let { store, games }: { store: ViewStateStore; games: Game[] } = $props();

	const handleBackToDashboard = () => {
		store.updateSelectedGameId('');
		store.updateView('dashboard');
	};

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
		store.updateSelectedGameId('');
		store.updateView('dashboard');
	};

	const game = games.find((game: Game) => game.id === store.selectedGameId);
	if (!game) {
		store.updateSelectedGameId('');
		store.updateView('dashboard');
	}
</script>

<ViewWrapper>
	{#if game === undefined}
		<ViewNavigation
			viewName="Game Not Found"
			mainAction={handleBackToDashboard}
			mainActionText="Back"
		/>
	{:else}
		<ViewNavigation
			viewName={`Edit Game: ${game.name}`}
			mainAction={handleBackToDashboard}
			mainActionText="Back"
		/>

		<form>
			<!-- Input text name  -->
			<div class="w-full flex items-center justify-between my-z-ds-8">
				<label class="text-md" for="name">Name:</label>
				<input
					class="border py-z-ds-8 px-z-ds-12 border-black rounded-lg text-md"
					name="name"
					id="name"
					bind:value={game.name}
					type="text"
				/>
			</div>

			<!-- Input checkbox actice  -->
			<div class="w-full flex items-center justify-between my-z-ds-8">
				<label class="text-md" for="active">Published:</label>
				<input
					class="accent-black border py-z-ds-8 px-z-ds-12 border-black rounded-lg text-md"
					name="active"
					id="active"
					bind:checked={game.active}
					type="checkbox"
				/>
			</div>

			<!-- All the questions of the game  -->
			<div class="relative overflow-x-auto rounded-lg py-z-ds-8 my-z-ds-24" aria-live="polite">
				<table
					id="search-results-table"
					class="w-full text-sm text-left rtl:text-right text-z-ds-general-black-100"
				>
					<thead>
						<tr>
							<th>Nr</th>
							<th>Question</th>
							<th>Answer</th>
							<th>X</th>
							<th>Y</th>
							<th>Direction</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						{#await getAllQuestionsByGameId(store.selectedGameId)}
							{#each Array(8).fill(null) as _}
								<tr>
									<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
									<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
									<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
									<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
									<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
									<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
									<td class="h-[60px] bg-gray-200 motion-safe:animate-pulse"></td>
								</tr>
							{/each}
						{:then data}
							{#each data.sort((a, b) => a.nr - b.nr) as item (item.id)}
								<tr in:blur={{ duration: 300, delay: 0, easing: cubicInOut }}>
									<td>{item.nr}</td>
									<td>{item.question}</td>
									<td>{item.answer}</td>
									<td>{item.xc}</td>
									<td>{item.yc}</td>
									<td>{item.direction}</td>
									<td>{item.description}</td>
								</tr>
							{/each}
						{:catch error}
							<tr>
								<td colspan="7">Error: {error.message}</td>
							</tr>
						{/await}
					</tbody>
				</table>
			</div>

			<div class="flex justify-center mt-z-ds-32">
				<button type="submit" class="z-ds-button" onclick={handleSaveEditedGame}>
					Speichern
				</button>
			</div>
		</form>
	{/if}
</ViewWrapper>

