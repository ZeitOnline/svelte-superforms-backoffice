import type { View } from "$types";

export type ViewStateStore = ReturnType<typeof viewStateStore>;

export function viewStateStore(initialValue: View = "dashboard") {
    let view = $state(initialValue);
    let selectedGameId = $state<string>("");
  
    return {
      updateView(newValue: View) {
        view = newValue;
      },
      updateSelectedGameId(newValue: string) {
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