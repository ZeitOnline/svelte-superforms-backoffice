<script lang="ts">
  import GridPreview from './GridPreview.svelte';
  import WordListEditor from './WordListEditor.svelte';
  import type { WortgeflechtWordPath } from '$lib/games/wortgeflecht-generator';

  type PathCell = {
    x: number;
    y: number;
    letter?: string;
  };

  type ColoredPath = {
    id: string;
    points: string;
    fill: string;
    stroke: string;
    cells: PathCell[];
    start?: PathCell;
    end?: PathCell;
  };

  const GRID_CELL_SIZE = 40;
  const PATH_COLORS = [
    { fill: '#f8d7da', stroke: '#d94f70' },
    { fill: '#ffe8b5', stroke: '#c99800' },
    { fill: '#cffafe', stroke: '#0f9fb0' },
    { fill: '#d1fae5', stroke: '#169c74' },
    { fill: '#e0e7ff', stroke: '#4f74d9' },
    { fill: '#fce7f3', stroke: '#cc5f97' },
    { fill: '#fae8ff', stroke: '#9660cc' },
    { fill: '#fef3c7', stroke: '#b08a07' },
  ];

  type Props = {
    submitLabel: string;
    wordLines: string[];
    wordCount: number;
    totalLetters: number;
    invalidInputWords: string[];
    generatorError: string | null;
    rowsError: string | null;
    isGenerating: boolean;
    hasGeneratedRows: boolean;
    generatedPaths: WortgeflechtWordPath[];
    generatedGridRows: string[][];
    onFillDebugWords: () => void;
    onAddWordLine: () => void;
    onUpdateWordLine: (index: number, value: string) => void;
    onRemoveWordLine: (index: number) => void;
    onGenerateGrid: () => void;
  };

  let {
    submitLabel,
    wordLines,
    wordCount,
    totalLetters,
    invalidInputWords,
    generatorError,
    rowsError,
    isGenerating,
    hasGeneratedRows,
    generatedPaths,
    generatedGridRows,
    onFillDebugWords,
    onAddWordLine,
    onUpdateWordLine,
    onRemoveWordLine,
    onGenerateGrid,
  }: Props = $props();

  const coloredPaths = $derived(
    generatedPaths.map((path, index) => {
      const color = PATH_COLORS[index % PATH_COLORS.length];
      const points = path.cells
        .map(cell => `${cell.x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2},${cell.y * GRID_CELL_SIZE + GRID_CELL_SIZE / 2}`)
        .join(' ');
      return {
        ...path,
        id: `path-${index}`,
        fill: color.fill,
        stroke: color.stroke,
        points,
        start: path.cells[0],
        end: path.cells[path.cells.length - 1],
      } satisfies ColoredPath;
    }),
  );

  const wordStyleByWord = $derived(
    new Map(
      coloredPaths.map(path => [
        path.word.trim().toLocaleUpperCase('de-DE'),
        `border-left: 6px solid ${path.stroke}; background-color: ${path.fill};`,
      ]),
    ),
  );

  function getWordRowStyle(line: string) {
    const key = line.trim().toLocaleUpperCase('de-DE');
    if (!key) return '';
    return wordStyleByWord.get(key) ?? '';
  }
</script>

<section class="grid grid-cols-1 xl:grid-cols-2 gap-z-ds-24 my-z-ds-24">
  <WordListEditor
    {wordLines}
    {wordCount}
    {totalLetters}
    {invalidInputWords}
    {generatorError}
    {rowsError}
    {isGenerating}
    {hasGeneratedRows}
    {getWordRowStyle}
    onFillDebugWords={onFillDebugWords}
    onAddWordLine={onAddWordLine}
    onUpdateWordLine={onUpdateWordLine}
    onRemoveWordLine={onRemoveWordLine}
    onGenerateGrid={onGenerateGrid}
  />

  <GridPreview {coloredPaths} {generatedGridRows} />
</section>

<div class="flex flex-row gap-4 items-center my-12 mx-auto w-full justify-center">
  <button class="z-ds-button" type="submit">
    {submitLabel}
  </button>
</div>
