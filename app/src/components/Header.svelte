<script lang="ts">
	import { EckchenLogo, WortigerLogo } from './games';
	import ZeitSpieleLogo from './ZeitSpieleLogo.svelte';
    import { goto } from '$app/navigation';

	let { gameName }: { gameName?: string } = $props();

	function handleGameChange(event: Event) {
		const value = (event.target as HTMLSelectElement).value;
		if (value === 'eckchen') goto('/eckchen');
		else if (value === 'wortiger') goto('/wortiger');
	}
</script>

<header class="flex flex-col sm:flex-row justify-between items-center w-full mb-12 gap-5">
	<a href="/">
		<ZeitSpieleLogo classExtra="w-32 h-auto" />
	</a>

	<div class="flex items-center justify-between gap-3">
		{#if gameName === 'Eckchen'}
			<EckchenLogo classExtra="w-6 h-6" />
		{:else if gameName === 'Wortiger'}
			<WortigerLogo classExtra="w-6 h-6" />
		{/if}
	</div>

	<select class="border border-black p-1" name="game" id="game" onchange={handleGameChange}>
		<option value="eckchen" selected={gameName === 'Eckchen'}>Eckchen</option>
		<option value="wortiger" selected={gameName === 'Wortiger'}>Wortiger</option>
	</select>

</header>
