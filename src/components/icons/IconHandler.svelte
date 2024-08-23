<script lang="ts">
	import type { IconOption } from "$types";
	import ChevronRightIcon from "./ChevronRightIcon.svelte";
	import EditIcon from "./EditIcon.svelte";
	import ErrorIcon from "./HasErrorIcon.svelte";
	import SearchIcon from "./SearchIcon.svelte";
	import TickIcon from "./TickIcon.svelte";

    let { iconName, extraClasses }: { iconName: IconOption, extraClasses?: string } = $props();
</script>

{#if iconName == "create"}
    <TickIcon {extraClasses} />
{:else if iconName == "update"}
    <EditIcon {extraClasses} />
{:else if iconName == "delete" || iconName == "error"}
    <ErrorIcon {extraClasses} />
{:else if iconName == "chevron"}
    <ChevronRightIcon {extraClasses} />
{:else if iconName == "search"}
    <SearchIcon {extraClasses} />
{:else}
    <TickIcon {extraClasses} />
{/if}