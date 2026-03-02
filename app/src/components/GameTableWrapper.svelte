<script lang="ts">
  import type {
    BeginningOptions,
    DataProps,
    GameComplete,
    GameDataByType,
    GameType,
  } from '$types';
  import { isEckchenGame, isSpellingBeeGame, isWortgeflechtGame, isWortigerGame } from '$utils';
  import { SpellingBeeGameForm, WortigerGameForm, EckchenGameForm, WortgeflechtGameForm } from './games';

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

  const eckchenData = $derived(data as unknown as GameDataByType['eckchen']);
  const wortigerData = $derived(data as unknown as GameDataByType['wortiger']);
  const spellingBeeData = $derived(data as unknown as GameDataByType['spelling-bee']);
  const wortgeflechtData = $derived(data as unknown as GameDataByType['wortgeflecht']);

  const eckchenGame = $derived(game && isEckchenGame(game) ? game : undefined);
  const wortigerGame = $derived(game && isWortigerGame(game) ? game : undefined);
  const spellingBeeGame = $derived(game && isSpellingBeeGame(game) ? game : undefined);
  const wortgeflechtGame = $derived(game && isWortgeflechtGame(game) ? game : undefined);
</script>

{#if gameName === 'wortiger'}
  <WortigerGameForm data={wortigerData} game={wortigerGame} bind:beginning_option />
{:else if gameName === 'eckchen'}
  <EckchenGameForm
    data={eckchenData}
    game={eckchenGame}
    bind:beginning_option
    bind:resultsDataBody
  />
{:else if gameName === 'spelling-bee'}
  <SpellingBeeGameForm
    data={spellingBeeData}
    game={spellingBeeGame}
    bind:beginning_option
    bind:resultsDataBody
  />
{:else if gameName === 'wortgeflecht'}
  <WortgeflechtGameForm
    data={wortgeflechtData}
    game={wortgeflechtGame}
    bind:beginning_option
  />
{/if}
