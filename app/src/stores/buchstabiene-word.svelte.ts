import type { BuchstabieneSolutionItem, GameSpellingBeeComplete } from "$types";

type BuchstabieneStore = {
  word: string;
  solutions: BuchstabieneSolutionItem;
};

export const buchstabieneStore = $state<BuchstabieneStore>({
  word: '',
  solutions: []
});


export const toggleLegend = (item: GameSpellingBeeComplete, solutionsForGame: BuchstabieneSolutionItem) => {
  const legendSpellingBee = document.getElementById('legend-spelling-bee') as HTMLDetailsElement;
  if (legendSpellingBee) {
    legendSpellingBee.open = true;
  }
  // if already pressed, clear the store
  if (buchstabieneStore.word === item.wordcloud) {
    buchstabieneStore.word = '';
    buchstabieneStore.solutions = [];
    if (legendSpellingBee) {
      legendSpellingBee.open = false;
    }
    return;
  }
  buchstabieneStore.word = item.wordcloud;
  buchstabieneStore.solutions = solutionsForGame;
};
