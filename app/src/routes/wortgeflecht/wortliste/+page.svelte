<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import Header from '$components/Header.svelte';
  import ViewNavigation from '$components/ViewNavigation.svelte';
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import WortgeflechtWordList from '$components/games/wortgeflecht/WortgeflechtWordList.svelte';

  const handleBackToDashboard = () => {
    goto(resolve('/wortgeflecht'));
  };
</script>

<Header gameName="wortgeflecht" />

<ViewWrapper>
  <ViewNavigation
    viewName="Wortliste anschauen"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="wortgeflecht"
  />

  <WortgeflechtWordList />
</ViewWrapper>
