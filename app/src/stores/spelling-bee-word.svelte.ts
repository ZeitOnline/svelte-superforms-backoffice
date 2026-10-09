import type { SpellingBeeSolutionItem, GameSpellingBeeComplete } from "#types";
import { getDisplayWordcloud, getSpellingBeeLetters, type SpellingBeeType } from '#lib/games/spelling-bee-letters.js';

type SpellingBeeStore = {
  gameId: number | null;
  word: string;
  centralLetter: string;
  type: SpellingBeeType | null;
  solutions: SpellingBeeSolutionItem;
};

export const spellingBeeStore = $state<SpellingBeeStore>({
  gameId: null,
  word: '',
  centralLetter: '',
  type: null,
  solutions: []
});


export const toggleLegend = (item: GameSpellingBeeComplete, solutionsForGame: SpellingBeeSolutionItem) => {
  const legendSpellingBee = document.getElementById('legend-spelling-bee') as HTMLDetailsElement;
  if (legendSpellingBee) {
    legendSpellingBee.open = true;
  }
  // if already pressed, clear the store
  if (spellingBeeStore.gameId === item.id) {
    spellingBeeStore.gameId = null;
    spellingBeeStore.word = '';
    spellingBeeStore.centralLetter = '';
    spellingBeeStore.type = null;
    spellingBeeStore.solutions = [];
    if (legendSpellingBee) {
      legendSpellingBee.open = false;
    }
    return;
  }
  const { type, centralLetter } = getSpellingBeeLetters(item);
  spellingBeeStore.gameId = item.id;
  spellingBeeStore.word = getDisplayWordcloud(item);
  spellingBeeStore.centralLetter = centralLetter;
  spellingBeeStore.type = type;
  spellingBeeStore.solutions = solutionsForGame;
};
