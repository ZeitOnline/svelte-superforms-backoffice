import type { GameWortgeflechtComplete } from '$types';

type WortgeflechtStore = {
  gameId: number | null;
  name: string;
  words: string[];
  // true when the legend was opened automatically by a word search,
  // so we only auto-clear what we auto-opened.
  autoSelected: boolean;
};

export const wortgeflechtStore = $state<WortgeflechtStore>({
  gameId: null,
  name: '',
  words: [],
  autoSelected: false,
});

const setLegendOpen = (open: boolean) => {
  const legendWortgeflecht = document.getElementById(
    'legend-wortgeflecht',
  ) as HTMLDetailsElement | null;
  if (legendWortgeflecht) {
    legendWortgeflecht.open = open;
  }
};

const clearStore = () => {
  wortgeflechtStore.gameId = null;
  wortgeflechtStore.name = '';
  wortgeflechtStore.words = [];
  wortgeflechtStore.autoSelected = false;
};

// Manual toggle from the eye button in each row.
export const toggleWortgeflechtLegend = (item: GameWortgeflechtComplete, words: string[]) => {
  setLegendOpen(true);
  // if already pressed, clear the store
  if (wortgeflechtStore.gameId === item.id) {
    clearStore();
    setLegendOpen(false);
    return;
  }
  wortgeflechtStore.gameId = item.id;
  wortgeflechtStore.name = item.name;
  wortgeflechtStore.words = words;
  wortgeflechtStore.autoSelected = false;
};

// Auto-open the legend for the game whose puzzle contains the searched word.
export const showWortgeflechtLegendFromSearch = (
  item: GameWortgeflechtComplete,
  words: string[],
) => {
  if (wortgeflechtStore.gameId === item.id) return;
  wortgeflechtStore.gameId = item.id;
  wortgeflechtStore.name = item.name;
  wortgeflechtStore.words = words;
  wortgeflechtStore.autoSelected = true;
  setLegendOpen(true);
};

// Clear only if the current selection was auto-opened by a search
// (a manual selection stays until the user toggles it off).
export const clearAutoSelectedWortgeflechtLegend = () => {
  if (!wortgeflechtStore.autoSelected) return;
  clearStore();
  setLegendOpen(false);
};
