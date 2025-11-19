<script lang="ts">
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import { BuchstabieneLogo, EckchenLogo, WortigerLogo } from '$components/games';

  const GAMES = [
    { name: 'Buchstabiene', path: '/buchstabiene', logo: BuchstabieneLogo, tag: 'coming soon', color: 'gray' },
    { name: 'Eckchen', path: '/eckchen', logo: EckchenLogo, tag: 'live', color: 'green' },
    { name: 'Wortiger', path: '/wortiger', logo: WortigerLogo, tag: 'live', color: 'green' },
  ];

  const tagColorClass = (color: string) => {
	switch (color) {
	  case 'green':
		return 'bg-z-ds-color-success-100/20 text-green-800 border-green-800';
	  case 'gray':
		return 'bg-z-ds-color-background-0/10 text-gray-800 border-gray-800';
	  default:
		return 'bg-transparent text-gray-800 border-gray-800';
	}
  }
</script>

<ViewWrapper>
  <h1 class="font-bold text-black text-center text-3xl">Spielkatalog</h1>

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
    {#each GAMES as game}
      <a
        href={game.path}
        class="hover:bg-gray-100 focus:bg-gray-100 border border-black flex p-4 items-center justify-between"
      >
	  	<div class="flex flex-col gap-1">
			  <span class="font-bold">{game.name}</span>
			  <span class={"text-xs italic " + tagColorClass(game.color) + " px-2 w-fit border  border-black"}>{game.tag}</span>
		</div>
        <game.logo classExtra="w-12 h-12" />
      </a>
    {/each}
  </div>
</ViewWrapper>
