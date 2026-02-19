<script lang="ts">
  import type { GameType } from '$types';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import ZeitSpieleLogo from './ZeitSpieleLogo.svelte';
  import { view } from '$stores/view-state-store.svelte';
  import { GAME_UI_BY_ID, GAME_UI_CONFIG } from '$lib/games/ui-config';

  let { gameName }: { gameName?: GameType } = $props();

  function handleGameChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as GameType;
    const selectedGame = GAME_UI_BY_ID[value];
    if (!selectedGame) return;
    goto(resolve(selectedGame.href));
  }

  const selectedGame = $derived(gameName ? GAME_UI_BY_ID[gameName] : null);
  const selectedGameLogo = $derived(selectedGame?.logo ?? null);
</script>

<header class="flex flex-col sm:flex-row justify-between items-center w-full mb-12 gap-5">
  <a
    onclick={() => {
      view.updateSelectedGameId(-1);
    }}
    href={resolve(`/`)}
  >
    <ZeitSpieleLogo classExtra="w-32 h-auto" />
  </a>

  <div class="flex items-center justify-between gap-3">
    {#if selectedGameLogo}
      {@const SelectedGameLogo = selectedGameLogo}
      <SelectedGameLogo classExtra="w-6 h-6"></SelectedGameLogo>
    {/if}
  </div>

  <select
    class="border border-black pl-2 p-1 min-w-40"
    name="game"
    id="game"
    onchange={handleGameChange}
  >
    {#each GAME_UI_CONFIG as game (game.id)}
      <option value={game.id} selected={gameName === game.id}>{game.label}</option>
    {/each}
  </select>
</header>

{#if selectedGame?.subnav}
  <nav aria-label={`${selectedGame.label} Navigation`} class="flex justify-end gap-2 mb-4">
    {#each selectedGame.subnav as item (item.href)}
      <a
        class:!bg-gray-300={page.route.id === item.routeId}
        class="bg-gray-100 hover:bg-gray-300 px-3 py-1 border border-black text-xs"
        href={resolve(item.href)}>{item.label}</a
      >
    {/each}
  </nav>
{/if}
