<script lang="ts">
  import { onMount } from 'svelte';
  import { oidc } from '@zeitonline/svelte-oidc';
  import { dev } from '$app/environment';

  let { children }: { children: () => ReturnType<import('svelte').Snippet> } = $props();

  const authority = '/backoffice/openid/realms/zeit-online';
  const clientId = 'spiele-backoffice';

  onMount(() => {
    if (dev) return;

    oidc.manage({
      authority,
      client_id: clientId,
    });
  });
</script>so

{#if dev}
  {@render children()}
{:else if oidc.loading}
  <!-- Loading auth state: intentionally render nothing -->
{:else if oidc.isAuthenticated}
  {@render children()}
{:else}
  <div class="flex flex-col items-center justify-center h-screen">
    <p class="mb-8 text-lg">Bitte loggen Sie sich ein um fortzufahren.</p>
    <button class="bg-z-ds-general-black-100 text-z-ds-general-white-100" onclick={oidc.login}>
      Login
    </button>
    <p class="mt-8 text-m">
      Bei Problemen, melden Sie sich bitte im #team-emgagement Slack Channel
    </p>
  </div>
{/if}

<style>
  button {
    padding: 1.5rem 3rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 2rem;
  }

  button:hover {
    background-color: var(--z-ds-color-general-black-60);
  }
</style>
