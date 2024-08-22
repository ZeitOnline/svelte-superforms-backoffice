<script lang="ts">
	import type { PageData } from './$types';
	import App from '$components/App.svelte';

	let { data } = $props<{ data: PageData }>();

</script>

<App {data} />