<script lang="ts">
	let { dataToBind = $bindable() }: { dataToBind: string | number | boolean | null | undefined } = $props();
</script>

<td>
	<textarea class="w-full bg-transparent" bind:value={dataToBind}></textarea>
</td>

<style>
	textarea {
		field-sizing: content;
	}
</style>
