<script lang="ts">
  import type { BuchstabieneSolutionItem } from '$types';
  import App from '$components/App.svelte';
  import Header from '$components/Header.svelte';
  import { buchstabieneStore } from '$stores/buchstabiene-word.svelte.js';

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
    <h4 class="my-2">Word: {buchstabieneStore.word}</h4>
    {#if Object.keys(groupedSolutions).length}
      <div class="max-h-60 overflow-y-auto">
        <h5 class="font-bold mb-1">Solutions:</h5>
        {#each Object.entries(groupedSolutions) as [letter, items]}
          <div class="mb-2">
            <h5 class="font-bold text-[0.6rem] mb-1">{letter}</h5>
            <ul class="flex flex-wrap gap-2">
              {#each items as item}
                <li class="text-[0.5rem] border bg-gray-200 rounded-2xl px-2 border-gray-700 py-1">
                  {item.points} - {item.solution}
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    {/if}
  </details>
</div>
