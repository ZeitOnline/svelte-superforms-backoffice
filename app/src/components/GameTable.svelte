<script lang="ts">
	import { formFieldProxy, superForm, arrayProxy, setError } from 'sveltekit-superforms';
	import type { PageData } from '../routes/$types';
	import Separator from './Separator.svelte';
	import { blur } from 'svelte/transition';
	import IconHandler from './icons/IconHandler.svelte';
	import { cubicInOut } from 'svelte/easing';
	import {
		createGame,
		createGameQuestions,
		getNextAvailableDateForGame,
		updateGame,
		updateGameQuestions
	} from '$lib/queries';
	import ViewNavigation from './ViewNavigation.svelte';
	import {
		Orientation,
		type BeginningOptions,
		type GameComplete,
		type Question,
		type QuestionComplete
	} from '$types';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { saveGameFormSchema } from '../schemas/generate-game';
	import { onMount } from 'svelte';
	import type { ViewStateStore } from '$stores/view-state-store.svelte';
	import { APP_MESSAGES } from '$lib/app-messages';
	import { ERRORS } from '$lib/error-messages';
	import { getToastState } from '$lib/toast-state.svelte';

	let {
		resultsDataBody = $bindable(),
		data,
		game,
		beginning_option = $bindable(),
		store
	}: {
		resultsDataBody: string[][];
		data: PageData;
		game?: GameComplete;
		beginning_option: BeginningOptions;
		store: ViewStateStore;
	} = $props();

	const toastManager = getToastState()
	let isSubmitted = false;

	const superform = superForm(data.saveGameForm, {
		validators: zodClient(saveGameFormSchema),
		SPA: true,
		resetForm: false,
		taintedMessage: isSubmitted ? false : true,
		async onUpdate({ form }) {
			try {
				const finalData = {
					name: $form.name,
					release_date: $form.release_date,
					active: $form.published
				};
				
				if (beginning_option === "edit" && game) {

					if (game.name !== $form.name) {
						if (data.games.some((game: any) => game.name === $form.name)) {
							setError(form, 'name', ERRORS.GAME.NAME.TAKEN);
						}
					}
					
					if (game.release_date !== $form.release_date) {
						if (data.games.some((game: any) => game.release_date === $form.release_date)) {
							setError(form, 'release_date', ERRORS.GAME.RELEASE_DATE.TAKEN);
						}
					}
					
				} else {
					
					if (data.games.some((game: any) => game.name === $form.name)) {
						setError(form, 'name', ERRORS.GAME.NAME.TAKEN);
					}
	
					if (data.games.some((game: any) => game.release_date === $form.release_date)) {
						setError(form, 'release_date', ERRORS.GAME.RELEASE_DATE.TAKEN);
					}
				}

				if (!form.valid) {
					return;
				}

				// Send the new game data to the backend
				if (beginning_option === 'edit' && game) {
					const finalEditedGame = {
						id: game.id,
						name: $form.name,
						release_date: $form.release_date,
						active: $form.published,
					};

					await updateGame(game.id, finalEditedGame);

					const editedQuestions = $form.questions as QuestionComplete[]

					editedQuestions.forEach((question, index) => {
						question.game_id = game.id; // Ensure the game_id is correctly assigned
						// @ts-ignore 
						question.id = game.questions[index].id; // Ensure the question id is correctly assigned
					});

					await updateGameQuestions(editedQuestions);

				} else {
					const newGameArray = await createGame(finalData);
					const newGame = newGameArray[0];
					newGame.questions = $form.questions;
					newGame.questions.map((question) => {
						question.game_id = newGame.id;
					});
					const resp = await createGameQuestions(newGame);
					if (!resp.ok) {
						throw new Error('Failed to add questions');
					}
				}
			} catch (error) {
				// TODO: Error handling for conflict 409/500 etc
				console.error('Error adding game:', error);
				toastManager.add(ERRORS.GAME.FAILED_TO_ADD, '')
			}
		},
		onUpdated({ form }) {
			if (form.valid) {
				toastManager.add(APP_MESSAGES.GAME.ADDED_SUCCESS, '');

				setTimeout(() => {
					window.location.reload();
				}, 1000);
			}
		},
		onResult({ result }) {
			// console.log('onResult:', result);
			isSubmitted = true;
		}
	});
	const { form, errors, enhance, isTainted, reset } = superform;
	const { value } = formFieldProxy(superform, 'name');
	const { values: questionValues, valueErrors: questionErrors } = arrayProxy(superform, 'questions');

	// Function to add a new row
	function addRow() {
		let defaultRow = [
			'1',
			'Beispiel Frage',
			'Beispiel Antwort',
			'1',
			'1',
			Orientation.HORIZONTAL,
			'Ich bin so arm, ich habe nur X und Y'
		];
		resultsDataBody.push(defaultRow);
		const newQuestions = [...$form.questions, serializeRow(defaultRow)];
		$form.questions = newQuestions; // Reassign to trigger reactivity
	}

	function serializeRow(row: any[]): Question {
		return {
			nr: Number(row[0]),
			question: String(row[1]),
			answer: String(row[2]),
			xc: Number(row[3]),
			yc: Number(row[4]),
			direction: row[5] as Orientation,
			description: String(row[6])
		};
	}

	// Function to remove the last row
	function removeRow(index: number) {
		if (
			confirm(`Bist du dir sicher, dass du die Reihe ${index + 1} löschen möchtest?`) &&
			$form.questions.length > 0
		) {
			$form.questions.splice(index, 1);
			$form.questions = $form.questions; // Reassign to trigger reactivity
		}
	}

	onMount(() => {
		if (resultsDataBody.length === 0) {
			addRow();
		}
		if (game) {
			if (game.name) {
				$value = game.name;
			}
			if (game.release_date) {
				$form.release_date = game.release_date;
			}
			if (game.active) {
				$form.published = game.active;
			}
		}

		if (!isSubmitted) {
			if (resultsDataBody.length > 0 && $form.questions.length === 0) {
				const newQuestions = [
					...$form.questions,
					...resultsDataBody.map((row) => serializeRow(row))
				];

				setTimeout(() => {
					$form.questions = newQuestions; // Reassign to trigger reactivity
				}, 0);
			}

			if ($form.release_date === '') {
				addCustomDate();
			}
		}
	});

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

			// If you want to update the form with the new date
			$form.release_date = nextGameDate;
		} catch (error) {
			console.error('Error fetching next available date:', error);
		}
	};

	function resetAll() {
		reset();
		resultsDataBody = [];
		beginning_option = null;
		if (game) {
			store.updateSelectedGameId(-1);
			store.updateView('dashboard');
		}
	}

	function handleBackToDashboard(): void {
		if (isTainted()) {
			if (confirm(APP_MESSAGES.LEAVE_PAGE)) {
				// console.log('user decided to leave GameTable');
				resetAll();
			} else {
				// console.log('user decided to stay');
			}
		} else {
			resetAll();
		}
	}
</script>

{#if beginning_option === 'edit' && game}
	<ViewNavigation
		viewName={`Spiel ${game.name} bearbeiten`}
		mainAction={handleBackToDashboard}
		mainActionText="Zurück"
	/>
{:else}
	<ViewNavigation
		viewName="Neues Spiel erstellen"
		mainAction={handleBackToDashboard}
		mainActionText="Zurück"
	/>
{/if}

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
				aria-invalid={$errors.name ? 'true' : undefined}
				bind:value={$value}
			/>
			{#if $errors.name}
				<div
					in:blur
					class="text-red-500 invalid flex items-center gap-z-ds-4 text-xs sm:max-w-[250px] mt-2"
				>
					<IconHandler iconName="error" extraClasses="min-w-4 min-h-4 w-4 h-4 text-z-ds-color-accent-100" />
					<span class="text-xs">{$errors.name}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Input date  -->
	<div
		class="w-full flex flex-col sm:flex-row sm:items-center justify-between py-z-ds-24 gap-z-ds-4"
	>
		<label class="text-md font-bold" for="release_date">Veröffentlichungsdatum:</label>
		<div class="relative">
			<input
				class="border py-z-ds-8 w-full sm:w-[250px] px-z-ds-12 border-black text-md"
				name="release_date"
				id="release_date"
				type="date"
				aria-invalid={$errors.release_date ? 'true' : undefined}
				bind:value={$form.release_date}
			/>
			{#if $errors.release_date}
				<div
					in:blur
					class="text-red-500 invalid flex items-center gap-z-ds-4 text-xs sm:max-w-[250px] mt-2"
				>
					<IconHandler iconName="error" extraClasses="min-w-4 min-h-4 w-4 h-4 text-z-ds-color-accent-100" />
					<span class="text-xs">{$errors.release_date}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Input checkbox actice  -->
	<div class="w-full flex items-center justify-between my-z-ds-16">
		<label class="text-md font-bold" for="published">Aktiv:</label>
		<input
			class="accent-black border py-z-ds-8 px-z-ds-12 border-black text-md w-5 h-5"
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

	<div class="relative overflow-x-auto overflow-y-visible">
		<table class="w-full text-sm text-left rtl:text-right text-gray-900">
			<thead>
				<tr>
					<th>Nr</th>
					<th>Frage</th>
					<th>Antwort</th>
					<th>X</th>
					<th>Y</th>
					<th>Dir.</th>
					<th>Beschreibung</th>
					{#if beginning_option !== 'edit' && !game}
						<th class="!border-0">
							<button
								title="Add new row"
								class="z-ds-button z-ds-button-outline font-light min-w-[30px]"
								type="button"
								onclick={addRow}>+</button
							>
						</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each $questionValues as _, i}
					<tr
						in:blur={{ duration: 300, delay: 0, easing: cubicInOut }}
						out:blur={{ duration: 300, delay: 0, easing: cubicInOut }}
					>
						<td>
							<input
								name="nr"
								type="number"
								class="w-full bg-transparent"
								aria-invalid={$questionErrors?.[i]?.nr ? 'true' : undefined}
								bind:value={$questionValues[i].nr}
							/>
						</td>
						<td class="w-[220px]">
							<textarea
								name="question"
								class="w-full bg-transparent"
								aria-invalid={$questionErrors?.[i]?.question ? 'true' : undefined}
								bind:value={$questionValues[i].question}
							></textarea>
						</td>
						<td class="w-[150px]">
							<textarea
								name="answer"
								class="w-full bg-transparent"
								aria-invalid={$questionErrors?.[i]?.answer ? 'true' : undefined}
								bind:value={$questionValues[i].answer}
							></textarea>
						</td>
						<td>
							<input
								name="xc"
								type="number"
								class="w-full bg-transparent"
								aria-invalid={$questionErrors?.[i]?.xc ? 'true' : undefined}
								bind:value={$questionValues[i].xc}
							/>
						</td>
						<td>
							<input
								name="yc"
								type="number"
								class="w-full bg-transparent"
								aria-invalid={$questionErrors?.[i]?.yc ? 'true' : undefined}
								bind:value={$questionValues[i].yc}
							/>
						</td>
						<td>
							<input
								name="direction"
								class="w-full bg-transparent"
								aria-invalid={$questionErrors?.[i]?.direction ? 'true' : undefined}
								bind:value={$questionValues[i].direction}
							/>
						</td>

						<td class="w-[220px]">
							<textarea
								name="description"
								class="w-full bg-transparent"
								aria-invalid={$questionErrors?.[i]?.description ? 'true' : undefined}
								bind:value={$questionValues[i].description}
							></textarea>
						</td>

						{#if beginning_option !== 'edit' && !game}
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
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if $errors.questions?._errors || $questionErrors.some((error) => error.nr || error.xc || error.yc || error.direction || error.description || error.question || error.answer)}
		<div
			role="alert"
			aria-atomic="true"
			class="flex flex-col justify-center mx-auto mt-12 w-fit border-red-500 border text-red-500 p-4"
		>
			<div class="flex items-center gap-3 mb-3">
				<IconHandler iconName="error" extraClasses="w-4 h-4 text-z-ds-color-accent-100" />
				<span id="error-heading">Bitte, korrigieren Sie die Fehler hier:</span>
			</div>

			<ul
				aria-live="assertive"
				class="flex flex-col justify-center list-inside list-disc max-w-[300px]"
				aria-labelledby="error-heading"
			>
				{#each $questionErrors as _i, i}
					{#if $questionErrors?.[i]?.nr}
						<li class="px-2 text-sm">
							[R: {i + 1}] - {$questionErrors?.[i]?.nr}
						</li>
					{/if}
					{#if $questionErrors?.[i]?.xc}
						<li class="px-2 text-sm">
							[R: {i + 1}] - {$questionErrors?.[i]?.xc}
						</li>
					{/if}
					{#if $questionErrors?.[i]?.yc}
						<li class="px-2 text-sm">
							[R: {i + 1}] - {$questionErrors?.[i]?.yc}
						</li>
					{/if}
					{#if $questionErrors?.[i]?.direction}
						<li class="px-2 text-sm">
							[R: {i + 1}] - {$questionErrors?.[i]?.direction}
						</li>
					{/if}
					{#if $questionErrors?.[i]?.description}
						<li class="px-2 text-sm">
							[R: {i + 1}] - {$questionErrors?.[i]?.description}
						</li>
					{/if}
					{#if $questionErrors?.[i]?.question}
						<li class="px-2 text-sm">
							[R: {i + 1}] - {$questionErrors?.[i]?.question}
						</li>
					{/if}
					{#if $questionErrors?.[i]?.answer}
						<li class="px-2 text-sm">
							[R: {i + 1}] - {$questionErrors?.[i]?.answer}
						</li>
					{/if}
				{/each}

				{#if $errors.questions?._errors}
					<li class="px-2 text-sm">Errors: {$errors.questions._errors}</li>
				{/if}
			</ul>
		</div>
	{/if}

	<div class="flex flex-row gap-4 items-center my-12 mx-auto w-full justify-center">
		<button class="z-ds-button" type="submit">
			{#if beginning_option === 'edit'}
				Spiel speichern
			{:else}
				Neues Spiel erstellen
			{/if}
		</button>
	</div>
</form>

<style>
	textarea {
		field-sizing: content;
	}
</style>
