<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from '../routes/$types';

	let {
		resultsDataHeader,
		resultsDataBody,
		data
	}: { resultsDataHeader: Array<string>; resultsDataBody: Array<string>; data: PageData } =
		$props();

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
			]
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

<h2>Cool table</h2>
{#if resultsDataHeader.length > 0 && resultsDataBody.length > 0}
	<form method="POST" enctype="multipart/form-data" use:enhance>
		<table>
			<thead>
				<tr>
					{#each resultsDataHeader as column}
						<th>{column}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each resultsDataBody as row, i (i)}
					<tr>
						{#each row as cell, j (j)}
							<td>
								<input type="text" oninput={
									(e) => {
										console.log(form)
									}
								} bind:value={resultsDataBody[i][j]} />
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		<button class="z-ds-button" type="submit">Create New Game</button>
	</form>
{/if}
