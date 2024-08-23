<script lang="ts">
	let { extraClasses }: { extraClasses?: string } = $props();
</script>

<svg
	aria-hidden="true"
	class={extraClasses}
	xmlns="http://www.w3.org/2000/svg"
	width="18"
	height="18"
	viewBox="0 0 18 18"
	fill="none"
>
	<circle cx="9" cy="9" r="7.25" stroke="currentColor" stroke-width="1.5" />
	<path d="M10 4H8L8.25 11H9.75L10 4Z" fill="currentColor" />
	<path d="M8.25 12H9.75V13.5H8.25V12Z" fill="currentColor" />
</svg>
