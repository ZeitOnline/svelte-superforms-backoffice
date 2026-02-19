<script lang="ts">
  import WordListFeedback from './WordListFeedback.svelte';
  import WordListInputs from './WordListInputs.svelte';

  type WordListState = {
    wordLines: string[];
    wordCount: number;
    totalLetters: number;
    invalidInputWords: string[];
    generatorError: string | null;
    rowsError: string | null;
    isGenerating: boolean;
    hasGeneratedRows: boolean;
    getWordRowStyle: (line: string) => string;
  };

  type WordListActions = {
    onFillDebugWords: () => void;
    onAddWordLine: () => void;
    onUpdateWordLine: (index: number, value: string) => void;
    onRemoveWordLine: (index: number) => void;
    onGenerateGrid: () => void;
  };

  type Props = {
    state: WordListState;
    actions: WordListActions;
  };

  let { state, actions }: Props = $props();
</script>

<div>
  <WordListInputs
    wordLines={state.wordLines}
    getWordRowStyle={state.getWordRowStyle}
    onFillDebugWords={actions.onFillDebugWords}
    onAddWordLine={actions.onAddWordLine}
    onUpdateWordLine={actions.onUpdateWordLine}
    onRemoveWordLine={actions.onRemoveWordLine}
  />
  <WordListFeedback
    wordCount={state.wordCount}
    totalLetters={state.totalLetters}
    invalidInputWords={state.invalidInputWords}
    generatorError={state.generatorError}
    rowsError={state.rowsError}
    isGenerating={state.isGenerating}
    hasGeneratedRows={state.hasGeneratedRows}
    onGenerateGrid={actions.onGenerateGrid}
  />
</div>
