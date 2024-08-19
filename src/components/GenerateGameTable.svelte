<script lang="ts">
	import SuperDebug, { superForm } from 'sveltekit-superforms';
	import Papa from 'papaparse';
	import type { PageData } from '../routes/$types';
	import { dev } from '$app/environment';

	let IS_DEBUG = false;

	let {
		resultsDataHeader = $bindable(),
		resultsDataBody = $bindable(),
		data
	}: {
		resultsDataHeader: string[];
		resultsDataBody: string[][];
		data: PageData;
	} = $props();

	const { form, message, constraints, errors, enhance } = superForm(data.generateGameForm, {
		resetForm: false,
		validators: false,
		SPA: true,
		onChange(event) {
			if (IS_DEBUG) {
				if (event.target) {
					// Form input event
					console.log(event.path, 'was changed with', event.target, 'in form', event.formElement);
				} else {
					// Programmatic event
					console.log('Fields updated:', event.paths);
				}
			}
		},
		onUpdate({ form }) {
			if (form.valid) {
				// console.log('form is valid');
				// console.log('form:', form);
				console.log('form csv: ', form.data.csv);
				Papa.parse(form.data.csv, {
					// header: true,
					complete: function (results) {
						const headers = results.data[0] as string[];
						const body = results.data.slice(1) as string[][];

						if (!headers) {
							console.log('no columns found');
							return;
						}

						if (!body) {
							console.log('no rows found');
							return;
						}

						// push the headers to the resultsDataHeader
						resultsDataHeader.push(...headers);
						resultsDataBody.push(...body);
					
					}
				});
			}
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

<SuperDebug collapsible={true} data={$form} display={dev} />

{#if $message}<h1>{$message}</h1>{/if}

<form
	class="flex flex-col items-center my-12"
	method="POST"
	enctype="multipart/form-data"
	action="?/generateGame"
	use:enhance
>
	<!-- <div>
		<label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First name</label>
		<input type="text" id="name" aria-invalid={$errors.name ? 'true' : undefined}
		bind:value={$form.name} class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="John" required />
	</div>
	{#if $errors.name}<span style="color: red;" class="invalid">{$errors.name}</span>{/if} -->

	<!-- <label for="image">
		Upload one image, max 100 Kb:
		<input type="file" name="image" accept="image/png, image/jpeg" bind:files={$file} />
	</label>
	{#if $errors.image}<span style="color: red;">{$errors.image}</span>{/if} -->

	<!-- <label for="email">E-mail</label>
	<input type="email" name="email" bind:value={$form.email} {...$constraints.email} /> -->

	<label class="text-sm flex flex-col text-center items-center font-bold gap-2" for="csv">
		Upload one CSV, max 100 Kb:
		<input
			class="max-w-[200px] border text-center border-black text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
			type="file"
			name="csv"
			accept=".csv"
			oninput={(e) => ($form.csv = e.currentTarget.files?.item(0) as File)}
		/>
	</label>
	{#if $errors.csv}<span style="color: red;">{$errors.csv}</span>{/if}

	<div class="flex flex-col items-center my-12 mx-auto w-full justify-center">
		<button class="z-ds-button">Submit</button>
	</div>
</form>
