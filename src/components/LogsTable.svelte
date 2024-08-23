<script lang="ts">
	import type { Log } from '$types';
	import { cubicInOut } from 'svelte/easing';
	import { blur } from 'svelte/transition';
	import { transformedPublishedDataWithTime } from '../utils';

	let { logs }: { logs: Log[] } = $props();
</script>

<div class="relative overflow-x-auto py-z-ds-8 my-z-ds-24" aria-live="polite">
	<table
		id="search-results-table"
		class="w-full text-sm text-left rtl:text-right text-z-ds-general-black-100"
	>
		<thead>
			<tr>
				<th class="text-nowrap">Datum</th>
				<th>Game Id</th>
				<th>Aktion</th>
				<th>Benutzer</th>
			</tr>
		</thead>
		<tbody>
			{#if logs.length > 0}
				{#each logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as item (item.id)}
					<tr in:blur={{ duration: 300, delay: 0, easing: cubicInOut }}>
						<td>{transformedPublishedDataWithTime(item.created_at)}</td>
						<td>{item.game_id}</td>
						<td>
                            <div class={`flex items-center gap-z-ds-4`}>
                                {item.action.toUpperCase()}         
                            </div>
                        </td>
						<td>{item.user_name}</td>
					</tr>
				{/each}
			{:else}
				<tr>
					<td colspan="5" class="text-center py-z-ds-8">No data found</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>
