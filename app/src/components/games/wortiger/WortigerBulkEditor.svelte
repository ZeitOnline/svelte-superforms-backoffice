<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { BeginningOptions, DataProps, GameComplete } from '$types';
  import { view } from '$stores/view-state-store.svelte';
  import {
    fetchWortigerGamesByLevels,
    isWortigerLength,
    MAP_LEVEL_CHARACTERS,
    WORTIGER_LENGTHS,
  } from '$lib/games/wortiger';
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
  import { dev } from '$app/environment';

  type Props = {
    data: DataProps;
    resultsDataBody: string[][];
    beginning_option: BeginningOptions;
  };

  // These props are intentionally bindable and updated from inside the editor.
  // eslint-disable-next-line no-useless-assignment
  let { data, resultsDataBody = $bindable(), beginning_option = $bindable() }: Props = $props();

  type ExistingIndex = Record<
    number,
    Map<
      string, // normalized solution
      { count: number; first_date?: string } // summary for messaging
    >
  >;

  /** editable table model — deep reactive */
  let rows = $state<string[][]>(resultsDataBody);
  function detectLevelsFromCsvRows(inputRows: string[][]): number[] {
    const firstRow = inputRows[0];
    if (!firstRow) return WORTIGER_LENGTHS;

    // Legacy CSV format: [date, level_4, level_5, level_6, level_7]
    if (firstRow.length > 2) return WORTIGER_LENGTHS;

    // Single-level CSV format: [date, word]
    const lengths = Array.from(new Set(inputRows.map(row => (row[1] ?? '').trim().length)));
    return lengths.length === 1 && isWortigerLength(lengths[0] ?? 0)
      ? [lengths[0]]
      : WORTIGER_LENGTHS;
  }
  let detectedLevels = $state<number[]>(detectLevelsFromCsvRows(resultsDataBody));

  /** pending + per-cell length guard based on MAP_LEVEL_CHARACTERS */
  let saving = $state(false);
  let error = $state<string | null>(null);
  let existingLevelDateIndex = $state<Record<string, true>>({});
  let existingSlotsLoaded = $state(false);
  let existingSolutionsRows = $state<
    Array<{ level: number; solution: string; release_date: string }>
  >([]);
  let existingSolutionsLoaded = $state(false);

  /** Build warning index from DB-fetched rows (fallback to local data until loaded). */
  const existingIndex = $derived.by<ExistingIndex>(() => {
    const idx: ExistingIndex = Object.fromEntries(WORTIGER_LENGTHS.map(len => [len, new Map()]));

    const source = existingSolutionsLoaded
      ? existingSolutionsRows
      : data.games.filter(isWortigerGame).map(g => ({
          level: g.level,
          solution: g.solution ?? '',
          release_date: g.release_date ?? '',
        }));

    for (const g of source) {
      if (!isWortigerGame(g as GameComplete)) continue;

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
    } catch (e) {
      console.error(e);
    } finally {
      if (dev) {
        console.log('Loaded word sets', wordSets);
      }
    }
  }

  async function fetchExistingLevelDateIndex(levelLens: number[]): Promise<Record<string, true>> {
    const levelIds = Array.from(
      new Set(
        levelLens
          .map(len => CHAR_TO_LEVEL[len])
          .filter((level): level is number => typeof level === 'number'),
      ),
    );

    if (levelIds.length === 0) return {};

    const games = await fetchWortigerGamesByLevels<{ level: number; release_date: string }>({
      levelIds,
      select: 'level,release_date',
    });

    const next: Record<string, true> = {};
    for (const game of games) {
      next[`${game.level}|${game.release_date}`] = true;
    }
    return next;
  }

  async function loadExistingSolutions(levelLens: number[]) {
    try {
      existingSolutionsLoaded = false;
      const levelIds = Array.from(
        new Set(
          levelLens
            .map(len => CHAR_TO_LEVEL[len])
            .filter((level): level is number => typeof level === 'number'),
        ),
      );

      if (levelIds.length === 0) {
        existingSolutionsRows = [];
        return;
      }

      existingSolutionsRows = await fetchWortigerGamesByLevels<{
        level: number;
        solution: string;
        release_date: string;
      }>({
        levelIds,
        select: 'level,solution,release_date',
        errorMessagePrefix: 'Failed to fetch existing Wortiger solutions for level',
      });
    } catch (e) {
      console.error(e);
      existingSolutionsRows = [];
    } finally {
      existingSolutionsLoaded = true;
    }
  }

  async function loadExistingLevelDateKeys(levelLens: number[]) {
    try {
      existingSlotsLoaded = false;
      existingLevelDateIndex = await fetchExistingLevelDateIndex(levelLens);
    } catch (e) {
      console.error(e);
      existingLevelDateIndex = {};
    } finally {
      existingSlotsLoaded = true;
    }
  }

  /** Check if the value already exists in previously saved games (same length) */
  function validateAgainstExistingSolutions(
    lengthForThisColumn: number,
    value: string = '',
  ): string | null {
    const word = value.trim();
    if (!word) return null;

    const map = existingIndex[lengthForThisColumn];
    if (!map) return null;

    const hit = map.get(normalize(word));
    if (!hit || hit.count <= 0) return null;

    // Optional: include the first known date and a “+N×” suffix if repeated
    const suffix = hit.count > 1 ? ` (+${hit.count - 1}×)` : '';
    const when = hit.first_date ? ` — zuletzt am ${hit.first_date}` : '';
    return `„⚠️ ${word}“ wurde schon verwendet${when}${suffix}`;
  }

  /** Warn when a value repeats within the current editor table */
  function validateWithinTableDuplicates(
    value: string = '',
    rowIndex: number,
    colIndex: number,
  ): string | null {
    const word = value.trim();
    if (!word) return null;

    let repeats = 0;
    for (let i = 0; i < rows.length; i++) {
      if (i === rowIndex) continue;
      const candidate = rows[i][colIndex];
      if (!candidate) continue;

      // Only compare within the same length column
      if (normalize(candidate) === normalize(word)) repeats++;
    }

    if (repeats > 0) {
      const suffix = repeats > 1 ? ` (+${repeats} weitere)` : '';
      return `⚠️ „${word}“ wird in dieser Tabelle mehrfach verwendet${suffix}.`;
    }

    return null;
  }

  /** Validate a row's release date against within-table duplicates */
  function validateReleaseDate(dateStr: string = ''): string | null {
    const date = dateStr.trim();
    if (!date) return null;

    // Duplicate within current editor table
    let repeats = 0;
    for (let i = 0; i < rows.length; i++) {
      if ((rows[i][0] ?? '').trim() === date) repeats++;
    }
    if (repeats > 1) {
      return `Datum ${date} wird mehrfach in dieser Tabelle verwendet.`;
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

  function validateLevelDateConflict(
    lengthForThisColumn: number,
    dateStr: string = '',
    value: string = '',
  ): string | null {
    const word = value.trim();
    const date = dateStr.trim();
    if (!word || !date) return null;
    if (!existingSlotsLoaded) return null;

    const level = CHAR_TO_LEVEL[lengthForThisColumn];
    if (!level) return null;

    return existingLevelDateIndex[`${level}|${date}`]
      ? `Für dieses Level gibt es am ${date} bereits ein Wort in der DB.`
      : null;
  }

  let hasDateConflicts = $derived(() => rows.some(r => !!validateReleaseDate(r[0])));

  let hasWordListViolations = $derived(() => {
    return rows.some(r => {
      const [_date, ...solutions] = r;
      return solutions.some((val, idx) => {
        const len = detectedLevels[idx];
        const msg = validateAgainstWordListCell(len, val);
        return !!msg;
      });
    });
  });

  let hasExistingLevelDateConflicts = $derived(() =>
    rows.some(r => {
      const [date, ...solutions] = r;
      return solutions.some((val, idx) => {
        const len = detectedLevels[idx];
        return !!validateLevelDateConflict(len, date, val);
      });
    }),
  );

  let isEmptyOrWithError = $derived(() => {
    const baseInvalid = rows.some(row => {
      const [release_date, ...solutions] = row;
      if (!release_date?.trim()) return true;
      const filledSolutions = solutions.map(cell => cell.trim()).filter(Boolean);
      if (filledSolutions.length === 0) return true;
      return filledSolutions.some(cell => cell.length <= 3);
    });

    // Allow repeated words but keep errors for missing/invalid entries, word list violations, and date conflicts.
    return (
      baseInvalid ||
      hasWordListViolations() ||
      hasDateConflicts() ||
      hasExistingLevelDateConflicts()
    );
  });

  function addEmptyRow() {
    const cols = 1 /* release_date */ + detectedLevels.length;
    const r = Array.from({ length: cols }, () => '');
    rows.push(r);
  }

  function removeRow(i: number) {
    if (!confirm(`Zeile ${i + 1} löschen?`)) return;
    rows.splice(i, 1);
  }

  onMount(() => {
    loadExistingSolutions(detectedLevels);
    loadWordSets(detectedLevels);
    loadExistingLevelDateKeys(detectedLevels);
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
        const lengthForThisColumn = detectedLevels[idx];
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
      }));

      // Refresh current DB occupancy right before save to avoid stale client data.
      const latestLevelDateIndex = await fetchExistingLevelDateIndex(detectedLevels);
      existingLevelDateIndex = latestLevelDateIndex;
      existingSlotsLoaded = true;

      const blockedRows = rowsForDb.filter(
        row => !!latestLevelDateIndex[`${row.level}|${row.release_date}`],
      );
      if (blockedRows.length > 0) {
        error = 'Mindestens ein Eintrag kollidiert mit einem bestehenden Level+Datum in der DB.';
        return;
      }

      if (rowsForDb.length > 0) {
        await createGamesBulk({ gameName: 'wortiger', rows: rowsForDb });
      }

      // Reset wizard or navigate
      view.updateView('dashboard');
      beginning_option = null;

      toastManager.add(`Einträge gespeichert (${rowsForDb.length} neu) ✅`, '');

      refreshDataAndGoToDashboard();
    } catch {
      error = 'Fehler beim Speichern.';
    } finally {
      saving = false;
    }
  }

  const headers = $derived(['Release_Date', ...detectedLevels.map(l => `Level_${l}`)]);

  const handleBackToDashboard = () => {
    refreshDataAndGoToDashboard();
  };

  async function refreshDataAndGoToDashboard() {
    await invalidateAll();
    view.updateSelectedGameId(-1);
    view.updateView('dashboard');
    beginning_option = null;
  }
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
        {@const dateMsg = validateReleaseDate(r[0])}
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

          {#each detectedLevels as lvl, j (lvl)}
            {@const expected = MAP_LEVEL_CHARACTERS[lvl]}
            {@const colIndex = 1 + j}
            {@const msg = validateAgainstWordListCell(lvl, r[colIndex])}
            {@const levelDateMsg = validateLevelDateConflict(lvl, r[0], r[colIndex])}
            {@const dupMsg = validateAgainstExistingSolutions(lvl, r[colIndex])}
            {@const tableDupMsg = validateWithinTableDuplicates(r[colIndex], i, colIndex)}
            <td class="px-2 py-1">
              <input
                type="text"
                class={`border px-2 py-1 w-40 font-mono
                  ${msg || levelDateMsg ? 'border-red-500' : dupMsg || tableDupMsg ? 'border-amber-400' : ''}`}
                bind:value={r[colIndex]}
                placeholder={`(${expected ?? '?'} chars)`}
                aria-label={`Level ${lvl} Lösung`}
                aria-invalid={msg || levelDateMsg ? 'true' : 'false'}
              />
              {#if r[colIndex] && expected && r[colIndex].length !== expected}
                <div class="text-xs text-amber-700 mt-2">Erwartet: {expected} Zeichen</div>
              {/if}
              {#if msg}
                <div class="text-xs text-red-700 mt-2">{msg}</div>
              {/if}
              {#if levelDateMsg}
                <div class="text-xs text-red-700 mt-2">{levelDateMsg}</div>
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
