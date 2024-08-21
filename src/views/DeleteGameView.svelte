<script lang="ts">
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { Game, View } from '$types';
	import { toast } from '@zerodevx/svelte-toast';

	let {
		selectedGameId = $bindable(),
		games,
		view = $bindable()
	}: {
		selectedGameId: string;
		games: Game[];
		view: View;
	} = $props();

	const handleBackToDashboard = () => {
		view = 'dashboard';
		selectedGameId = '';
	};

    const handleDeleteFromList = (id: string) => {
        toast.push("Game deleted (Not working yet)", {
            theme: {
                '--toastBackground': '#333',
                '--toastColor': '#fff',
            },
        });
        view = 'dashboard';
        selectedGameId = '';
        console.log("this deleted the game with id: ", id);
    };


	const game = games.find((game: any) => game.id === selectedGameId);
</script>

<ViewWrapper>
    <div class="flex flex-col items-center gap-z-ds-14 py-z-ds-32">

        {#if game !== undefined}
            <div>
                Are you sure you want to delete the game <strong>{game.name}</strong>?
            </div>
            <div class="flex justify-end gap-z-ds-8">
                <button class="z-ds-button z-ds-button-outline" onclick={handleBackToDashboard}>Cancel</button>
                <button class="z-ds-button" onclick={() => handleDeleteFromList(game.id)}>Delete</button>
            </div>
        {/if}
    </div>
</ViewWrapper>
