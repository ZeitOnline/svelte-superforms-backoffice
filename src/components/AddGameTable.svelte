<script lang="ts">
    let { resultsDataHeader, resultsDataBody }: { resultsDataHeader: Array<string>; resultsDataBody: Array<string> } = $props();
</script>

<h2>Cool table</h2>
{#if resultsDataHeader.length > 0 && resultsDataBody.length > 0}
	<form>
		<table>
			<thead>
				<tr>
					{#each resultsDataHeader as column}
						<th>{column}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each resultsDataBody as row, i (i)}
					<tr>
						{#each row as cell, j (j)}
							<td>
								<input type="text" bind:value={resultsDataBody[i][j]} />
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		<button class="z-ds-button" type="submit">Create New Game</button>
	</form>
{/if}
