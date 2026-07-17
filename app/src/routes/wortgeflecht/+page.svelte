<script lang="ts">
  import type { DataProps } from '$types';
  import App from '$components/App.svelte';
  import Header from '$components/Header.svelte';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import HighlightedText from '$components/HighlightedText.svelte';
  import { wortgeflechtStore } from '$stores/wortgeflecht-word.svelte';
  import { highlightMatch } from '$utils';
  import { page } from '$app/state';

  let { data } = $props();

  const searchTerm = $derived(page.url.searchParams.get('q') ?? '');
</script>

<Header gameName="wortgeflecht" />
<App data={data as DataProps} />

<div
  class="max-w-75 fixed bottom-0 right-0 text-xs text-z-ds-color-black-80 p-1.5 border-t border-l border-black bg-white"
>
  <details id="legend-wortgeflecht">
    <summary>Wörter im Rätsel</summary>
    <hr class="mt-2" />
    <div class="my-2">Rätsel: {wortgeflechtStore.name}</div>
    {#if wortgeflechtStore.words.length}
      <div class="max-h-60 overflow-y-auto">
        <div class="font-bold mb-1">Wörter ({wortgeflechtStore.words.length}):</div>
        <ul role="list" class="flex flex-wrap gap-2">
          {#each wortgeflechtStore.words as word (word)}
            <li class="text-[0.5rem] border bg-gray-200 rounded-2xl px-2 border-gray-700 py-1">
              <HighlightedText segments={highlightMatch(word, searchTerm)} />
            </li>
          {/each}
        </ul>
      </div>
    {:else}
      <div class="italic mt-2 inline-flex gap-1">
        <span>Noch kein Rätsel ausgewählt.</span>
        <IconHandler iconName="eye" extraClasses="inline-block w-4 h-4" />
      </div>
    {/if}
  </details>
</div>
