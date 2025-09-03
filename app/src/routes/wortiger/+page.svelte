<script lang="ts">
    import App from "$components/App.svelte";
    import Header from "$components/Header.svelte";
    import type { PageData } from "../$types";

	let { data } = $props<{ data: PageData }>();
</script>

<Header gameName="wortiger" />
<App {data} />

<div class="max-w-[300px] fixed bottom-0 left-0 text-xs text-z-ds-color-black-80 p-1.5 border border-black bg-white">
    <h3 class="font-bold mb-2">Legende bei Wortiger</h3>
    <span class="text-xs"> Level 1 = 7 Buchstaben</span>
    <br />
    <span class="text-xs"> Level 2 = 6 Buchstaben</span>
    <br />
    <span class="text-xs"> Level 3 = 5 Buchstaben</span>
    <br />
    <span class="text-xs"> Level 4 = 4 Buchstaben</span>
</div>
