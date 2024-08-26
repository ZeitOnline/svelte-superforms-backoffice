<script lang="ts">
	import type { IconOption } from '$types';
	import { ChevronRightIcon, EditIcon, ErrorIcon, SearchIcon, TickIcon, UploadIcon, DeleteIcon } from '.';

	let { iconName, extraClasses }: { iconName: IconOption; extraClasses?: string } = $props();
</script>

{#if iconName == 'create'}
	<TickIcon {extraClasses} />
{:else if iconName == 'update'}
	<EditIcon {extraClasses} />
{:else if iconName == 'error'}
	<ErrorIcon {extraClasses} />
{:else if iconName == 'chevron'}
	<ChevronRightIcon {extraClasses} />
{:else if iconName == 'search'}
	<SearchIcon {extraClasses} />
{:else if iconName == 'upload'}
	<UploadIcon {extraClasses} />
{:else if iconName == 'delete'}
	<DeleteIcon {extraClasses} />
{:else}
	<TickIcon {extraClasses} />
{/if}
