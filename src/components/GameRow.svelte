<script lang="ts">
	let { dataToBind = $bindable() }: { dataToBind: any } = $props();
</script>

<td class={`border border-black p-3`}>
	<textarea class="w-full bg-transparent" bind:value={dataToBind}></textarea>
</td>

<style>
	textarea {
		field-sizing: content;
	}
</style>