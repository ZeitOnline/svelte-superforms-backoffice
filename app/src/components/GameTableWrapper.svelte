<script lang="ts">
  import WortigerGameForm from './games/wortiger/WortigerGameForm.svelte';
  import EckchenGameForm from './games/eckchen/EckchenGameForm.svelte';
  import type {
    BeginningOptions,
    DataProps,
    GameComplete,
    GameEckchenComplete,
    GameSpellingBeeComplete,
    GameType,
    GameWortgeflechtComplete,
    GameWortigerComplete,
  } from '$types';
  import SpellingBeeGameForm from './games/spelling-bee/SpellingBeeGameForm.svelte';
  import WortgeflechtGameForm from './games/wortgeflecht/WortgeflechtGameForm.svelte';

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
  <WortgeflechtGameForm
    data={data as any}
    game={game as GameWortgeflechtComplete}
    bind:beginning_option
  />
{/if}
