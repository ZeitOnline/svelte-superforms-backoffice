<script>
    import '../design-system.css'
	import '../app.css';
    import { SvelteToast } from '@zerodevx/svelte-toast'
    const options = {}
</script>

<div class="max-w-5xl w-full mx-auto px-5 md:px-12 py-24">
    <slot />
</div>

<SvelteToast {options} />
