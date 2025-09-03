<script lang="ts">
  import { goto } from '$app/navigation';

  import Header from '$components/Header.svelte';
  import ViewNavigation from '$components/ViewNavigation.svelte';
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import WortigerWordList from '$components/games/wortiger/WortigerWordList.svelte';

  const handleBackToDashboard = () => {
    goto('/wortiger');
  };

</script>

<Header gameName="wortiger" />

<ViewWrapper>
  <ViewNavigation
    viewName="Wortliste anschauen"
    mainAction={handleBackToDashboard}
    mainActionText="Zurück"
    gameName="wortiger"
  />

  <WortigerWordList />
</ViewWrapper>
