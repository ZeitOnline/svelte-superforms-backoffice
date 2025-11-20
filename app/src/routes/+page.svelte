<script lang="ts">
    import { resolve } from '$app/paths';
    import ViewWrapper from '$components/ViewWrapper.svelte';
    import { EckchenLogo, WortigerLogo } from '$components/games';
</script>

<ViewWrapper>
	<h1 class="font-bold text-black text-center text-3xl">Spielkatalog</h1>

	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
		<a href={resolve(`/wortiger`)} class="hover:bg-gray-100 focus:bg-gray-100 border border-black flex p-4 items-center justify-between">
			<span class="font-bold">Wortiger</span>
			<WortigerLogo classExtra="w-12 h-12" />
		</a>

		<a href={resolve(`/eckchen`)} class="hover:bg-gray-100 focus:bg-gray-100 border border-black flex p-4 items-center justify-between">
			<span class="font-bold">Eckchen</span>
			<EckchenLogo classExtra="w-12 h-12" />
		</a>
	</div>
</ViewWrapper>
