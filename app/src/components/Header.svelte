<script lang="ts">
	// import { page } from '$app/state';
	import { EckchenLogo, WortigerLogo } from './games';
	import ZeitSpieleLogo from './ZeitSpieleLogo.svelte';
	import { getToastState } from '$lib/toast-state.svelte';
    import { CURRENT_GAME_CONFIG } from '../config/games.config';

	const toastManager = getToastState()

	function handleLogOut() {
		toastManager.add('Erfolgreich abgemeldet', 'Sie wurden erfolgreich abgemeldet.');
	}

	// console.log(page.route.id, 'Header route ID');
</script>

<header class="flex flex-col sm:flex-row justify-between items-center w-full mb-12 gap-5">
	<ZeitSpieleLogo classExtra="w-32 h-auto" />

	<div class="flex items-center justify-between gap-3">
		{#if CURRENT_GAME_CONFIG.label === 'Eckchen'}
			<EckchenLogo classExtra="w-6 h-6" />
			<h1 class="text-sm font-bold">Eckchen</h1>
		{:else if CURRENT_GAME_CONFIG.label === 'Wortiger'}
			<WortigerLogo classExtra="w-6 h-6" />
			<h1 class="text-sm font-bold">Wortiger</h1>
		{/if}
	</div>

	<div>
		<button class="text-z-ds-color-black-80 text-sm" onclick={handleLogOut}>Ausloggen</button>
	</div>
</header>
