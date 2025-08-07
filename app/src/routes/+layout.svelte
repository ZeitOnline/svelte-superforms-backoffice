<script>
    import '../design-system.css'
	import '../app.css';
	import BreakpointsDebug from '$components/BreakpointsDebug.svelte';
	import Toaster from '$components/toast/Toaster.svelte';
	import { setToastState } from '$lib/toast-state.svelte';
    import { CURRENT_GAME_CONFIG } from '../config/games.config';

    setToastState();
</script>

<div class="max-w-5xl w-full mx-auto px-5 md:px-12 py-24">
    <slot />
</div>

<BreakpointsDebug />
<Toaster />
