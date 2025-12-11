<script lang="ts">
  import type {
    BeginningOptions,
    DataProps,
    GameComplete,
    GameEckchenComplete,
    GameSpellingBeeComplete,
    GameType,
    GameWortigerComplete,
  } from '$types';
  import WortigerGameForm from './games/wortiger/WortigerGameForm.svelte';
  import EckchenGameForm from './games/eckchen/EckchenGameForm.svelte';
  import SpellingBeeGameForm from './games/spelling-bee/SpellingBeeGameForm.svelte';
  import WortgeflechtGenerator from './games/wortgeflecht/WortgeflechtGenerator.svelte';

  type Props = {
    resultsDataBody: string[][];
    data: DataProps;
    game?: GameComplete;
    beginning_option: BeginningOptions;
    gameName: GameType;
  };

  let {
    resultsDataBody = $bindable(),
    data,
    game,
    beginning_option = $bindable(),
    gameName,
  }: Props = $props();
</script>


{#if gameName === 'wortiger'}
  <WortigerGameForm data={data as any} game={game as GameWortigerComplete} bind:beginning_option />
{:else if gameName === 'eckchen'}
  <EckchenGameForm
    data={data as any}
    game={game as GameEckchenComplete}
    bind:beginning_option
    bind:resultsDataBody
  />
{:else if gameName === 'spelling-bee'}
  <SpellingBeeGameForm
    data={data as any}
    game={game as GameSpellingBeeComplete}
    bind:beginning_option
    bind:resultsDataBody
  />
{:else if gameName === 'wortgeflecht'}
  <WortgeflechtGenerator data={data as any} bind:beginning_option />
{/if}
