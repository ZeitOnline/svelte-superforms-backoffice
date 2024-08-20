<script lang="ts">
	let {
		isNewGame = $bindable()
	}: {
		isNewGame: boolean;
	} = $props();

	function handleNewGameView() {
		isNewGame = true;
		console.log(isNewGame);
	}
</script>

<div class="max-w-2xl p-5 bg-white border border-black rounded-lg mx-auto">
	<nav class="flex justify-between w-full items-center mb-12">
		<div class="flex flex-col">
			<span class="font-bold">Eckchen</span>
			<span class="text-gray-700 text-xs">Dashboard</span>
		</div>

		<button class="z-ds-button" onclick={handleNewGameView}> Neues Spiel erstellen </button>
	</nav>
</div>
