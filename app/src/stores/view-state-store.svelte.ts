import type { View } from '$types';

export const view = $state({
  current: 'dashboard' as View,
  selectedGameId: -1,
  updateView(newValue: View) {
    this.current = newValue;
  },
  updateSelectedGameId(newValue: number) {
    this.selectedGameId = newValue;
  },
})
