<script lang="ts">
  import IconHandler from '$components/icons/IconHandler.svelte';
  import { toCSV } from '$components/games/wortiger/utils';
  import { MAP_LEVEL_CHARACTERS, WORTIGER_LENGTHS } from '$lib/games/wortiger';
  import { buildQueryParams, pg, requestPostgrest } from '$lib/postgrest-client';

  type Props = {
    apiBase: string;
    endpointName: string;
    levelLength: number | null | undefined;
    onChange: (length: number | null) => void;
  };

  let { apiBase, endpointName, levelLength, onChange }: Props = $props();

  const wortigerTabs = $derived<[string, number | null][]>([
    ['Alle', null],
    ...WORTIGER_LENGTHS.map(length => [`${length}er`, length] as [string, number]),
  ]);
  const LENGTH_TO_LEVEL: Record<number, number> = Object.fromEntries(
    Object.entries(MAP_LEVEL_CHARACTERS).map(([level, length]) => [Number(length), Number(level)]),
  );
  const selectedLength = $derived(levelLength ?? null);
  const activeIndex = $derived(
    Math.max(0, wortigerTabs.findIndex(([, length]) => length === selectedLength)),
  );
  let tabRefs = $state<Array<HTMLButtonElement | null>>([]);

  function setTabByIndex(index: number) {
    const [, length] = wortigerTabs[index] ?? [];
    onChange(length ?? null);
  }

  function setTabByLength(length: number) {
    const next = selectedLength === length ? null : length;
    onChange(next);
  }

  function handleTabKeydown(event: KeyboardEvent, index: number) {
    const lastIndex = wortigerTabs.length - 1;
    let nextIndex = index;

    if (event.key === 'ArrowRight') {
      nextIndex = index === lastIndex ? 0 : index + 1;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = index === 0 ? lastIndex : index - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = lastIndex;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setTabByIndex(index);
      return;
    } else {
      return;
    }

    event.preventDefault();
    tabRefs[nextIndex]?.focus();
    setTabByIndex(nextIndex);
  }

  async function exportCsv() {
    const hasLength = !!selectedLength;
    const level = hasLength ? LENGTH_TO_LEVEL[selectedLength!] : null;
    if (hasLength && !level) return;

    const baseUrl = `${apiBase}/${endpointName}`;
    const limit = 1000;
    let offset = 0;
    let total = 0;
    const rows: Array<{ release_date: string; level: number; solution: string }> = [];

    do {
      const params = buildQueryParams([
        ['select', 'release_date,level,solution'],
        ['level', level ? pg.eq(level) : undefined],
        ['order', pg.order('release_date', 'desc')],
        ['limit', limit],
        ['offset', offset],
      ]);

      const { data, response: res } = await requestPostgrest<
        Array<{ release_date: string; level: number; solution: string }>
      >({
        url: baseUrl,
        query: params,
        headers: { Prefer: 'count=exact' },
        errorMessage: 'CSV export failed',
      });
      rows.push(...data);

      const contentRange = res.headers.get('content-range');
      if (contentRange) {
        const [, totalStr] = contentRange.split('/');
        const parsed = Number(totalStr);
        if (Number.isFinite(parsed)) total = parsed;
      } else {
        total = rows.length;
      }

      offset += limit;
    } while (rows.length < total);

    const csvRows = [
      ['release_date', 'length', 'solution'],
      ...rows.map(r => [r.release_date, MAP_LEVEL_CHARACTERS[r.level], r.solution]),
    ];

    const csv = '\uFEFF' + toCSV(csvRows, ';');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `wortiger_${selectedLength ?? 'alle'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
</script>

<div class="flex items-center gap-3">
  <div role="tablist" aria-label="Wortiger Level Filter" class="flex items-center gap-2">
    {#each wortigerTabs as tab, index (tab[0])}
      {@const [label, length] = tab}
      <button
        role="tab"
        id={`wortiger-tab-${index}`}
        aria-selected={activeIndex === index}
        aria-controls={`wortiger-panel-${index}`}
        tabindex={activeIndex === index ? 0 : -1}
        class="filter-button"
        class:active={activeIndex === index}
        bind:this={tabRefs[index]}
        onclick={() => (length ? setTabByLength(length) : setTabByIndex(0))}
        onkeydown={event => handleTabKeydown(event, index)}
      >
        {label}
      </button>
    {/each}
  </div>

  {#each wortigerTabs as tab, index (tab[0])}
    <div
      role="tabpanel"
      id={`wortiger-panel-${index}`}
      aria-labelledby={`wortiger-tab-${index}`}
      hidden={activeIndex !== index}
      tabindex="0"
    >
      <button class="z-ds-button whitespace-nowrap ml-auto w-full md:w-fit" onclick={exportCsv}>
        <IconHandler iconName="download" extraClasses="w-4 h-4 inline-block" />
        CSV
      </button>
    </div>
  {/each}
</div>

<style lang="postcss">
  @reference "../../../app.css";

  .filter-button {
    @apply bg-white text-xs px-2 py-1 cursor-pointer border border-black hover:bg-gray-200 focus:bg-gray-200;
  }
  .filter-button.active {
    @apply bg-black text-white;
  }
</style>
