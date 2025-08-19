import type { GameComplete, GameEckchen, GameWortiger, TableColumn } from '$types';

/**
 *  This function is used to transform the published date
 * @param publishedAt
 * @returns
 */
export const transformedPublishedData = (publishedAt: string) => {
  const date = new Date(publishedAt);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * This function is used to transform the published date with time
 * @param publishedAt
 * @returns
 */
export const transformedPublishedDataWithTime = (publishedAt: string) => {
  const date = new Date(publishedAt);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
};

/**
 * This function is used to debounce the function call
 * @param callback  debounce function
 * @param wait  debounce time
 * @returns
 */
export function debounce<T extends (...args: string[]) => void>(callback: T, wait = 300) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), wait);
  };
}

/**
 * This function is used to highlight the matched text
 * @param text the text to be highlighted
 * @param term the term to be highlighted
 * @returns
 */
export function highlightMatch(text: string | number, term: string): string {
  const textStr = text.toString();
  const parts: string[] = textStr.split(new RegExp(`(${term})`, 'gi'));
  return parts
    .map((part: string) =>
      part.toLowerCase() === term.toLowerCase()
        ? `<span class="bg-yellow-300">${part}</span>`
        : part,
    )
    .join('');
}

/**
 * Generic search function that works with any game type and column configuration
 */
export function searchInGame(
  game: GameComplete,
  term: string,
  searchableColumns: TableColumn[],
): boolean {
  if (!term) return true;

  const lowerTerm = term.toLowerCase();

  return searchableColumns.some(column => {
    if (!column.searchable) return false;

    const value = column.getValue(game);
    const displayValue = column.getDisplayValue ? column.getDisplayValue(game) : value;

    return (
      value.toString().toLowerCase().includes(lowerTerm) ||
      displayValue.toString().toLowerCase().includes(lowerTerm)
    );
  });
}

// Type guards for discriminating unions based on actual properties
export function isEckchenGame(game: GameComplete): game is GameEckchen & { id: number } {
  return 'name' in game && typeof (game as GameEckchen & { id: number }).name === 'string';
}

export function isWortigerGame(game: GameComplete): game is GameWortiger & { id: number } {
  return 'level' in game && typeof (game as GameWortiger & { id: number }).level === 'number';
}

// Helper functions to work with games regardless of their type
export function getGameDisplayName(game: GameComplete): string {
  if (isEckchenGame(game)) {
    return game.name;
  } else if (isWortigerGame(game)) {
    return `Level ${game.level}`;
  }
  // Fallback - this should never happen with proper discriminated unions
  return `Game ${(game as { id: number }).id}`;
}

// Helper to safely check if a game is active (with fallback for missing field)
export function isGameActive(game: GameComplete): boolean {
  return game.active ?? true; // Default to true if active field is missing
}

// Helper function to get searchable text for any game type
export function getGameSearchableText(game: GameComplete): string[] {
  const common = [game.id.toString(), game.release_date];

  if (isEckchenGame(game)) {
    return [...common, game.name];
  } else {
    return [...common, game.level.toString(), game.solution || ''];
  }
}
