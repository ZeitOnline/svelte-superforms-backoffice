import type { Component } from 'svelte';
import type { GameType } from '$types';
import { EckchenLogo, SpellingBeeLogo, WortgeflechtLogo, WortigerLogo } from '$components/games';

type GameUiSubnavItem = {
  label: string;
  href: GameUiRoute;
  routeId: GameUiRoute;
};

type GameStatusTag = 'live' | 'coming soon';
type GameStatusColor = 'green' | 'gray';

type GameUiRoute =
  | '/eckchen'
  | '/wortiger'
  | '/wortiger/wortliste'
  | '/spelling-bee'
  | '/wortgeflecht';

export type GameUiConfig = {
  id: GameType;
  label: string;
  href: GameUiRoute;
  logo: Component<{ classExtra?: string }>;
  status: {
    tag: GameStatusTag;
    color: GameStatusColor;
  };
  subnav?: GameUiSubnavItem[];
};

export const GAME_UI_CONFIG: GameUiConfig[] = [
  {
    id: 'spelling-bee',
    label: 'Buchstabiene',
    href: '/spelling-bee',
    logo: SpellingBeeLogo,
    status: {
      tag: 'live',
      color: 'green',
    },
  },
  {
    id: 'eckchen',
    label: 'Eckchen',
    href: '/eckchen',
    logo: EckchenLogo,
    status: {
      tag: 'live',
      color: 'green',
    },
  },
  {
    id: 'wortiger',
    label: 'Wortiger',
    href: '/wortiger',
    logo: WortigerLogo,
    status: {
      tag: 'live',
      color: 'green',
    },
    subnav: [
      { label: 'Dashboard', href: '/wortiger', routeId: '/wortiger' },
      { label: 'Wortliste', href: '/wortiger/wortliste', routeId: '/wortiger/wortliste' },
    ],
  },
  {
    id: 'wortgeflecht',
    label: 'Wortgeflecht',
    href: '/wortgeflecht',
    logo: WortgeflechtLogo,
    status: {
      tag: 'coming soon',
      color: 'gray',
    },
  },
];

export const GAME_UI_BY_ID = Object.fromEntries(
  GAME_UI_CONFIG.map(config => [config.id, config]),
) as Record<GameType, GameUiConfig>;
