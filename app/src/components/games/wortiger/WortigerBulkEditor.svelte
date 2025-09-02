<script lang="ts">
  import type { BeginningOptions } from '$types';
  import type { ViewStateStore } from '$stores/view-state-store.svelte';
  import { MAP_LEVEL_CHARACTERS } from '$lib/games/wortiger';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import { createGamesBulk } from '$lib/queries';
  import { getToastState } from '$lib/toast-state.svelte';

  type Props = {
    store: ViewStateStore;
    resultsDataBody: string[][];
    levels?: number[];
    beginning_option: BeginningOptions;
  };
  let {
    store,
    resultsDataBody = $bindable(),
    beginning_option = $bindable(),
    levels = [4, 5, 6, 7],
  }: Props = $props();

  const CHAR_TO_LEVEL: Record<number, number> = {};
  for (const [lvl, len] of Object.entries(MAP_LEVEL_CHARACTERS)) {
    CHAR_TO_LEVEL[Number(len)] = Number(lvl);
  }

  const toastManager = getToastState();

  /** editable table model — deep reactive */
  let rows = $state<string[][]>(resultsDataBody);

  /** pending + per-cell length guard based on MAP_LEVEL_CHARACTERS */
  let saving = $state(false);
  let error = $state<string | null>(null);

  let areNotAllFieldsFilled = $derived(() => {
    // Every row: release_date must be filled, and all solutions must be filled and longer than 3 chars
    return rows.some(row => {
      const [release_date, ...solutions] = row;
      if (!release_date?.trim()) return true;
      // All solutions must be filled and longer than 3 characters
      return solutions.some(cell => !cell.trim() || cell.trim().length <= 3);
    });
  });

  function addEmptyRow() {
    const cols = 1 /* release_date */ + levels.length;
    const r = Array.from({ length: cols }, () => '');
    rows.push(r);
  }

  function removeRow(i: number) {
    if (!confirm(`Zeile ${i + 1} löschen?`)) return;
    rows.splice(i, 1);
  }

  /**
   * Normalize the UI rows into payload entries:
   * [{release_date, level, solution, published:false}]
   * Skips empty solutions.
   */
  function toPayload() {
    const payload: Array<{
      release_date: string;
      level: number;
      solution: string;
    }> = [];
    for (const r of rows) {
      const [date, ...solutions] = r;
      if (!date) continue;
      solutions.forEach((sol, idx) => {
        const lengthForThisColumn = levels[idx];
        const dbLevel = CHAR_TO_LEVEL[lengthForThisColumn];
        const trimmed = (sol ?? '').trim();
        if (!trimmed) return;

        if (!dbLevel) {
          // optional: guard if header length isn't known in the map
          console.warn('Unknown length column', lengthForThisColumn);
          return;
        }

        payload.push({
          level: dbLevel,
          solution: trimmed,
          release_date: date,
        });
      });
    }
    return payload;
  }

  async function saveAll() {
    error = null;
    const payload = toPayload();
    if (payload.length === 0) {
      error = 'Nichts zu speichern — bitte mindestens eine Lösung eingeben.';
      return;
    }
    saving = true;
    try {
      const rowsForDb = payload.map(p => ({
        level: p.level, // DB level id (1..4)
        release_date: p.release_date, // ISO yyyy-mm-dd
        solution: p.solution,
        // published: p.published, // map published -> active
      }));

      await createGamesBulk({ gameName: 'wortiger', rows: rowsForDb });
      // Reset wizard or navigate
      store.updateView('dashboard');
      beginning_option = null;

      toastManager.add('Alle Einträge gespeichert ✅', '');

      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (e: any) {
      error = e?.message ?? 'Fehler beim Speichern.';
    } finally {
      saving = false;
    }
  }

  const headers = ['Release_Date', ...levels.map(l => `Level_${l}`)];
</script>

<div class="flex items-center justify-between my-z-ds-24">
  <div class="font-bold">Wortiger – Bulk Editor</div>
  <div class="flex gap-2">
    <button class="z-ds-button z-ds-button-outline" type="button" onclick={addEmptyRow}
      >+ Zeile</button
    >
    <button class="z-ds-button" type="button" disabled={saving || areNotAllFieldsFilled()} onclick={saveAll}>
      {saving ? 'Speichere…' : 'Bestätigen & Speichern'}
    </button>
  </div>
</div>

{#if error}
  <div class="border border-red-500 text-red-600 p-3 mb-4 flex items-center gap-2">
    <IconHandler iconName="error" extraClasses="w-4 h-4" />
    <span>{error}</span>
  </div>
{/if}

<div class="relative overflow-x-auto">
  <table class="w-full text-sm text-left">
    <thead>
      <tr>
        {#each headers as h}
          <th class="px-2 py-2">{h}</th>
        {/each}
        <th class="px-2 py-2"></th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r, i (i)}
        <tr>
          <td class="px-2 py-1 w-[170px]">
            <input
              type="date"
              class="border px-2 py-1 w-[160px]"
              bind:value={r[0]}
              aria-label="Release date"
            />
          </td>

          {#each levels as lvl, j (lvl)}
            {@const expected = MAP_LEVEL_CHARACTERS[lvl]}
            {@const colIndex = 1 + j}
            <td class="px-2 py-1">
              <input
                class="border px-2 py-1 w-[160px] font-mono"
                bind:value={r[colIndex]}
                placeholder={`(${expected ?? '?'} chars)`}
                aria-label={`Level ${lvl} Lösung`}
              />
              {#if r[colIndex] && expected && r[colIndex].length !== expected}
                <div class="text-xs text-amber-700">Erwartet: {expected} Zeichen</div>
              {/if}
            </td>
          {/each}

          <td class="px-2 py-1">
            <button
              class="z-ds-button z-ds-button-outline"
              type="button"
              title="Zeile löschen"
              onclick={() => removeRow(i)}>–</button
            >
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  table th,
  table td {
    border-bottom: 1px solid black;
  }
</style>
