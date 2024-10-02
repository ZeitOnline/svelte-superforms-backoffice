<script lang="ts">
	let { dataToBind = $bindable(), error }: { dataToBind: any, error: string | undefined } = $props();

</script>

<td>
	<textarea class="w-full bg-transparent" bind:value={dataToBind}></textarea>
	{#if error}
		<span class="text-red-500 invalid text-xs">{error}</span>
	{/if}
</td>

<style>
	textarea {
		field-sizing: content;
	}
</style>