<script lang="ts">
	import type { View } from "$types";
	import type { PageData } from "../routes/$types";

    let {
        data,
        view = $bindable()
    }: {
        data: PageData;
        view: View;
    } = $props();


    const handleBackToDashboard = () => {
        view = "dashboard";
    }
</script>

<div class="max-w-3xl p-z-ds-20 bg-z-ds-general-white-100 border border-z-ds-general-black-100 rounded-lg mx-auto">
	<nav class="flex justify-between w-full items-center mb-z-ds-12">
		<div class="flex flex-col">
			<span class="font-bold">Eckchen</span>
			<span class="text-z-ds-general-black-80 text-xs">Spiel XXX bearbeiten</span>
		</div>

		<button class="z-ds-button" onclick={handleBackToDashboard}> Zurueck </button>
	</nav>


</div>