<script lang="ts">
  import App from '$components/App.svelte';
  import Header from '$components/Header.svelte';

  let { data } = $props();
</script>

<Header gameName={data.gameType} />
<App {data} />
