<script lang="ts">
  import type { DataProps } from '$types';
  import App from '$components/App.svelte';
  import Header from '$components/Header.svelte';

  let { data } = $props();
</script>

<Header gameName="wortgeflecht" />
<App data={data as DataProps} />
