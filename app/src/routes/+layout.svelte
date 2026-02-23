<script lang="ts">
  import '../app.css';
  import BreakpointsDebug from '$components/BreakpointsDebug.svelte';
  import Toaster from '$components/toast/Toaster.svelte';
  import { setToastState } from '$lib/toast-state.svelte';
  import OidcLogin from '$components/OidcLogin.svelte';

  let { children }: { children: () => ReturnType<import('svelte').Snippet> } = $props();

  setToastState();
</script>

<OidcLogin>
  <div class="max-w-5xl w-full mx-auto px-5 md:px-12 py-24">
    {@render children()}
  </div>
</OidcLogin>

<BreakpointsDebug />
<Toaster />
