<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from '../routes/$types';
	import GameRow from './GameRow.svelte';
	import { toast } from '@zerodevx/svelte-toast';
	import Separator from './Separator.svelte';
	import { blur } from 'svelte/transition';
	import ErrorIcon from '$components/icons/HasErrorIcon.svelte';
	import IconHandler from './icons/IconHandler.svelte';
	import { cubicInOut } from 'svelte/easing';
	import { getHighestGameId, getNextAvailableDateForGame, updateGame } from '$lib/queries';
	import { dev } from '$app/environment';

	let {
		resultsDataBody = $bindable(),
		data
	}: {
		resultsDataBody: string[][];
		data: PageData;
	} = $props();

	const { form, message, constraints, errors, enhance } = superForm(data.saveGameForm, {
		validators: false,
		SPA: true,
		// onChange(event) {
		// 	if (dev) {
		// 		if (event.target) {
		// 			// Form input event
		// 			console.log(event.path, 'was changed with', event.target, 'in form', event.formElement);
		// 		} else {
		// 			// Programmatic event
		// 			console.log('Fields updated:', event.paths);
		// 		}

		// 		console.log('release date:', $form.release_date);
		// 	}

		// },
		async onUpdate({ form }) {
			try {
				// Fetch the highest existing game ID asynchronously
				// TODO: incremental ID is working, but here we are doing it like this
				// because the updateGame is asking for it before
				// we need to separate the logic and do different requests for games and questions
				const highestId = await getHighestGameId();
				const newGameId = highestId + 1;

				// Construct the data for the new game
				const data = {
					id: newGameId,
					name: $form.name,
					release_date: $form.release_date,
					active: $form.published,
					questions: resultsDataBody
				};

				// Log the new game data to be added
				console.log('Adding new game:', data);

				// Send the new game data to the backend
				await updateGame(newGameId, data);
			} catch (error) {
				console.error('Error adding game:', error);
				toast.push('⚠️ Failed to add the game. Please try again.', {
					duration: 3000,
					theme: {
						'--toastBackground': '#e74c3c'
					}
				});
			}
		},
		onUpdated({ form }) {
			if (form.valid) {
				toast.push('⭐️ Game amazingly added! Redirecting to main dashboard...', {
					duration: 3000,
					theme: {
						'--toastBackground': '#292929'
					}
				});
				setTimeout(() => {
					window.location.href = '/';
				}, 3000);
				// Successful post! Do some more client-side stuff,
				// like showing a toast notification.
				// console.log('toastchen here!');
			}
		}
	});

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
		resultsDataBody.push(defaultRow);
	}

	// Function to remove the last row
	function removeRow(index: number) {
		confirm('Are you sure you want to remove the last row?') && resultsDataBody.splice(index, 1);
	}

	$effect(() => {
		if (resultsDataBody.length === 0) {
			addRow();
		}

		const addCustomDate = async () => {
			try {
				// Fetch the last game date from the API
				const lastGameDate = await getNextAvailableDateForGame();

				// Convert lastGameDate to a Date object
				const lastGameDateFormat = new Date(lastGameDate); // lastGameDate should be in ISO or a valid date string format

				// Increment the date by 1 day
				lastGameDateFormat.setDate(lastGameDateFormat.getDate() + 1); // Increment the date by 1

				// Format the new date to YYYY-MM-DD
				const nextGameDate = lastGameDateFormat.toISOString().split('T')[0];

				console.log('Next Game Date:', nextGameDate);

				// If you want to update the form with the new date
				form.set({
					name: $form.name,
					published: $form.published,
					questions: $form.questions,
					release_date: nextGameDate
				});
			} catch (error) {
				console.error('Error fetching next available date:', error);
			}
		};
		addCustomDate();
	});

	// 	form.set({
	// 		...form,
	// 		questions: {
	// 			// @ts-ignore
	// 			...form.questions,
	// 			...resultsDataBody
	// 		}
	// 	});
	// });

	let customNameError = $state(false);

	// TODO: change this to server validation
	$effect(() => {
		if (data.games.some((game: any) => game.name === $form.name)) {
			customNameError = true;
		} else {
			customNameError = false;
		}
	});

	let customDateError = $state(false);

	$effect(() => {
		if (data.games.some((game: any) => game.release_date === $form.release_date)) {
			customDateError = true;
		} else {
			customDateError = false;
		}
	});
</script>

<!-- <SuperDebug collapsible={true} collapsed data={$form} display={dev} /> -->

<form class="my-z-ds-24" method="POST" enctype="multipart/form-data" use:enhance>
	<!-- Input text name  -->
	<div
		class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 relative gap-z-ds-4"
	>
		<label class="text-md font-bold" for="game_name">Name:</label>
		<div class="relative">
			<input
				class="border py-z-ds-8 w-full sm:w-[250px] px-z-ds-12 invalid:border-red-600 border-black text-md"
				name="game_name"
				id="game_name"
				type="text"
				placeholder="GameXXXX"
				aria-invalid={$errors.name || customNameError ? 'true' : undefined}
				bind:value={$form.name}
			/>
			{#if $errors.name}<span style="color: red;" class="invalid">{$errors.name}</span>{/if}
			{#if customNameError}<div
					in:blur
					style="color: red;"
					class="invalid flex items-center gap-z-ds-4 absolute -bottom-6 left-0 text-xs"
				>
					<IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
					<span class="text-nowrap text-xs">This name is already taken</span>
				</div>{/if}
		</div>
	</div>

	<!-- Input date  -->
	<div
		class="w-full flex flex-col sm:flex-row sm:items-center justify-between py-z-ds-24 gap-z-ds-4"
	>
		<label class="text-md font-bold" for="release_date">Date:</label>
		<div class="relative">
			<input
				class="border py-z-ds-8 w-full sm:w-[250px] px-z-ds-12 border-black text-md"
				name="release_date"
				id="release_date"
				type="date"
				aria-invalid={$errors.release_date || customDateError ? 'true' : undefined}
				bind:value={$form.release_date}
			/>
			{#if $errors.release_date}<span style="color: red;" class="invalid"
					>{$errors.release_date}</span
				>{/if}
			{#if customDateError}<div
					in:blur
					style="color: red;"
					class="invalid flex items-center gap-z-ds-4 absolute -bottom-6 left-0 text-xs"
				>
					<ErrorIcon extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
					<span class="text-nowrap text-xs">There is already a game on this day</span>
				</div>{/if}
		</div>
	</div>

	<!-- Input checkbox actice  -->
	<div class="w-full flex items-center justify-between my-z-ds-16">
		<label class="text-md font-bold" for="published">Aktiv:</label>
		<input
			class="accent-black border py-z-ds-8 px-z-ds-12 border-black text-md"
			name="published"
			id="published"
			type="checkbox"
			bind:checked={$form.published}
		/>
	</div>

	<Separator />

	<div class="flex justify-between items-center w-full gap-z-ds-8 my-z-ds-24">
		<div class="font-bold text-nowrap">Fragen des Spiels</div>
	</div>

	<div class="relative overflow-x-auto">
		<table class="w-full text-sm text-left rtl:text-right text-gray-900">
			<thead>
				<tr>
					<th>Nr</th>
					<th>Question</th>
					<th>Answer</th>
					<th>X</th>
					<th>Y</th>
					<th>Direction</th>
					<th>Description</th>
					<th class="!border-0">
						<button
							title="Add new row"
							class="z-ds-button z-ds-button-outline font-light min-w-[30px]"
							type="button"
							onclick={addRow}>+</button
						>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each resultsDataBody as row, i (i)}
					<tr
						in:blur={{ duration: 300, delay: 0, easing: cubicInOut }}
						out:blur={{ duration: 300, delay: 0, easing: cubicInOut }}
					>
						{#each row as cell, j (j)}
							<GameRow bind:dataToBind={resultsDataBody[i][j]} />
						{/each}
						<td class="!border-0">
							<button
								title="Remove this row"
								class="z-ds-button min-w-[30px] z-ds-button-outline"
								type="button"
								onclick={() => removeRow(i)}
							>
								-
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="flex flex-row gap-4 items-center my-12 mx-auto w-full justify-center">
		<button class="z-ds-button" type="submit">Neues Spiel erstellen</button>
	</div>
</form>
