<script lang="ts">
	import { superForm, setError } from 'sveltekit-superforms';
	import Papa from 'papaparse';
	import type { PageData } from '../routes/$types';
	import { dev } from '$app/environment';
	import ViewNavigation from './ViewNavigation.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { generateGameSchema } from '../schemas/generate-game';

	let {
		resultsDataBody = $bindable(),
		data,
		beginning_option = $bindable()
	}: {
		resultsDataBody: string[][];
		data: PageData;
		beginning_option: 'scratch' | 'csv' | null;
	} = $props();

	const { form, errors, enhance, isTainted, reset } = superForm(
		data.generateGameForm,
		{
			resetForm: false,
			validators: zodClient(generateGameSchema),
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
					Papa.parse(form.data.csv, {
						// header: true,
						complete: function (results) {
							const fieldSize = (results.data[0] as any).length;

							if (fieldSize !== 7) {
								setError(form, 'csv', 'Die CSV-Datei muss 7 Spalten haben.');
								return;
							}

							const body = results.data.slice(1) as string[][];

							if (!body) {
								setError(form, 'csv', 'Die CSV-Datei muss Spalten haben.');
								return;
							}

							resultsDataBody.push(...body);
						}
					});
				}
			},
		}
	);

	let isDragging = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	function handleGlobalDrop(event: DragEvent) {
		event.preventDefault();
		if (isDragging) {
			isDragging = false;

			const file = event.dataTransfer?.files?.[0];
			// Filetype and size is validated through zod schema
			if (file) {
				$form.csv = file;
				if (fileInput) fileInput.files = event.dataTransfer?.files;
			}
		}
	}

	$effect(() => {
		window.addEventListener('dragover', handleDragOver);
		window.addEventListener('drop', handleGlobalDrop);
		return () => {
			window.removeEventListener('dragover', handleDragOver);
			window.removeEventListener('drop', handleGlobalDrop);
		};
	});

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
			class="peer opacity-0 pointer-events-auto text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 p-4"
			type="file"
			name="csv"
			accept=".csv"
			oninput={(e) => ($form.csv = e.currentTarget.files?.item(0) as File)}
		/>
		<label
			class="text-sm w-fit -mt-14 flex flex-col justify-center text-center items-center font-bold gap-2 peer-focus:outline peer-focus:outline-offset-2 peer-focus:outline-2 peer-focus:outline-blue-500"
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

	{#if $errors.csv}<span class="border-red-500 border text-red-500 my-5 px-2 py-1 text-sm">Error: {$errors.csv}</span>{/if}

	{#if $form.csv}
		<div class="flex flex-col items-center my-12 mx-auto w-full justify-center">
			<button class="z-ds-button"> Submitten </button>
		</div>
	{/if}
</form>