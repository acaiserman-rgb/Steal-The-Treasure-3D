
import { Phase, Ship, Ability } from './types';

export const PHASES: Phase[] = [
  { id: 1, name: "The Lone Island", islands: 1, minMines: 2, maxMines: 3, winReward: 50, unlockCost: 0, unlockWins: 0, features: ["Tutorial", "Single Island"] },
  { id: 2, name: "The Fork", islands: 2, minMines: 3, maxMines: 4, winReward: 75, unlockCost: 500, unlockWins: 5, features: ["Compass Hint", "Shield", "Volcano Warning"] },
  { id: 3, name: "The Trident", islands: 3, minMines: 4, maxMines: 5, winReward: 100, unlockCost: 1500, unlockWins: 15, features: ["Sonar", "Decoy Mines", "Collectibles"] },
  { id: 4, name: "Treacherous Waters", islands: 3, minMines: 5, maxMines: 6, winReward: 125, unlockCost: 3000, unlockWins: 30, features: ["Ocean Currents", "Anchor Drop", "Whirlpool"] },
  { id: 5, name: "Master Pirate", islands: 3, minMines: 6, maxMines: 7, winReward: 150, unlockCost: 5000, unlockWins: 50, features: ["Fog of War", "Spyglass", "Ghost Ship"] },
  { id: 6, name: "Shifting Tides", islands: 3, minMines: 5, maxMines: 7, winReward: 175, unlockCost: 8000, unlockWins: 70, features: ["Moving Mines"] },
  { id: 7, name: "Bermuda Triangle", islands: 3, minMines: 6, maxMines: 8, winReward: 200, unlockCost: 12000, unlockWins: 90, features: ["Teleport Zones"] },
  { id: 8, name: "Davy Jones' Locker", islands: 3, minMines: 6, maxMines: 8, winReward: 250, unlockCost: 18000, unlockWins: 120, features: ["Shrinking Boundaries"] },
];

export const SHIPS: Ship[] = [
  { id: 'dinghy', name: 'Dinghy', emoji: '⛵', cost: 0, unlockPhase: 1, unlockWins: 0, speedMult: 1.0, ability: 'None' },
  { id: 'sloop', name: 'Sloop', emoji: '🚤', cost: 300, unlockPhase: 2, unlockWins: 0, speedMult: 1.1, ability: 'Quick Turn' },
  { id: 'brigantine', name: 'Brigantine', emoji: '🚢', cost: 800, unlockPhase: 3, unlockWins: 0, speedMult: 1.15, ability: 'Reinforced Hull' },
  { id: 'frigate', name: 'Frigate', emoji: '🛥️', cost: 2000, unlockPhase: 4, unlockWins: 0, speedMult: 1.05, ability: 'Broadside' },
  { id: 'galleon', name: 'Galleon', emoji: '🛳️', cost: 5000, unlockPhase: 5, unlockWins: 0, speedMult: 0.95, ability: 'Treasure Magnet' },
  { id: 'manowar', name: 'Man-o\'-War', emoji: '🏴‍☠️', cost: 10000, unlockPhase: 5, unlockWins: 50, speedMult: 1.0, ability: 'War Drums' },
];

export const ABILITIES: Ability[] = [
  { id: 'compass', name: 'Compass Hint', emoji: '🧭', role: 'Attacker', phase: 2, buyCost: 500, useCost: 50, description: 'Shows correct island side for 2s' },
  { id: 'shield', name: 'Defense Shield', emoji: '🛡️', role: 'Attacker', phase: 2, buyCost: 300, useCost: 40, description: 'Survive one mine hit' },
  { id: 'volcano', name: 'Volcano Warning', emoji: '🌋', role: 'Attacker', phase: 2, buyCost: 75, useCost: 10, description: 'Marks one wrong island' },
  { id: 'sonar_ping', name: 'Sonar Ping', emoji: '📡', role: 'Attacker', phase: 3, buyCost: 150, useCost: 20, description: 'Reveals mines nearby' },
  { id: 'sonar_sweep', name: 'Sonar Sweep', emoji: '🔊', role: 'Attacker', phase: 3, buyCost: 250, useCost: 35, description: 'Pulsing mine reveal' },
  { id: 'anchor', name: 'Anchor Drop', emoji: '⚓', role: 'Attacker', phase: 4, buyCost: 200, useCost: 25, description: 'Stop all movement' },
  { id: 'spyglass', name: 'Spyglass', emoji: '🔭', role: 'Attacker', phase: 5, buyCost: 250, useCost: 35, description: 'Reveal map for 3s' },
  { id: 'ghost_ship', name: 'Ghost Ship', emoji: '👻', role: 'Attacker', phase: 5, buyCost: 300, useCost: 40, description: 'Invulnerability for 2s' },
  { id: 'fog_revealer', name: 'Fog Revealer', emoji: '🔍', role: 'Attacker', phase: 5, buyCost: 200, useCost: 30, description: 'Clears fog nearby' },
  { id: 'decoy', name: 'Decoy Mine', emoji: '👻', role: 'Defender', phase: 3, buyCost: 100, useCost: 15, description: 'Fake mine' },
  { id: 'whirlpool', name: 'Whirlpool', emoji: '🌀', role: 'Defender', phase: 4, buyCost: 200, useCost: 25, description: 'Pulling hazard' },
  { id: 'kraken', name: 'Kraken Reach', emoji: '🐙', role: 'Defender', phase: 5, buyCost: 250, useCost: 35, description: 'Wrong choice penalty x2' },
];

export const BOT_NAMES = ['Captain Grey', 'Blackbeard Jr', 'Sea Wolf', 'The Kraken', 'Salty Pete', 'Coral Queen', 'Storm Rider', 'Reef Runner'];

export const WORLD_SIZE = 100; // Unity-like internal coordinate units
export const ISLAND_Y = -40; // Top of the board (Z axis in 3D is usually depth)
export const DOCK_Y = 40;    // Bottom of the board
export const TIME_LIMIT = 25;
export const ACCELERATION = 0.015;
export const DECELERATION = 0.96;
export const MAX_SPEED = 0.35;
export const ROTATION_SPEED = 0.08;
