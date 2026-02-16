
import { MineData, IslandData, Phase } from './types';
import { WORLD_SIZE, ISLAND_Y, DOCK_Y } from './constants';

export const generateBoard = (phase: Phase): { mines: MineData[], islands: IslandData[] } => {
  const mineCount = Math.floor(Math.random() * (phase.maxMines - phase.minMines + 1)) + phase.minMines;
  const mines: MineData[] = [];
  
  // Islands setup
  const islandConfigs = [
    { id: 0, x: -33, z: ISLAND_Y },
    { id: 1, x: 0, z: ISLAND_Y },
    { id: 2, x: 33, z: ISLAND_Y },
  ];
  
  const activeIslands = islandConfigs.slice(0, phase.islands);
  const treasureIdx = Math.floor(Math.random() * activeIslands.length);
  const islands: IslandData[] = activeIslands.map((config, idx) => ({
    id: config.id,
    position: [config.x, 0, config.z],
    hasTreasure: idx === treasureIdx
  }));

  // Simple random mine placement with spacing
  for (let i = 0; i < mineCount; i++) {
    let x, z;
    let attempts = 0;
    let valid = false;
    
    while (!valid && attempts < 50) {
      x = (Math.random() - 0.5) * WORLD_SIZE * 0.8;
      z = (Math.random() - 0.5) * (DOCK_Y - ISLAND_Y) + (ISLAND_Y + 15);
      
      // Check distance from existing mines
      const farFromMines = mines.every(m => 
        Math.sqrt((m.position[0] - x!)**2 + (m.position[2] - z!)**2) > 8
      );
      
      // Check distance from islands
      const farFromIslands = islands.every(isl => 
        Math.sqrt((isl.position[0] - x!)**2 + (isl.position[2] - z!)**2) > 15
      );

      // Check distance from dock
      const farFromDock = Math.abs(z - DOCK_Y) > 15;

      if (farFromMines && farFromIslands && farFromDock) {
        valid = true;
        mines.push({
          id: `mine-${i}`,
          position: [x, 0, z],
          velocity: phase.id >= 6 ? [(Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05] : undefined
        });
      }
      attempts++;
    }
  }

  return { mines, islands };
};

export const checkCollision = (p1: [number, number], p2: [number, number], radiusSum: number) => {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy) < radiusSum;
};
