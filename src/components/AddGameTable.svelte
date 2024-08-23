<script lang="ts">
	import SuperDebug, { superForm } from 'sveltekit-superforms';
	import type { PageData } from '../routes/$types';
	import GameRow from './GameRow.svelte';
	import { dev } from '$app/environment';
	import { toast } from '@zerodevx/svelte-toast';
	import { onMount } from 'svelte';
	import Separator from './Separator.svelte';
	import { blur } from 'svelte/transition';
	import ErrorIcon from '$components/icons/HasErrorIcon.svelte';
	import IconHandler from './icons/IconHandler.svelte';

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
		onUpdate({ form }) {
			toast.push('⭐️ Game amazingly added! Redirecting to main dashboard...', {
				initial: 0,
				theme: {
					'--toastBackground': '#292929'
				}
			});

			setTimeout(() => {
				window.location.href = '/';
			}, 3000);
			// TODO: get the data from the previous form, edited and send it to the backend transformed
			console.log('it is working', form);
		},
		onUpdated({ form }) {
			if (form.valid) {
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
	function removeRow() {
		confirm('Are you sure you want to remove the last row?') && resultsDataBody.pop();
	}

	onMount(() => {
		setTimeout(() => {
			form.set({
				...form,
				name: 'Game3023',
				questions: {
					// @ts-ignore
					...form.questions,
					...resultsDataBody
				}
			});
		}, 200);
	});

	$effect(() => {
		form.set({
			...form,
			questions: {
				// @ts-ignore
				...form.questions,
				...resultsDataBody
			}
		});
	});

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

<SuperDebug collapsible={true} collapsed data={$form} display={dev} />

<form class="my-z-ds-24" method="POST" enctype="multipart/form-data" use:enhance>
	<!-- Input text name  -->
	<div class="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-z-ds-24 relative gap-z-ds-4">
		<label class="text-md font-bold" for="game_name">Name:</label>
		<div class="relative">
			<input
				class="border py-z-ds-8 w-full sm:w-[250px] px-z-ds-12 invalid:border-red-600 border-black rounded-lg text-md"
				name="game_name"
				id="game_name"
				type="text"
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
	<div class="w-full flex flex-col sm:flex-row sm:items-center justify-between py-z-ds-24 gap-z-ds-4">
		<label class="text-md font-bold" for="release_date">Date:</label>
		<div class="relative">
		<input
			class="border py-z-ds-8 w-full sm:w-[250px] px-z-ds-12 border-black rounded-lg text-md"
			name="release_date"
			id="release_date"
			type="date"
			aria-invalid={$errors.release_date || customDateError ? 'true' : undefined}
			bind:value={$form.release_date}
		/>
		{#if $errors.release_date}<span style="color: red;" class="invalid">{$errors.release_date}</span>{/if}
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
		<label class="text-md font-bold" for="published">Published:</label>
		<input
			class="accent-black border py-z-ds-8 px-z-ds-12 border-black rounded-lg text-md"
			name="published"
			id="published"
			type="checkbox"
			bind:checked={$form.published}
		/>
	</div>

	<Separator />

	<div class="flex justify-between items-center w-full gap-z-ds-8 my-z-ds-24">
		<div class="font-bold text-nowrap">Questions of the game</div>

		<div class="flex w-full justify-end gap-z-ds-4">
			<button
				title="Remove last row"
				class="z-ds-button z-ds-button-outline min-w-[30px]"
				type="button"
				onclick={removeRow}>-</button
			>
			<button
				title="Add new row"
				class="z-ds-button z-ds-button-outline min-w-[30px]"
				type="button"
				onclick={addRow}>+</button
			>
		</div>
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
				</tr>
			</thead>
			<tbody>
				{#each resultsDataBody as row, i (i)}
					<tr>
						{#each row as cell, j (j)}
							<GameRow bind:dataToBind={resultsDataBody[i][j]} />
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="flex flex-row gap-4 items-center my-12 mx-auto w-full justify-center">
		<button class="z-ds-button" type="submit">Create New Game</button>
	</div>
</form>