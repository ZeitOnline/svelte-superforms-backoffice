<script lang="ts">
	import IconHandler from './icons/IconHandler.svelte';

	let {
		currentPage = $bindable(),
		totalPages,
	}: {
		currentPage: number;
		totalPages: number;
	} = $props();

	// Navigate to the previous page
	const prevPage = () => {
		if (currentPage > 1) currentPage -= 1;
	};

	// Navigate to the next page
	const nextPage = () => {
		if (currentPage < totalPages) currentPage += 1;
	};
</script>

<!-- Pagination controls -->
{#if totalPages > 1}
	<nav
		aria-label="
		Pagination controls
		Current page: {currentPage}
		Total pages: {totalPages}
	"
		class="flex justify-center gap-z-ds-8 items-center mt-z-ds-16"
	>
		<button
			aria-label="First page"
			onclick={() => (currentPage = 1)}
			class="text-[9px] z-ds-button px-1"
			disabled={currentPage === 1}
		>
			First
		</button>
		<button
			aria-label="Previous page"
			onclick={prevPage}
			class="z-ds-button px-1"
			disabled={currentPage === 1}
		>
			<IconHandler iconName="chevron" extraClasses="rotate-180" />
		</button>

		<div class="text-xs font-bold">
			<span>Seite</span>
			<span aria-label="Current page" aria-current="page">{currentPage}</span>
			<span>von</span>
			<span>{totalPages}</span>
		</div>

		<button
			aria-label="Next page"
			onclick={nextPage}
			class="z-ds-button px-1"
			disabled={currentPage === totalPages}
		>
			<IconHandler iconName="chevron"  />
		</button>
		<button
			aria-label="Last page"
			onclick={() => (currentPage = totalPages)}
			class="text-[9px] z-ds-button px-1"
			disabled={currentPage === totalPages}
		>
			Last
		</button>
	</nav>
{/if}
