<script lang="ts">
  import IconHandler from '../../icons/IconHandler.svelte';

  type Props = {
    wordCount: number;
    totalLetters: number;
    invalidInputWords: string[];
    generatorError: string | null;
    rowsError: string | null;
    isGenerating: boolean;
    hasGeneratedRows: boolean;
    onGenerateGrid: () => void;
  };

  let {
    wordCount,
    totalLetters,
    invalidInputWords,
    generatorError,
    rowsError,
    isGenerating,
    hasGeneratedRows,
    onGenerateGrid,
  }: Props = $props();
</script>

<p class="text-sm mt-z-ds-8">
  Wörter: {wordCount} | Buchstaben: {totalLetters}/48
</p>
{#if invalidInputWords.length > 0}
  <p class="text-red-600 text-sm mt-z-ds-8">
    Ungültige Einträge: {invalidInputWords.join(', ')}
  </p>
{/if}
{#if generatorError}
  <div class="border border-red-500 text-red-600 p-3 mt-z-ds-12 flex items-center gap-2">
    <IconHandler iconName="error" extraClasses="w-4 h-4" />
    <span>{generatorError}</span>
  </div>
{/if}
{#if rowsError}
  <div class="border border-red-500 text-red-600 p-3 mt-z-ds-12 flex items-center gap-2">
    <IconHandler iconName="error" extraClasses="w-4 h-4" />
    <span>{rowsError}</span>
  </div>
{/if}
<div class="flex gap-z-ds-8 mt-z-ds-12">
  <button class="z-ds-button" type="button" onclick={onGenerateGrid} disabled={isGenerating}>
    {#if isGenerating}
      Generiere...
    {:else if hasGeneratedRows}
      Neu generieren
    {:else}
      Generieren
    {/if}
  </button>
</div>
