<script lang="ts">
	import SuperDebug, { fileProxy } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { superForm } from 'sveltekit-superforms';
	import Papa from 'papaparse';
	let { data } = $props<{ data: PageData }>();
	let IS_DEBUG = false;

	const { form, message, constraints, errors, enhance } = superForm(data.form, {
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
				console.log('form is valid');
				console.log('form:', form);
				console.log(form.data.csv);
				Papa.parse(form.data.csv, {
					header: true,
					complete: function (results) {
						console.log('we have parsed the csv');
						console.log(results.data);
					}
				});

				console.log('we are sending to the database the following:');
			}
		},
		onUpdated({ form }) {
			if (form.valid) {
				// Successful post! Do some more client-side stuff,
				// like showing a toast notification.
				console.log('toastchen here!');
			}
		}
	});
</script>

<SuperDebug data={$form} />

{#if $message}<h1>{$message}</h1>{/if}

<form method="POST" enctype="multipart/form-data" use:enhance>
	<label for="name">Names</label>
	<input
		type="text"
		name="name"
		aria-invalid={$errors.name ? 'true' : undefined}
		bind:value={$form.name}
	/>
	{#if $errors.name}<span style="color: red;" class="invalid">{$errors.name}</span>{/if}

	<!-- <label for="image">
		Upload one image, max 100 Kb:
		<input type="file" name="image" accept="image/png, image/jpeg" bind:files={$file} />
	</label>
	{#if $errors.image}<span style="color: red;">{$errors.image}</span>{/if} -->

	<label for="email">E-mail</label>
	<input type="email" name="email" bind:value={$form.email} {...$constraints.email} />

	<label for="csv">
		Upload one CSV, max 100 Kb:
		<input
			type="file"
			name="csv"
			accept=".csv"
			oninput={(e) => ($form.csv = e.currentTarget.files?.item(0) as File)}
		/>
	</label>
	{#if $errors.csv}<span style="color: red;">{$errors.csv}</span>{/if}

	<div><button>Submit</button></div>
</form>


