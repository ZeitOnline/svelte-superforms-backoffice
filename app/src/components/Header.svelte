<script lang="ts">
	import { BuchstabieneLogo, EckchenLogo, WortigerLogo } from './games';
	import ZeitSpieleLogo from './ZeitSpieleLogo.svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';

	let { gameName }: { gameName?: string } = $props();

	function handleGameChange(event: Event) {
		const value = (event.target as HTMLSelectElement).value;
		if (value === 'eckchen') goto('/eckchen');
		else if (value === 'wortiger') goto('/wortiger');
		else if (value === 'buchstabiene') goto('/buchstabiene');
	}
</script>

<header class="flex flex-col sm:flex-row justify-between items-center w-full mb-12 gap-5">
	<a href="/">
		<ZeitSpieleLogo classExtra="w-32 h-auto" />
	</a>

	<div class="flex items-center justify-between gap-3">
		{#if gameName === 'eckchen'}
			<EckchenLogo classExtra="w-6 h-6" />
		{:else if gameName === 'wortiger'}
			<WortigerLogo classExtra="w-6 h-6" />
		{:else if gameName === 'buchstabiene'}
			<BuchstabieneLogo classExtra="w-6 h-6" />
		{/if}
	</div>

	<select class="border border-black p-1 min-w-[160px]" name="game" id="game" onchange={handleGameChange}>
		<option value="buchstabiene" selected={gameName === 'buchstabiene'}>Buchstabiene</option>
		<option value="eckchen" selected={gameName === 'eckchen'}>Eckchen</option>
		<option value="wortiger" selected={gameName === 'wortiger'}>Wortiger</option>
	</select>

</header>

{#if gameName === "wortiger"}
    <nav aria-label="Wortiger Navigation" class="flex justify-end gap-2 mb-4">
      <a class:!bg-gray-300={page.route.id == '/wortiger'}
      class="bg-gray-100 hover:bg-gray-300 px-3 py-1 border border-black text-xs" href="/wortiger">Dashboard</a>
      <a class:!bg-gray-300={page.route.id == '/wortiger/wortliste'}
      class="bg-gray-100 hover:bg-gray-300 px-3 py-1 border border-black text-xs" href="/wortiger/wortliste">Wortliste</a>
    </nav>
{/if}
