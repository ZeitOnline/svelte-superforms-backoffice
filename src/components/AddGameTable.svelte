<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from '../routes/$types';

	let {
		resultsDataHeader = $bindable(),
		resultsDataBody = $bindable(),
		data
	}: {
		resultsDataHeader: Array<string>;
		resultsDataBody: Array<string>;
		data: PageData;
	} = $props();

	const { form, message, constraints, errors, enhance } = superForm(data.saveGameForm, {
		resetForm: false,
		validators: false,
		SPA: true,
		onUpdate({ form }) {
			const fakeData = [
				{
					name: 'Frieder',
					age: 25
				},
				{
					name: 'Manuel',
					age: 30
				}
			];
			// TODO: get the data from the previous form, edited and send it to the backend transformed
			console.log('it is working, Frieder', form);
		},
		onUpdated({ form }) {
			if (form.valid) {
				// Successful post! Do some more client-side stuff,
				// like showing a toast notification.
				// console.log('toastchen here!');
			}
		}
	});
</script>

{#if resultsDataHeader.length > 0 && resultsDataBody.length > 0}
	<form class="my-12" method="POST" enctype="multipart/form-data" use:enhance>
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
								<td class={`p-3`}>
									<!-- <input type="text" oninput={
									(e) => {
										console.log(form)
									}
								} bind:value={resultsDataBody[i][j]} /> -->
									<textarea class="w-full bg-transparent" bind:value={resultsDataBody[i][j]}
									></textarea>
									<!-- <div>
									{resultsDataBody[i][j]}
								</div> -->
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="flex flex-col items-center my-12 mx-auto w-full justify-center">
			<button class="z-ds-button" type="submit">Create New Game</button>
		</div>
	</form>
{/if}

<style>
	textarea {
		field-sizing: content;
	}
</style>
