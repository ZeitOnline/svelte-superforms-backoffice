import { env } from '$env/dynamic/private';
import type { GameType } from '$types';
import { CONFIG_GAMES } from '../../config/games.config';

/**
 * Reads from private environment variables, so has to be server-side only.
 */
export function getApiBaseUrl(gameName: GameType): string {
  if (env?.ZON_ENVIRONMENT === 'staging') {
    return `https://spiele.staging.zeit.de${CONFIG_GAMES[gameName].apiBase}`;
  } else if (env?.ZON_ENVIRONMENT === 'production') {
    return `https://spiele.zeit.de${CONFIG_GAMES[gameName].apiBase}`;
  }

  // Development fallback
  return CONFIG_GAMES[gameName].apiBase;
}
