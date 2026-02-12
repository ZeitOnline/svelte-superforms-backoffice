<script lang="ts">
  import App from '$components/App.svelte';
  import Header from '$components/Header.svelte';
  import type { DataProps } from '$types';

  let { data } = $props();
</script>

<Header gameName={data.gameType} />
<App data={data as DataProps} />
