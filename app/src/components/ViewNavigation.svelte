<script lang="ts">
  import type { GameType } from '$types';

  type Props = {
    viewName: string;
    mainAction: () => void;
    mainActionText: string;
    gameName: GameType;
  };

  let { viewName, mainAction, mainActionText, gameName }: Props = $props();

  const uppercaseFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
</script>

<nav class="flex justify-between w-full items-center mb-z-ds-12">
  <div class="flex flex-col">
    <span class="font-bold">{uppercaseFirstLetter(gameName)}</span>
    <span class="text-z-ds-general-black-80 text-xs">{viewName}</span>
  </div>

  <button class="z-ds-button" onclick={mainAction}>{mainActionText}</button>
</nav>
