<script lang="ts">
	import EckchenLogo from './EckchenLogo.svelte';
	import ZeitSpieleLogo from './ZeitSpieleLogo.svelte';
	import { getToastState } from '$lib/toast-state.svelte';
	
	const toastManager = getToastState()

	function handleLogOut() {
		toastManager.add('Erfolgreich abgemeldet', 'Sie wurden erfolgreich abgemeldet.');
	}
</script>

<header class="flex flex-col sm:flex-row justify-between items-center w-full mb-12 gap-5">
	<ZeitSpieleLogo classExtra="w-32 h-auto" />

	<div class="flex items-center justify-between gap-3">
		<EckchenLogo classExtra="w-6 h-6" />
		<h1 class="text-sm font-bold">Eckchen</h1>
	</div>

	<div>
		<button class="text-z-ds-color-black-80 text-sm" onclick={handleLogOut}>Ausloggen</button>
	</div>
</header>
