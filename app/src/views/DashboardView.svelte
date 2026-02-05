<script lang="ts">
  import type { GameComplete, GameType, GamesPageInfo } from '$types';
  import GenericDashboardTable from '$components/GenericDashboardTable.svelte';
  import ViewNavigation from '$components/ViewNavigation.svelte';
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import { view } from '../stores/view-state-store.svelte';

  type Props = {
    games: GameComplete[];
    gameName: GameType;
    gamesPage: GamesPageInfo;
    latestActiveGameIds: number[];
  };

  let { games, gameName, gamesPage, latestActiveGameIds }: Props = $props();

  function handleNewGameView() {
    view.updateView('new-game');
  }
</script>

<ViewWrapper>
  <ViewNavigation
    viewName="Dashboard"
    mainAction={handleNewGameView}
    mainActionText="Neues Spiel erstellen"
    {gameName}
  />

  <GenericDashboardTable {games} {gameName} {gamesPage} {latestActiveGameIds} />
</ViewWrapper>
