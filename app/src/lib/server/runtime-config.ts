import type { GameType } from '$types';
import { CONFIG_GAMES } from '../../config/games.config';

/**
 * Reads from private environment variables, so has to be server-side only.
 */
export function getApiBaseUrl(gameName: GameType): string {
  const basePath = '/backoffice';
  return `${basePath}${CONFIG_GAMES[gameName].apiBase}`;
}
