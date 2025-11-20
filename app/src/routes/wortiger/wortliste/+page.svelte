<script lang="ts">
  import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';

  import Header from '$components/Header.svelte';
  import ViewNavigation from '$components/ViewNavigation.svelte';
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import WortigerWordList from '$components/games/wortiger/WortigerWordList.svelte';

  const handleBackToDashboard = () => {
    goto(resolve(`/wortiger`));
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
