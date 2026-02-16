<script lang="ts">
  import ViewWrapper from '$components/ViewWrapper.svelte';
  import type { GameComplete, GameType } from '$types';
  import { view } from '../stores/view-state-store.svelte';
  import { deleteGame } from '$lib/queries';
  import { getToastState } from '$lib/toast-state.svelte';
  import { isEckchenGame, isSpellingBeeGame, isWortgeflechtGame, isWortigerGame } from '../utils';

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
      if (
        gameName !== 'eckchen' &&
        gameName !== 'wortiger' &&
        gameName !== 'spelling-bee' &&
        gameName !== 'wortgeflecht'
      ) {
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

  const game = $derived(games.find((game: GameComplete) => game.id === view.selectedGameId));

  type DeleteMessageParts = {
    before: string;
    value: string;
    after: string;
  };

  const getDeleteMessageParts = (game: GameComplete): DeleteMessageParts | null => {
    if (isSpellingBeeGame(game)) {
      return {
        before: 'Bist du dir sicher, dass du das Spiel mit der Wortwolke ',
        value: String(game.wordcloud),
        after: ' löschen möchtest?',
      };
    }

    if (isWortigerGame(game)) {
      return {
        before: 'Bist du dir sicher, dass du das Spiel mit der Lösung ',
        value: String(game.solution),
        after: ' löschen möchtest?',
      };
    }

    if (isWortgeflechtGame(game) || isEckchenGame(game)) {
      return {
        before: 'Bist du dir sicher, dass du das Spiel ',
        value: game.name,
        after: ' löschen möchtest?',
      };
    }

    return null;
  };
</script>

<ViewWrapper>
  <div class="flex flex-col items-center gap-z-ds-14 py-z-ds-32">
    {#if game !== undefined}
      {@const message = getDeleteMessageParts(game)}
      <div>
        {#if message}
          {message.before}<strong>{message.value}</strong>{message.after}
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
