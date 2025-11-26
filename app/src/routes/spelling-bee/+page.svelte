<script lang="ts">
  import type { BuchstabieneSolutionItem } from '$types';
  import App from '$components/App.svelte';
  import Header from '$components/Header.svelte';
  import { buchstabieneStore } from '$stores/buchstabiene-word.svelte.js';
  import IconHandler from '$components/icons/IconHandler.svelte';

  let { data } = $props();

  type GroupedSolutions = Record<string, { solution: string; points: number }[]>;

  let groupedSolutions = $derived.by(() => {
    const solutions = buchstabieneStore.solutions as BuchstabieneSolutionItem;
    if (!Array.isArray(solutions)) return {};

    // Flatten the array safely
    const all = solutions.flat();

    return all.reduce<GroupedSolutions>((acc, item) => {
      const letter = item.solution.charAt(0).toUpperCase();
      (acc[letter] ??= []).push(item);
      return acc;
    }, {});
  });
</script>

<Header gameName={data.gameType} />
<App {data} />

<div
  class="max-w-[300px] fixed bottom-0 right-0 text-xs text-z-ds-color-black-80 p-1.5 border-t border-l border-black bg-white"
>
  <details id="legend-spelling-bee">
    <summary>Legende bei Buchstabiene</summary>
    <hr class="mt-2" />
    <div class="my-2">Wortwolke: {buchstabieneStore.word}</div>
    {#if Object.keys(groupedSolutions).length}
      <div class="max-h-60 overflow-y-auto">
        <div class="font-bold mb-1">Lösungen:</div>
        {#each Object.entries(groupedSolutions) as [letter, items]}
          <div class="mb-2">
            <div class="font-bold text-[0.6rem] mb-1">{letter}</div>
            <ul role="list" class="flex flex-wrap gap-2">
              {#each items as item}
                <li class="text-[0.5rem] border bg-gray-200 rounded-2xl px-2 border-gray-700 py-1">
                  {item.points} - {item.solution}
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    {:else}
      <div class="italic mt-2 inline-flex gap-1">
        <span>Noch keine Reihe ausgewählt.</span>
        <IconHandler iconName="eye" extraClasses="inline-block w-4 h-4" />
      </div>
    {/if}
  </details>
</div>
