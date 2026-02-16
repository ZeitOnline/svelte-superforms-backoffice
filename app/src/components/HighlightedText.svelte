<script lang="ts">
  import type { HighlightSegment } from '$utils';

  type Props = {
    segments: HighlightSegment[];
  };

  let { segments }: Props = $props();
</script>

{#each segments as segment, index (index)}
  {#if segment.match}
    <mark class="bg-yellow-300">{segment.text}</mark>
  {:else}
    {segment.text}
  {/if}
{/each}
