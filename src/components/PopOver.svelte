<script lang="ts">

	let positionLeft: number = $state(0);
	let positionTop: number = $state(0);

	let {
		idButtonOpener,
		popoverOpener,
		popoverContent
	}: { idButtonOpener: string; popoverOpener: any; popoverContent: any } = $props();

	let isPopoverOpen = $state(false)
	let id = `popover-${idButtonOpener}`;

	let buttonOpener = $state<HTMLButtonElement>();
	let popoverRef = $state<HTMLDivElement>();

	$effect(() => {
		window.addEventListener('resize', adjustPosition);

		popoverRef?.addEventListener('toggle', (event: any) => {
			if (event.newState === 'open') {
				adjustPosition();
				isPopoverOpen = true;
			} else {
				isPopoverOpen = false;
			}
		});

		return () => {
			popoverRef?.removeEventListener('toggle', (event: any) => {
				if (event.newState === 'open') {
				adjustPosition();
				isPopoverOpen = true;
			} else {
				isPopoverOpen = false;
			}
			});
			window.removeEventListener('resize', adjustPosition);
		};
	});

	function adjustPosition() {
		if (buttonOpener && popoverRef) {
			const buttonRect = buttonOpener.getBoundingClientRect();
			const popoverWidth = popoverRef.offsetWidth;

			positionLeft = buttonRect.right - popoverWidth;
			positionTop = buttonRect.bottom + 10;
		}
	}
</script>

<div class="relative">
	{#if popoverOpener}
	<button
		aria-label={
			isPopoverOpen
				? 'Schließe das Popover'
				: 'Öffne das Popover'
		}
		aria-expanded={isPopoverOpen ? 'true' : 'false'}
		aria-haspopup="true"
		aria-controls={id}
		bind:this={buttonOpener}
		id={idButtonOpener}
		popovertarget={id}
		popovertargetaction="toggle"
		class="border border-black px-2 py-1 hover:bg-gray-200"
	>
		{@render popoverOpener()}
	</button>
	{/if}

	{#if popoverContent}
		<div
			bind:this={popoverRef}
			{id}
			popover="auto"
			class="border border-black p-4 bg-white z-10 w-fit"
			style="--position-left: {positionLeft}px; --position-top: {positionTop}px;"
		>
			<button

				aria-label="Schließe das Popover"
				popovertarget={id}
				popovertargetaction="hide"
				class="border border-black hover:bg-gray-200 focus:bg-gray-200 px-2 absolute right-2 top-2">x</button
			>

			{@render popoverContent()}
		</div>
	{/if}

</div>

<style>
	:popover-open {
		position: absolute;
		inset: unset;
		top: var(--position-top);
		left: var(--position-left);
		margin: 0;
	}
</style>
