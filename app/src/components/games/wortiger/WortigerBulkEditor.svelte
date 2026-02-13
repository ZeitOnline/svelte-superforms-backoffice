<script lang="ts">
  import type { BeginningOptions, DataProps } from '$types';
  import { view } from '$stores/view-state-store.svelte';
  import { isWortigerLength, MAP_LEVEL_CHARACTERS, WORTIGER_LENGTHS } from '$lib/games/wortiger';
  import {
    fetchWordSetForLength,
    normalizeWortigerWord,
    validateAgainstWordList as validateAgainstWordListRule,
  } from '$lib/games/wortiger-validation';
  import IconHandler from '$components/icons/IconHandler.svelte';
  import { createGamesBulk } from '$lib/queries';
  import { getToastState } from '$lib/toast-state.svelte';
  import { CONFIG_GAMES } from '$config/games.config';
  import { onMount } from 'svelte';
  import { isWortigerGame } from '$utils';
  import ViewNavigation from '$components/ViewNavigation.svelte';
  import { SvelteSet } from 'svelte/reactivity';

  type Props = {
    data: DataProps;
    resultsDataBody: string[][];
    levels?: number[];
    beginning_option: BeginningOptions;
  };

  let {
    data,
    resultsDataBody = $bindable(),
    beginning_option = $bindable(),
    levels = WORTIGER_LENGTHS,
  }: Props = $props();

  type ExistingIndex = Record<
    number,
    Map<
      string, // normalized solution
      { count: number; first_date?: string } // summary for messaging
    >
  >;

  /** editable table model — deep reactive */
  let rows = $state<string[][]>(resultsDataBody);

  /** pending + per-cell length guard based on MAP_LEVEL_CHARACTERS */
  let saving = $state(false);
  let error = $state<string | null>(null);

  /** Build once from incoming `data` (array of 100 objects) */
  const existingIndex = $derived.by<ExistingIndex>(() => {
    const idx: ExistingIndex = Object.fromEntries(
      WORTIGER_LENGTHS.map(len => [len, new Map()]),
    );

    // If DataProps has the games array on a property, adjust here.
    // Your console shows `data` itself is the array, so iterate directly:
    for (const g of data.games) {
      if (!isWortigerGame(g)) continue;

      const sol = g?.solution ?? '';
      const len = sol.trim().length;
      if (!idx[len]) continue;

      const key = normalize(sol);
      const entry = idx[len].get(key) ?? { count: 0, first_date: undefined };
      entry.count += 1;
      // keep the earliest date we see for nicer messaging (optional)
      if (g?.release_date && !entry.first_date) {
        entry.first_date = g.release_date;
      }
      idx[len].set(key, entry);
    }
    return idx;
  });

  const existingDates = $derived(() => {
    const s = new SvelteSet<string>();
    for (const g of data.games) {
      if (!isWortigerGame(g)) continue;

      if (g.release_date) {
        s.add(g.release_date.slice(0, 10));
      }
    }
    return s;
  });

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
  let wordSets = $state<Record<number, Set<string>>>(
    Object.fromEntries(WORTIGER_LENGTHS.map(len => [len, new Set()])),
  );

  /** Normalize for comparison (case-insensitive, trim). Adjust if you want strict case. */
  const normalize = normalizeWortigerWord;

  /** Fetch all lists required by the current "levels" columns */
  async function loadWordSets(levelLens: number[]) {
    try {
      const uniqueLens = Array.from(new Set(levelLens)).filter(isWortigerLength);
      const results = await Promise.all(
        uniqueLens.map(len =>
          fetchWordSetForLength({
            apiBase: CONFIG_GAMES.wortiger.apiBase,
            endpointName: CONFIG_GAMES.wortiger.endpoints.wordList!.name,
            length: len,
          }),
        ),
      );
      const next: Record<number, Set<string>> = Object.fromEntries(
        WORTIGER_LENGTHS.map(len => [len, new Set()]),
      );
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

  /** Check if the value already exists in previously saved games (same length) */
  function validateAgainstExistingSolutions(
    lengthForThisColumn: number,
    value: string,
  ): string | null {
    const v = (value ?? '').trim();
    if (!v) return null;

    const map = existingIndex[lengthForThisColumn];
    if (!map) return null;

    const hit = map.get(normalize(v));
    if (!hit || hit.count <= 0) return null;

    // Optional: include the first known date and a “+N×” suffix if repeated
    const suffix = hit.count > 1 ? ` (+${hit.count - 1}×)` : '';
    const when = hit.first_date ? ` — zuletzt am ${hit.first_date}` : '';
    return `„⚠️ ${v}“ wurde schon verwendet${when}${suffix}`;
  }

  /** Warn when a value repeats within the current editor table */
  function validateWithinTableDuplicates(
    lengthForThisColumn: number,
    value: string,
    rowIndex: number,
    colIndex: number,
  ): string | null {
    const v = (value ?? '').trim();
    if (!v) return null;

    let repeats = 0;
    for (let i = 0; i < rows.length; i++) {
      if (i === rowIndex) continue;
      const candidate = rows[i][colIndex];
      if (!candidate) continue;

      // Only compare within the same length column
      if (normalize(candidate) === normalize(v)) repeats++;
    }

    if (repeats > 0) {
      const suffix = repeats > 1 ? ` (+${repeats} weitere)` : '';
      return `⚠️ „${v}“ wird in dieser Tabelle mehrfach verwendet${suffix}.`;
    }

    return null;
  }

  /** Validate a row's release date against DB + within-table duplicates */
  function validateReleaseDate(dateStr: string, rowIndex: number): string | null {
    const d = (dateStr ?? '').trim();
    if (!d) return null;

    // Conflict with existing games in DB
    if (existingDates().has(d)) {
      return `❌ Für ${d} existiert bereits ein Spiel (${WORTIGER_LENGTHS.join('/')}). Bitte wähle ein anderes Datum.`;
    }

    // Duplicate within current editor table
    let repeats = 0;
    for (let i = 0; i < rows.length; i++) {
      if ((rows[i][0] ?? '').trim() === d) repeats++;
    }
    if (repeats > 1) {
      return `Datum ${d} wird mehrfach in dieser Tabelle verwendet.`;
    }

    return null;
  }

  /** Validate a single solution cell against the corresponding word list */
  function validateAgainstWordListCell(lengthForThisColumn: number, value: string): string | null {
    return validateAgainstWordListRule({
      level: CHAR_TO_LEVEL[lengthForThisColumn] ?? lengthForThisColumn,
      value,
      wordSets,
      rule: WORDLIST_RULE,
    });
  }

  let hasDateConflicts = $derived(() => rows.some((r, i) => !!validateReleaseDate(r[0], i)));

  let hasWordListViolations = $derived(() => {
    return rows.some(r => {
      const [_date, ...solutions] = r;
      return solutions.some((val, idx) => {
        const len = levels[idx];
        const msg = validateAgainstWordListCell(len, val);
        return !!msg;
      });
    });
  });

  let isEmptyOrWithError = $derived(() => {
    const baseInvalid = rows.some(row => {
      const [release_date, ...solutions] = row;
      if (!release_date?.trim()) return true;
      return solutions.some(cell => !cell.trim() || cell.trim().length <= 3);
    });

    // Allow repeated words but keep errors for missing/invalid entries, word list violations, and date conflicts.
    return baseInvalid || hasWordListViolations() || hasDateConflicts();
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
      view.updateView('dashboard');
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

  // svelte-ignore state_referenced_locally
  const headers = ['Release_Date', ...levels.map(l => `Level_${l}`)];

  const handleBackToDashboard = () => {
    window.location.reload();
  };
</script>

<ViewNavigation
  viewName="Bulk Editor"
  mainAction={handleBackToDashboard}
  mainActionText="Zurück"
  gameName="wortiger"
/>

<div class="flex items-center justify-end my-z-ds-24">
  <div class="flex gap-2">
    <button class="z-ds-button z-ds-button-outline" type="button" onclick={addEmptyRow}
      >+ Zeile</button
    >
    <button
      class="z-ds-button"
      type="button"
      disabled={saving || isEmptyOrWithError()}
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
        {@const dateMsg = validateReleaseDate(r[0], i)}
        <tr>
          <td class="px-2 py-1 w-42.5">
            <input
              type="date"
              class="border px-2 py-1 w-40"
              bind:value={r[0]}
              aria-label="Release date"
              aria-invalid={dateMsg ? 'true' : 'false'}
            />
            {#if dateMsg}
              <div class="text-xs text-red-700 mt-2">{dateMsg}</div>
            {/if}
          </td>

          {#each levels as lvl, j (lvl)}
            {@const expected = MAP_LEVEL_CHARACTERS[lvl]}
            {@const colIndex = 1 + j}
            {@const msg = validateAgainstWordListCell(lvl, r[colIndex])}
            {@const dupMsg = validateAgainstExistingSolutions(lvl, r[colIndex])}
            {@const tableDupMsg = validateWithinTableDuplicates(lvl, r[colIndex], i, colIndex)}
            <td class="px-2 py-1">
              <input
                type="text"
                class={`border px-2 py-1 w-40 font-mono
                  ${msg ? 'border-red-500' : dupMsg || tableDupMsg ? 'border-amber-400' : ''}`}
                bind:value={r[colIndex]}
                placeholder={`(${expected ?? '?'} chars)`}
                aria-label={`Level ${lvl} Lösung`}
                aria-invalid={msg ? 'true' : 'false'}
              />
              {#if r[colIndex] && expected && r[colIndex].length !== expected}
                <div class="text-xs text-amber-700 mt-2">Erwartet: {expected} Zeichen</div>
              {/if}
              {#if msg}
                <div class="text-xs text-red-700 mt-2">{msg}</div>
              {/if}
              {#if dupMsg}
                <div class="text-xs text-amber-700 mt-2">{dupMsg}</div>
              {/if}
              {#if tableDupMsg}
                <div class="text-xs text-amber-700 mt-2">{tableDupMsg}</div>
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
