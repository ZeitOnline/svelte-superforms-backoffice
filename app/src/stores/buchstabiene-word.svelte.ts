import type { BuchstabieneSolutionItem } from "$types";

type BuchstabieneStore = {
  word: string;
  solutions: BuchstabieneSolutionItem;
};

export const buchstabieneStore = $state<BuchstabieneStore>({
  word: '',
  solutions: []
});
