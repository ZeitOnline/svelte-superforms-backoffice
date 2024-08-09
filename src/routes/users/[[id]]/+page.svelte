<script lang="ts">
    import type { PageServerData } from './$types.js';
    import { page } from '$app/stores';
    import { superForm } from 'sveltekit-superforms';

    type IUsers = {
        id: string;
        name: string;
        email: string;
    }[]
  
    let { data } = $props<{ data: PageServerData }>();

    function getUserDataById(id: string) {
        const users: IUsers = data.users
        return users.find(user => user.id === id)
    }

    const user = getUserDataById($page.params.id)
  
    const { form, errors, constraints, enhance, delayed, message } = superForm(
      data.form, {
        resetForm: false
      }
    );
  </script>
  
  {#if $message}
    <h3 class:invalid={$page.status >= 400}>{$message}</h3>
  {/if}
  
  <h2>{!$form.id ? 'Create' : 'Update'} {user?.name}</h2>