import type { View } from '$types';

export type ViewStateStore = ReturnType<typeof viewStateStore>;

export function viewStateStore(initialValue: View = 'dashboard') {
  let view = $state(initialValue);
  let selectedGameId = $state<number>(-1);

  return {
    updateView(newValue: View) {
      view = newValue;
    },
    updateSelectedGameId(newValue: number) {
      selectedGameId = newValue;
    },
    get view() {
      return view;
    },
    get selectedGameId() {
      return selectedGameId;
    },
  };
}
