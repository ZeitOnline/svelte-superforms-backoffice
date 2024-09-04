<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import Papa from 'papaparse';
	import type { PageData } from '../routes/$types';
	import { dev } from '$app/environment';

	let { resultsDataBody = $bindable(), data }: { resultsDataBody: string[][]; data: PageData } =
		$props();

	const { form, message, constraints, errors, enhance } = superForm(data.generateGameForm, {
		resetForm: false,
		validators: false,
		SPA: true,
		onChange(event) {
			if (dev) {
				if (event.target) {
					// Form input event
					console.log(event.path, 'was changed with', event.target, 'in form', event.formElement);
				} else {
					// Programmatic event
					console.log('Fields updated:', event.paths);
				}
			}

			if ($form.csv) {
				isDragging = false;
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
						const body = results.data.slice(1) as string[][];

						if (!body) {
							console.log('no rows found');
							return;
						}

						console.log('body:', body);
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

	let isDragging = $state(false);

	function handleDragEnter(event: DragEvent) {
		console.log('we are dragging');
		isDragging = true;
		event.preventDefault();
	}

	function handleDragLeave(event: DragEvent) {
		console.log('we are not dragging');
		isDragging = false;
		event.preventDefault();
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}
</script>

{#if $message}<h1>{$message}</h1>{/if}

<form
	class="flex flex-col w-full items-center my-12"
	method="POST"
	enctype="multipart/form-data"
	action="?/generateGame"
	use:enhance
>
	<div class="group flex flex-col items-center w-fit">
		<input
			ondragenter={handleDragEnter}
			ondragleave={handleDragLeave}
			ondragover={handleDragOver}
			class="opacity-0 pointer-events-auto text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 p-4"
			type="file"
			name="csv"
			accept=".csv"
			oninput={(e) => ($form.csv = e.currentTarget.files?.item(0) as File)}
		/>
		<label
			class="text-sm w-fit -mt-14 flex flex-col justify-center text-center items-center font-bold gap-2"
			for="csv"
			aria-live="polite"
			aria-atomic="true"
			role="status"
			aria-dropeffect={isDragging ? 'copy' : 'none'}
		>
			<span
				class={`
				${isDragging ? 'bg-gray-200' : 'bg-white'} 
				${$form.csv ? 'bg-white' : ''}
				
				border border-black px-5 py-4 group-hover:bg-gray-200 group-focus:bg-gray-200`}
			>
				{#if isDragging}
					<span>Fast geschafft!</span>
				{:else if $form.csv}
					<p>Ausgewählte Datei: {$form.csv.name}</p>
				{:else}
					<span> Dragg und dropp eine CSV-Datei hier. Max 100kb.</span>
				{/if}
			</span>
		</label>
	</div>

	{#if $errors.csv}<span style="color: red;">{$errors.csv}</span>{/if}

	{#if $form.csv}
		<div class="flex flex-col items-center my-12 mx-auto w-full justify-center">
			<button class="z-ds-button"> Submitten </button>
		</div>
	{/if}
</form>

<style>
	input:focus + label {
		outline: 2px solid #2563eb;
		outline-offset: 2px;
	}
</style>
