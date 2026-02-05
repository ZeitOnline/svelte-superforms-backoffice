import { describe, expect, it } from 'vitest';
import {
  ACTIVE_FILTER_OPTIONS,
  DEFAULT_SORT,
  SORT_OPTIONS,
  isActiveFilterOption,
  isSortOption,
} from '$lib/game-table-utils';

describe('game-table-utils', () => {
  it('accepts all known sort options', () => {
    for (const option of SORT_OPTIONS) {
      expect(isSortOption(option)).toBe(true);
    }
  });

  it('rejects unknown sort options', () => {
    expect(isSortOption('unknown')).toBe(false);
    expect(isSortOption(null)).toBe(false);
    expect(isSortOption(undefined)).toBe(false);
  });

  it('accepts all known active filter options', () => {
    for (const option of ACTIVE_FILTER_OPTIONS) {
      expect(isActiveFilterOption(option)).toBe(true);
    }
  });

  it('rejects unknown active filter options', () => {
    expect(isActiveFilterOption('unknown')).toBe(false);
    expect(isActiveFilterOption(null)).toBe(false);
    expect(isActiveFilterOption(undefined)).toBe(false);
  });

  it('keeps the default sort valid', () => {
    expect(isSortOption(DEFAULT_SORT)).toBe(true);
  });
});
