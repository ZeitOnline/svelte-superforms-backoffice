<script lang="ts">
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { Game } from '$types';
	import { toast } from '@zerodevx/svelte-toast';
	import { type ViewStateStore } from '../stores/view-state-store.svelte';

    let { store, games }: { store: ViewStateStore; games: Game[] } = $props();

	const handleBackToDashboard = () => {
		store.updateView('dashboard');
        store.updateSelectedGameId('');
	};

    const handleDeleteFromList = (id: string) => {
        toast.push("Game deleted (Not working yet)", {
            theme: {
                '--toastBackground': '#333',
                '--toastColor': '#fff',
            },
        });
        store.updateView('dashboard');
        store.updateSelectedGameId('');
        console.log("this deleted the game with id: ", id);
    };

	const game = games.find((game: Game) => game.id === store.selectedGameId);
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
