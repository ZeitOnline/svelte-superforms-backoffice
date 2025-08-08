import type { GameComplete, TableColumn } from '$types';
import { isEckchenGame } from '.';

/**
 * Generic table utility functions that work with any game type
 */

/**
 * Get the display title for a game regardless of type
 */
export function getGameDisplayTitle(game: GameComplete): string {
  if (isEckchenGame(game)) {
    return game.name;
  } else {
    return `Level ${game.level}`;
  }
}

/**
 * Generic sorting function that works with any column configuration
 */
export function sortGamesByColumn(
  games: GameComplete[],
  column: TableColumn,
  direction: 'asc' | 'desc' = 'asc',
): GameComplete[] {
  return [...games].sort((a, b) => {
    const aVal = column.getValue(a);
    const bVal = column.getValue(b);

    // Handle different value types
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Handle dates
    if (column.key === 'release_date') {
      const aDate = new Date(aVal).getTime();
      const bDate = new Date(bVal).getTime();
      return direction === 'asc' ? aDate - bDate : bDate - aDate;
    }

    // Handle strings
    const aStr = aVal.toString();
    const bStr = bVal.toString();
    return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });
}

/**
 * Generic filter function for active/inactive games
 */
export function filterGamesByActiveStatus(
  games: GameComplete[],
  showActive: boolean,
  showInactive: boolean,
): GameComplete[] {
  if (showActive && showInactive) return games;
  if (showActive) return games.filter(game => game.active);
  if (showInactive) return games.filter(game => !game.active);
  return games;
}

/**
 * Get all searchable values from a game for search functionality
 */
export function getSearchableValues(game: GameComplete, columns: TableColumn[]): string[] {
  return columns
    .filter(column => column.searchable)
    .map(column => {
      const value = column.getValue(game);
      const displayValue = column.getDisplayValue ? column.getDisplayValue(game) : value;
      return [value.toString(), displayValue.toString()];
    })
    .flat()
    .filter(Boolean);
}
