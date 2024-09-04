<script lang="ts">
	import PopOver from "./PopOver.svelte";

    let {
        resetAllFilters,
		idButtonOpener,
		popoverOpener,
		popoverContent
	}: 
    { 
        resetAllFilters: () => void;
        idButtonOpener: string; 
        popoverOpener: () => ReturnType<import("svelte").Snippet>; 
        popoverContent: () => ReturnType<import("svelte").Snippet> 
    } = $props();
</script>

<!-- Filters -->
<div class="flex justify-end my-6 gap-2 items-center">
	<button class="border border-black hover:bg-gray-200 focus:bg-gray-200 px-2 py-0.5 text-xs" onclick={resetAllFilters}>
		Reset filters
	</button>
	<PopOver {idButtonOpener} {popoverContent} {popoverOpener} />
</div>