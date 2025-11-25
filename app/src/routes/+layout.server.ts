import { getApiBaseUrl } from '$lib/server/runtime-config';
import type { GameType } from '$types';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
  const gameType = url.pathname.split('/')[2] as GameType;
  
  if (!gameType || !['eckchen', 'wortiger', 'spelling-bee'].includes(gameType)) {
    return {};
  }

  // Get API base URL from private environment variables
  const apiBaseUrl = getApiBaseUrl(gameType);
  
  return {
    apiBaseUrl
  };
};
