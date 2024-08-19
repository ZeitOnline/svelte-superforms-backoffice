<script lang="ts">
	import SuperDebug, { superForm } from 'sveltekit-superforms';
	import type { PageData } from '../routes/$types';
	import GameRow from './GameRow.svelte';
	import { dev } from '$app/environment';
	import { toast } from '@zerodevx/svelte-toast'

	let {
		resultsDataHeader = $bindable(),
		resultsDataBody = $bindable(),
		data
	}: {
		resultsDataHeader: Array<string>;
		resultsDataBody: string[][];
		data: PageData;
	} = $props();

	const { form, message, constraints, errors, enhance } = superForm(data.saveGameForm, {
		resetForm: false,
		validators: false,
		SPA: true,
		// onChange(event) {
		// 	if (event.target) {
		// 		// Form input event
		// 		console.log(event.path, 'was changed with', event.target, 'in form', event.formElement);
		// 	} else {
		// 		// Programmatic event
		// 		console.log('Fields updated:', event.paths);
		// 	}
		// },
		onUpdate({ form }) {
			toast.push('⭐️ Game amazingly added! Redirecting to main dashboard...', {
				initial: 0,
				theme: {
					'--toastBackground': '#292929',
				}
			})

			setTimeout(() => {
				window.location.href = '/';
			}, 3000)
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
	// function removeRow() {
	// 	resultsDataBody.update((rows) => {
	// 		if (rows.length > 0) {
	// 			return rows.slice(0, -1); // Remove the last row
	// 		}
	// 		return rows;
	// 	});
	// }

	$effect(() => {
		form.set({
			...form,
			games: {
				// @ts-ignore
				...form.games,
				...resultsDataBody
			}
		});
	});
</script>

<SuperDebug collapsible={true} data={$form} display={dev} />

<div class="flex w-full justify-end my-6">
	<button title="Add new row" class="z-ds-button flex justify-end" type="button" onclick={addRow}>+</button>
</div>

<form method="POST" enctype="multipart/form-data" use:enhance>
	<div class="relative overflow-x-auto">
		<table class="w-full text-sm text-left rtl:text-right text-gray-900">
			<thead class="text-xs uppercase bg-black text-white">
				<tr>
					{#each resultsDataHeader as column}
						<th class="p-3">{column}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each resultsDataBody as row, i (i)}
					<tr class="odd:bg-gray-200">
						{#each row as cell, j (j)}
							<GameRow bind:dataToBind={resultsDataBody[i][j]} />
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<div class="flex flex-row gap-4 items-center my-12 mx-auto w-full justify-center">
		<!-- <button class="z-ds-button" type="button" onclick={removeRow}>-</button> -->
		<button class="z-ds-button" type="submit">Create New Game</button>
	</div>
</form>
