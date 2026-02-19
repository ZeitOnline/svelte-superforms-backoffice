<script lang="ts">
  import { dev } from '$app/environment';

  type Props = {
    wordLines: string[];
    getWordRowStyle: (line: string) => string;
    onFillDebugWords: () => void;
    onAddWordLine: () => void;
    onUpdateWordLine: (index: number, value: string) => void;
    onRemoveWordLine: (index: number) => void;
  };

  let {
    wordLines,
    getWordRowStyle,
    onFillDebugWords,
    onAddWordLine,
    onUpdateWordLine,
    onRemoveWordLine,
  }: Props = $props();
</script>

<div class="flex justify-between items-center mb-z-ds-8">
  <label class="text-md font-bold" for="wortgeflecht-word-0">Wörter</label>
  <div class="flex items-center gap-z-ds-8">
    {#if dev}
      <button class="z-ds-button z-ds-button-outline" type="button" onclick={onFillDebugWords}>
        Debug-Wörter
      </button>
    {/if}
    <button class="z-ds-button z-ds-button-outline" type="button" onclick={onAddWordLine}>+ Zeile</button>
  </div>
</div>

<div class="space-y-z-ds-8">
  {#each wordLines as line, index (index)}
    <div class="flex items-center gap-z-ds-8">
      <input
        id={`wortgeflecht-word-${index}`}
        class="border border-black px-z-ds-12 py-z-ds-8 w-full font-mono text-md"
        placeholder={index === wordLines.length - 1 ? 'Neues Wort' : `Wort ${index + 1}`}
        type="text"
        value={line}
        style={getWordRowStyle(line)}
        oninput={e => onUpdateWordLine(index, (e.currentTarget as HTMLInputElement).value)}
      />
      {#if line.trim().length > 0}
        <button
          class="z-ds-button z-ds-button-outline"
          type="button"
          title="Wort löschen"
          onclick={() => onRemoveWordLine(index)}
        >
          -
        </button>
      {/if}
    </div>
  {/each}
</div>
