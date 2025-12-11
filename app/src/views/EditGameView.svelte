<script lang="ts">
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import type { BeginningOptions, GameComplete, QuestionComplete } from '$types';
  import GameCreator from '$components/GameCreator.svelte';
  import { onMount } from 'svelte';
  import { getResultBodyForGame } from '$lib/games/eckchen';
  import { view } from '$stores/view-state-store.svelte';

  let { data, gameName } = $props();

  let beginning_option: BeginningOptions = $state('edit');
  const game = data.games.find((game: GameComplete) => game.id === view.selectedGameId);

  let isLoaded = $state(false);

  // Specific for Eckchen
  let resultsDataBody: string[][] = $state([]);

  onMount(async () => {
    if (!game) {
      view.updateSelectedGameId(-1);
      view.updateView('dashboard');
    } else {
      if (gameName === 'eckchen') {
        resultsDataBody = await getResultBodyForGame(game.id, game, resultsDataBody);
      }
    }

    isLoaded = true;
  });
</script>

{#if !isLoaded}
  <p>Loading...</p>
{:else}
  <ViewWrapper>
    <GameCreator {data} {game} bind:beginning_option bind:resultsDataBody {gameName} />
  </ViewWrapper>
{/if}
