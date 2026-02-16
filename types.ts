
export enum GameState {
  MAIN_MENU = 'MAIN_MENU',
  MATCHMAKING = 'MATCHMAKING',
  ATTACKER_RUN = 'ATTACKER_RUN',
  DEFENDER_SETUP = 'DEFENDER_SETUP',
  RESOLUTION_REVEAL = 'RESOLUTION_REVEAL',
  RESULTS = 'RESULTS',
  SHOP = 'SHOP',
  DELIVERY_SELECT = 'DELIVERY_SELECT',
  DELIVERY_RUN = 'DELIVERY_RUN',
  ARENA_LOBBY = 'ARENA_LOBBY',
  ARENA_RUN = 'ARENA_RUN'
}

export enum Outcome {
  WIN = 'WIN',
  LOSS_MINE = 'LOSS_MINE',
  LOSS_WRONG_ISLAND = 'LOSS_WRONG_ISLAND',
  LOSS_TIMEOUT = 'LOSS_TIMEOUT'
}

export interface Phase {
  id: number;
  name: string;
  islands: number;
  minMines: number;
  maxMines: number;
  winReward: number;
  unlockCost: number;
  unlockWins: number;
  features: string[];
}

export interface Ship {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  unlockPhase: number;
  unlockWins: number;
  speedMult: number;
  ability: string;
}

export interface Ability {
  id: string;
  name: string;
  emoji: string;
  role: 'Attacker' | 'Defender';
  phase: number;
  buyCost: number;
  useCost: number;
  description: string;
}

export interface MineData {
  id: string;
  position: [number, number, number]; // [x, y, z]
  isDecoy?: boolean;
  velocity?: [number, number];
}

export interface IslandData {
  id: number;
  position: [number, number, number];
  hasTreasure: boolean;
}

export interface PlayerProfile {
  id: string;
  name: string;
  phase: number;
  coins: number;
  wins: number;
  unlockedAbilities: string[];
  ownedShips: string[];
  activeShip: string;
  totalDeliveries: number;
  pirateRank: number;
}
