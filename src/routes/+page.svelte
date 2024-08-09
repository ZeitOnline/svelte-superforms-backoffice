<script lang="ts">
	import SuperDebug, { fileProxy } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { superForm } from 'sveltekit-superforms';
	import { enhance } from '$app/forms';

  let { data } = $props<{ data: PageData }>();

  const { form, constraints, errors } = superForm(data.form);

  const file = fileProxy(form, 'image')

</script>

<SuperDebug data={$form} />

<form method="POST" enctype="multipart/form-data" use:enhance>
	<label for="name">Names</label>
	<input type="text" name="name" aria-invalid={$errors.name ? 'true' : undefined} bind:value={$form.name} />
	{#if $errors.name}<span style="color: red;" class="invalid">{$errors.name}</span>{/if}

	<label for="email">E-mail</label>
	<input type="email" name="email" bind:value={$form.email} {...$constraints.email} />

	<input
    type="file"
    name="image"
    accept="image/png, image/jpeg"
    bind:files={$file}
  />
  {#if $errors.image}<span style="color: red;">{$errors.image}</span>{/if}

	<div><button>Submit</button></div>
</form>
