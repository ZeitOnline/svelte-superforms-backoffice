<script lang="ts">
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import type { GameComplete, GameType } from '$types';
  import { view } from '../stores/view-state-store.svelte';
  import { deleteGame } from '$lib/queries';
  import { APP_MESSAGES } from '$lib/app-messages';
  import { getToastState } from '$lib/toast-state.svelte';
  import { isEckchenGame, isSpellingBeeGame, isWortigerGame } from '../utils';

  let {
    games,
    gameName,
  }: { games: GameComplete[]; gameName: GameType } = $props();
  const toastManager = getToastState();

  const handleBackToDashboard = () => {
    view.updateView('dashboard');
    view.updateSelectedGameId(-1);
  };

  const handleDeleteFromList = async (id: number) => {
    if (toastManager) {
      toastManager.add(
        'Spiel wird gelöscht',
        `Bitte warten Sie einen Moment, bis die Aktion abgeschlossen ist.`,
      );
    }

    try {
      if (gameName !== 'eckchen' && gameName !== 'wortiger' && gameName !== 'spelling-bee') {
        throw new Error('Game type is not defined');
      }
      await deleteGame(gameName, id);

      setTimeout(() => {
        view.updateView('dashboard');
        view.updateSelectedGameId(-1);
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error deleting game:', error);

      if (toastManager) {
        toastManager.add('Fehler beim Löschen', `Das Spiel konnte nicht gelöscht werden.`);
      }
    }
  };

  const game = games.find((game: GameComplete) => game.id === view.selectedGameId);
</script>

<ViewWrapper>
  <div class="flex flex-col items-center gap-z-ds-14 py-z-ds-32">
    {#if game !== undefined}
      <div>
        {#if isSpellingBeeGame(game)}
          {@html APP_MESSAGES.GAME.DELETE_SPELLING_BEE.replace(
            '{wordcloud}',
            String(game.wordcloud),
          )}
        {:else if isWortigerGame(game)}
          {@html APP_MESSAGES.GAME.DELETE_WORTIGER.replace('{solution}', String(game.solution))}
        {:else if isEckchenGame(game)}
          {@html APP_MESSAGES.GAME.DELETE_ECKCHEN.replace('{name}', game.name)}
        {/if}
      </div>
      <div class="flex justify-end gap-z-ds-8">
        <button class="z-ds-button z-ds-button-outline" onclick={handleBackToDashboard}
          >Abbrechen</button
        >
        <button class="z-ds-button" onclick={() => handleDeleteFromList(game.id)}>Löschen</button>
      </div>
    {/if}
  </div>
</ViewWrapper>
