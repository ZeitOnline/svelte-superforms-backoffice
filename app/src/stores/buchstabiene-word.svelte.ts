import type { SpellingBeeSolutionItem, GameSpellingBeeComplete } from "$types";

type SpellingBeeStore = {
  word: string;
  solutions: SpellingBeeSolutionItem;
};

export const spellingBeeStore = $state<SpellingBeeStore>({
  word: '',
  solutions: []
});


export const toggleLegend = (item: GameSpellingBeeComplete, solutionsForGame: SpellingBeeSolutionItem) => {
  const legendSpellingBee = document.getElementById('legend-spelling-bee') as HTMLDetailsElement;
  if (legendSpellingBee) {
    legendSpellingBee.open = true;
  }
  // if already pressed, clear the store
  if (spellingBeeStore.word === item.wordcloud) {
    spellingBeeStore.word = '';
    spellingBeeStore.solutions = [];
    if (legendSpellingBee) {
      legendSpellingBee.open = false;
    }
    return;
  }
  spellingBeeStore.word = item.wordcloud;
  spellingBeeStore.solutions = solutionsForGame;
};
