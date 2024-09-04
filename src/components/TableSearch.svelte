<script lang="ts">
	import IconHandler from './icons/IconHandler.svelte';

	let {
		searchTerm = $bindable(),
        idSearch,
        ariaLabel,
        ariaControls
	}: {
		searchTerm: string;
        idSearch: string;
        ariaLabel: string;
        ariaControls: string;
	} = $props();

	console.log('ts');
</script>

<div class="flex items-center justify-end gap-z-ds-8">
	<IconHandler iconName="search" />
	<input
		bind:value={searchTerm}
		placeholder="Game4024"
		class="placeholder:text-xs text-xs py-z-ds-4 border-b border-z-ds-general-black-100 px-z-ds-8"
		type="search"
		name={idSearch}
		id={idSearch}
		aria-label={ariaLabel}
		aria-controls={ariaControls}
	/>
</div>
