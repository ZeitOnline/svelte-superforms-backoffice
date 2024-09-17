<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import Papa from 'papaparse';
	import type { PageData } from '../routes/$types';
	import { dev } from '$app/environment';
	import ViewNavigation from './ViewNavigation.svelte';

	let {
		resultsDataBody = $bindable(),
		data,
		beginning_option = $bindable()
	}: {
		resultsDataBody: string[][];
		data: PageData;
		beginning_option: 'scratch' | 'csv' | null;
	} = $props();

	const { form, message, constraints, errors, enhance, isTainted, reset } = superForm(
		data.generateGameForm,
		{
			resetForm: false,
			validators: false,
			SPA: true,
			taintedMessage: true,
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
					Papa.parse(form.data.csv, {
						// header: true,
						complete: function (results) {
							const body = results.data.slice(1) as string[][];

							if (!body) {
								console.log('no rows found');
								return;
							}

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
		}
	);

	let isDragging = $state(false);

	function handleDragEnter(event: DragEvent) {
		isDragging = true;
		event.preventDefault();
	}

	function handleDragLeave(event: DragEvent) {
		isDragging = false;
		event.preventDefault();
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function resetAll(): void {
		reset();
		resultsDataBody = [];
		beginning_option = null;
	}

	function handleBackToDashboard(): void {
		if (isTainted()) {
			if (confirm('Are you sure you want to leave this page?')) {
				console.log('user decided to leave GenerateGameTable');
				resetAll();
			} else {
				console.log('user decided to stay');
			}
		} else {
			resetAll();
		}
	}
</script>

{#if $message}<h1>{$message}</h1>{/if}

<ViewNavigation
	viewName="Neues Spiel erstellen"
	mainAction={handleBackToDashboard}
	mainActionText="Zurück"
/>

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
