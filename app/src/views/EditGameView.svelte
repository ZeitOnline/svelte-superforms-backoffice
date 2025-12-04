<script lang="ts">
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import type { BeginningOptions, GameComplete, QuestionComplete } from '$types';
  import GameTableWrapper from '$components/GameTableWrapper.svelte';
  import { onMount } from 'svelte';
  import { getAllQuestionsByGameId } from '$lib/games/eckchen';
  import { view } from '$stores/view-state-store.svelte';

  let { data, gameName } = $props();

  let beginning_option: BeginningOptions = $state('edit');
  const game = data.games.find((game: GameComplete) => game.id === view.selectedGameId);

  let isLoaded = $state(false);

  // Specific for Eckchen
  let resultsDataBody: string[][] = $state([]);

  async function populateResultBodyForGame(id: number) {
    const questions = await getAllQuestionsByGameId(id);
    game.questions = questions;
    resultsDataBody = questions.map((question: QuestionComplete) => {
      return [
        String(question.nr),
        String(question.question),
        String(question.answer),
        String(question.xc),
        String(question.yc),
        String(question.direction),
        String(question.description),
      ];
    });

    console.log('Results data body populated:', resultsDataBody);
  }

  onMount(async () => {
    if (!game) {
      view.updateSelectedGameId(-1);
      view.updateView('dashboard');
    } else {
      console.log('Calling this...');
      await populateResultBodyForGame(game.id);
    }

    isLoaded = true;
  });
</script>

{#if !isLoaded}
  <p>Loading...</p>
{:else}
  <ViewWrapper>
    <GameTableWrapper {data} {game} bind:beginning_option bind:resultsDataBody {gameName} />
  </ViewWrapper>
{/if}
