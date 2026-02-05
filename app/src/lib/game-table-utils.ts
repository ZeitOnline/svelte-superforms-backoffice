import type { ActiveFilterOption, SortOption } from '$types';

export const SORT_OPTIONS: SortOption[] = ['az', 'za', 'dateAsc', 'dateDesc'];
export const DEFAULT_SORT: SortOption = 'dateDesc';

export const ACTIVE_FILTER_OPTIONS: ActiveFilterOption[] = ['active', 'notActive'];

export const isSortOption = (value: string | null | undefined): value is SortOption =>
  SORT_OPTIONS.includes(value as SortOption);

export const isActiveFilterOption = (
  value: string | null | undefined,
): value is ActiveFilterOption => ACTIVE_FILTER_OPTIONS.includes(value as ActiveFilterOption);
