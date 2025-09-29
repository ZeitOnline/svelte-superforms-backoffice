<script lang="ts">
  import type { BeginningOptions } from '$types';
  import type { ViewStateStore } from '$stores/view-state-store.svelte';
  import { MAP_LEVEL_CHARACTERS } from '$lib/games/wortiger';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import { createGamesBulk } from '$lib/queries';
  import { getToastState } from '$lib/toast-state.svelte';
  import { CONFIG_GAMES } from '$config/games.config';
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';

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

  /** Change this depending on your rule:
   * 'must-exist'     -> error if NOT found in word list
   * 'must-not-exist' -> error if already present in word list
   */
  const WORDLIST_RULE: 'must-exist' | 'must-not-exist' = 'must-exist';

  /** In-memory sets for O(1) membership checks */
  let wordSets = $state<Record<number, Set<string>>>({
    4: new Set(),
    5: new Set(),
    6: new Set(),
    7: new Set(),
  });

  /** Normalize for comparison (case-insensitive, trim). Adjust if you want strict case. */
  const normalize = (s: string) => s.trim().toLocaleLowerCase('de-DE');

  /** Fetch one list and return a Set of normalized words */
  async function fetchWordSetForLength(length: number): Promise<Set<string>> {
    const url = `${CONFIG_GAMES.wortiger.apiBase}/${CONFIG_GAMES.wortiger.apiWordListEndpoint}_${length}?select=word`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed for ${length}: ${res.status}`);
    const data = await res.json();
    const set = new SvelteSet<string>();
    let i = 0;
    while (data[i] !== undefined) {
      const w = data[i]?.word;
      if (w) set.add(normalize(w));
      i++;
    }
    return set;
  }

  /** Fetch all lists required by the current "levels" columns */
  async function loadWordSets(levelLens: number[]) {
    try {
      const uniqueLens = Array.from(new Set(levelLens)).filter(n => [4, 5, 6, 7].includes(n));
      const results = await Promise.all(uniqueLens.map(fetchWordSetForLength));
      const next: Record<number, Set<string>> = {
        4: new Set(),
        5: new Set(),
        6: new Set(),
        7: new Set(),
      };
      uniqueLens.forEach((len, idx) => {
        next[len] = results[idx];
      });
      wordSets = next;
    } catch (e: any) {
      console.error(e);
    } finally {
      console.log('Loaded word sets', wordSets);
    }
  }

  /** Validate a single solution cell against the corresponding word list */
  function validateAgainstWordList(lengthForThisColumn: number, value: string): string | null {
    const v = (value ?? '').trim();
    if (!v) return null; // empty is handled elsewhere
    const set = wordSets[lengthForThisColumn];
    if (!set || set.size === 0) return null; // if not loaded yet, don’t block typing

    const exists = set.has(normalize(v));

    if (WORDLIST_RULE === 'must-exist' && !exists) {
      return `„${v}“ ist nicht in der ${lengthForThisColumn}-Buchstaben-Wortliste`;
    }
    if (WORDLIST_RULE === 'must-not-exist' && exists) {
      return `„${v}“ existiert bereits in der ${lengthForThisColumn}-Buchstaben-Wortliste`;
    }
    return null;
  }

  /** Derived flag: any cell violates the word-list rule? */
  let hasWordListViolations = $derived(() => {
    return rows.some(r => {
      const [_date, ...solutions] = r;
      return solutions.some((val, idx) => {
        const len = levels[idx];
        const msg = validateAgainstWordList(len, val);
        return !!msg;
      });
    });
  });

  /** editable table model — deep reactive */
  let rows = $state<string[][]>(resultsDataBody);

  /** pending + per-cell length guard based on MAP_LEVEL_CHARACTERS */
  let saving = $state(false);
  let error = $state<string | null>(null);

  let areNotAllFieldsFilled = $derived(() => {
    // Every row: release_date must be filled, and all solutions must be filled and longer than 3 chars
    const baseInvalid = rows.some(row => {
      const [release_date, ...solutions] = row;
      if (!release_date?.trim()) return true;
      return solutions.some(cell => !cell.trim() || cell.trim().length <= 3);
    });
    return baseInvalid || hasWordListViolations();
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

  onMount(() => {
    loadWordSets(levels);
  });

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
    <button
      class="z-ds-button"
      type="button"
      disabled={saving || areNotAllFieldsFilled()}
      onclick={saveAll}
    >
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
        {#each headers as h (h)}
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
            {@const msg = validateAgainstWordList(lvl, r[colIndex])}
            <td class="px-2 py-1">
              <input
                class="border px-2 py-1 w-[160px] font-mono"
                bind:value={r[colIndex]}
                placeholder={`(${expected ?? '?'} chars)`}
                aria-label={`Level ${lvl} Lösung`}
                aria-invalid={msg ? 'true' : 'false'}
              />
              {#if r[colIndex] && expected && r[colIndex].length !== expected}
                <div class="text-xs text-amber-700">Erwartet: {expected} Zeichen</div>
              {/if}
              {#if msg}
                <div class="text-xs text-red-700">{msg}</div>
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
