
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Stars, Float, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GameState, PlayerProfile, Outcome, MineData, IslandData, Ability } from './types';
import { PHASES, SHIPS, ABILITIES, WORLD_SIZE, DOCK_Y, ISLAND_Y, ACCELERATION, DECELERATION, MAX_SPEED, ROTATION_SPEED, TIME_LIMIT } from './constants';
import { generateBoard } from './gameUtils';
import { LucideShield, LucideTrophy, LucideCoins, LucideSettings, LucideShoppingBag, LucideShip, LucideArrowLeft, LucideTarget, LucideMapPin, LucideBomb } from 'lucide-react';

// --- 3D Components ---

const Water = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
    <planeGeometry args={[WORLD_SIZE * 5, WORLD_SIZE * 5]} />
    <meshStandardMaterial color="#004d7a" transparent opacity={0.85} />
  </mesh>
);

// Added key to props type to fix TS error in lists
const Island = ({ position, hasTreasure, onClick, isFoggy }: { position: [number, number, number], hasTreasure: boolean, onClick: () => void, isFoggy?: boolean, key?: React.Key }) => (
  <group position={position} onClick={onClick}>
    <mesh position={[0, 1, 0]}>
      <cylinderGeometry args={[8, 10, 3, 32]} />
      <meshStandardMaterial color={isFoggy ? "#444" : "#c2b280"} />
    </mesh>
    <mesh position={[0, 4, 0]}>
      <coneGeometry args={[4, 8, 8]} />
      <meshStandardMaterial color={isFoggy ? "#222" : "#2d5a27"} />
    </mesh>
    {hasTreasure && !isFoggy && (
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[0, 6, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="gold" emissive="gold" emissiveIntensity={2} />
        </mesh>
      </Float>
    )}
  </group>
);

// Added key to props type to fix TS error in lists
const Mine = ({ mine, isRevealed, isGhost }: { mine: MineData, isRevealed: boolean, isGhost?: boolean, key?: React.Key }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (meshRef.current && mine.velocity) {
      meshRef.current.position.x += mine.velocity[0] * delta * 60;
      meshRef.current.position.z += mine.velocity[1] * delta * 60;
      
      // Boundary bounce
      if (Math.abs(meshRef.current.position.x) > WORLD_SIZE / 2) mine.velocity[0] *= -1;
      if (meshRef.current.position.z < ISLAND_Y || meshRef.current.position.z > DOCK_Y) mine.velocity[1] *= -1;
      
      // Update data for collision detection
      mine.position[0] = meshRef.current.position.x;
      mine.position[2] = meshRef.current.position.z;
    }
  });

  if (!isRevealed && !isGhost) return null;

  return (
    <group ref={meshRef} position={mine.position}>
      <mesh>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial 
          color={isGhost ? "#444" : "#111"} 
          metalness={0.9} 
          roughness={0.1} 
          transparent={isGhost} 
          opacity={isGhost ? 0.3 : 1} 
        />
      </mesh>
      {[...Array(8)].map((_, i) => (
        <mesh key={i} rotation={[Math.PI * Math.random(), Math.PI * Math.random(), 0]}>
          <cylinderGeometry args={[0.1, 0.1, 2.8]} />
          <meshStandardMaterial color={isGhost ? "#222" : "red"} transparent={isGhost} opacity={isGhost ? 0.3 : 1} />
        </mesh>
      ))}
    </group>
  );
};

const Boat = React.forwardRef(({ shipId, hasShield, isGhost }: { shipId: string, hasShield: boolean, isGhost: boolean }, ref) => {
  const [position, setPosition] = useState<[number, number, number]>([0, 0, DOCK_Y]);
  const [rotation, setRotation] = useState(0);
  const [velocity, setVelocity] = useState({ x: 0, z: 0 });
  const input = useRef({ forward: false, backward: false, left: false, right: false, boost: false });
  const boatRef = useRef<THREE.Group>(null);
  const ship = SHIPS.find(s => s.id === shipId) || SHIPS[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) input.current.forward = true;
      if (['KeyS', 'ArrowDown'].includes(e.code)) input.current.backward = true;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) input.current.left = true;
      if (['KeyD', 'ArrowRight'].includes(e.code)) input.current.right = true;
      if (e.code === 'Space') input.current.boost = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) input.current.forward = false;
      if (['KeyS', 'ArrowDown'].includes(e.code)) input.current.backward = false;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) input.current.left = false;
      if (['KeyD', 'ArrowRight'].includes(e.code)) input.current.right = false;
      if (e.code === 'Space') input.current.boost = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!boatRef.current) return;

    let nextRot = rotation;
    if (input.current.left) nextRot += ROTATION_SPEED;
    if (input.current.right) nextRot -= ROTATION_SPEED;
    setRotation(nextRot);

    let accel = 0;
    if (input.current.forward) accel = ACCELERATION * ship.speedMult;
    if (input.current.backward) accel = -ACCELERATION * 0.5 * ship.speedMult;
    
    // Boost costs 1 coin per second (logic in parent)
    const vx = velocity.x * DECELERATION + Math.sin(nextRot) * accel;
    const vz = velocity.z * DECELERATION + Math.cos(nextRot) * accel;

    const speed = Math.sqrt(vx * vx + vz * vz);
    const max = MAX_SPEED * (input.current.boost ? 1.8 : 1);
    const finalVx = speed > max ? (vx / speed) * max : vx;
    const finalVz = speed > max ? (vz / speed) * max : vz;

    setVelocity({ x: finalVx, z: finalVz });
    const nextPos: [number, number, number] = [
      Math.max(-WORLD_SIZE, Math.min(WORLD_SIZE, position[0] + finalVx)),
      0,
      Math.max(ISLAND_Y - 10, Math.min(DOCK_Y + 10, position[2] + finalVz))
    ];
    setPosition(nextPos);

    boatRef.current.position.set(nextPos[0], nextPos[1], nextPos[2]);
    boatRef.current.rotation.y = nextRot;
    
    // Pass position back to ref for collision check
    if (ref && typeof ref !== 'function') {
      (ref as any).current = boatRef.current;
    }
  });

  return (
    <group ref={boatRef}>
      <mesh rotation={[0, 0, 0]}>
        <boxGeometry args={[1.5, 0.8, 3.5]} />
        <meshStandardMaterial color={isGhost ? "#88ffff" : "#4a2c1d"} transparent={isGhost} opacity={isGhost ? 0.4 : 1} />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 4]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh position={[0, 2.5, 0.5]}>
        <planeGeometry args={[2.5, 3]} />
        <meshStandardMaterial color="white" side={THREE.DoubleSide} transparent={isGhost} opacity={isGhost ? 0.4 : 1} />
      </mesh>
      {hasShield && (
        <mesh>
          <sphereGeometry args={[4, 32, 32]} />
          <meshStandardMaterial color="#00ffff" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
});

// --- Main App ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MAIN_MENU);
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('treasure_player');
    return saved ? JSON.parse(saved) : {
      id: 'p-' + Math.random().toString(36).substr(2, 5),
      name: 'Pirate', phase: 1, coins: 200, wins: 0, unlockedAbilities: [], ownedShips: ['dinghy'], activeShip: 'dinghy', totalDeliveries: 0, pirateRank: 0
    };
  });

  // Gameplay State
  const [board, setBoard] = useState<{ mines: MineData[], islands: IslandData[] }>({ mines: [], islands: [] });
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMIT);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [revealedMines, setRevealedMines] = useState<Set<string>>(new Set());
  const [activeAbilities, setActiveAbilities] = useState<Set<string>>(new Set());
  const [wrongIslands, setWrongIslands] = useState<Set<number>>(new Set());
  
  const boatRef = useRef<THREE.Group>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => { localStorage.setItem('treasure_player', JSON.stringify(profile)); }, [profile]);

  // Ability Handlers
  const useAbility = (abilityId: string) => {
    const ability = ABILITIES.find(a => a.id === abilityId);
    if (!ability || profile.coins < ability.useCost || activeAbilities.has(abilityId)) return;

    setProfile(p => ({ ...p, coins: p.coins - ability.useCost }));
    setActiveAbilities(prev => new Set(prev).add(abilityId));

    if (abilityId === 'sonar_ping' || abilityId === 'sonar_sweep') {
      // Reveal mines within a radius of the boat
      const boatPos = boatRef.current?.position;
      if (boatPos) {
        const radius = abilityId === 'sonar_ping' ? 25 : 45;
        const newRevealed = new Set(revealedMines);
        board.mines.forEach(m => {
          const d = Math.sqrt((m.position[0] - boatPos.x)**2 + (m.position[2] - boatPos.z)**2);
          if (d < radius) newRevealed.add(m.id);
        });
        setRevealedMines(newRevealed);
      }
      setTimeout(() => setActiveAbilities(prev => {
        const n = new Set(prev); n.delete(abilityId); return n;
      }), 3000);
    }

    if (abilityId === 'spyglass') {
      setRevealedMines(new Set(board.mines.map(m => m.id)));
      setTimeout(() => {
        setRevealedMines(new Set());
        setActiveAbilities(prev => { const n = new Set(prev); n.delete(abilityId); return n; });
      }, 3000);
    }

    if (abilityId === 'shield' || abilityId === 'ghost_ship') {
      setTimeout(() => setActiveAbilities(prev => {
        const n = new Set(prev); n.delete('shield'); return n;
      }), abilityId === 'shield' ? 10000 : 3000);
    }

    if (abilityId === 'volcano') {
      const wrong = board.islands.find(isl => !isl.hasTreasure && !wrongIslands.has(isl.id));
      if (wrong) setWrongIslands(prev => new Set(prev).add(wrong.id));
      setActiveAbilities(prev => { const n = new Set(prev); n.delete(abilityId); return n; });
    }
  };

  const handleGameOver = (finalOutcome: Outcome) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setOutcome(finalOutcome);
    setGameState(GameState.RESULTS);
    
    const currentPhase = PHASES.find(p => p.id === profile.phase)!;
    const reward = finalOutcome === Outcome.WIN ? currentPhase.winReward : 10;
    
    setProfile(p => {
      const nextPhase = PHASES.find(ph => ph.id === p.phase + 1);
      const canUnlock = nextPhase && (p.wins + 1 >= nextPhase.unlockWins || p.coins + reward >= nextPhase.unlockCost);
      return {
        ...p,
        coins: p.coins + reward,
        wins: finalOutcome === Outcome.WIN ? p.wins + 1 : p.wins,
        phase: canUnlock ? nextPhase!.id : p.phase
      };
    });
  };

  const startAttacker = () => {
    const newBoard = generateBoard(PHASES.find(p => p.id === profile.phase)!);
    setBoard(newBoard);
    setRevealedMines(new Set());
    setWrongIslands(new Set());
    setActiveAbilities(new Set());
    setTimeRemaining(TIME_LIMIT);
    setGameState(GameState.ATTACKER_RUN);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) { handleGameOver(Outcome.LOSS_TIMEOUT); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // Collision detection hook
  useEffect(() => {
    if (gameState !== GameState.ATTACKER_RUN) return;
    const interval = setInterval(() => {
      if (!boatRef.current) return;
      const bX = boatRef.current.position.x;
      const bZ = boatRef.current.position.z;

      // Mine collision
      for (const mine of board.mines) {
        const dist = Math.sqrt((bX - mine.position[0])**2 + (bZ - mine.position[2])**2);
        if (dist < 3) {
          if (activeAbilities.has('shield')) {
            setActiveAbilities(prev => { const n = new Set(prev); n.delete('shield'); return n; });
            setBoard(prev => ({ ...prev, mines: prev.mines.filter(m => m.id !== mine.id) }));
          } else if (!activeAbilities.has('ghost_ship')) {
            handleGameOver(Outcome.LOSS_MINE);
            break;
          }
        }
      }

      // Island docking
      for (const isl of board.islands) {
        const dist = Math.sqrt((bX - isl.position[0])**2 + (bZ - isl.position[2])**2);
        if (dist < 12) {
          if (isl.hasTreasure) handleGameOver(Outcome.WIN);
          else handleGameOver(Outcome.LOSS_WRONG_ISLAND);
          break;
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, board, activeAbilities]);

  return (
    <div className="relative w-full h-screen bg-slate-900 font-sans text-white overflow-hidden">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 65, 85]} fov={50} rotation={[-0.6, 0, 0]} />
        <Sky sunPosition={[10, 20, 10]} />
        <Stars radius={100} depth={50} count={5000} factor={4} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        <Environment preset="night" />
        
        <Water />
        
        {(gameState === GameState.ATTACKER_RUN || gameState === GameState.RESULTS) && (
          <>
            {board.islands.map(isl => (
              <Island 
                key={isl.id} 
                position={isl.position} 
                hasTreasure={isl.hasTreasure} 
                onClick={() => {}} 
                isFoggy={wrongIslands.has(isl.id)}
              />
            ))}
            {board.mines.map(m => (
              <Mine key={m.id} mine={m} isRevealed={revealedMines.has(m.id) || outcome !== null} />
            ))}
            <Boat 
              ref={boatRef} 
              shipId={profile.activeShip} 
              hasShield={activeAbilities.has('shield')} 
              isGhost={activeAbilities.has('ghost_ship')}
            />
          </>
        )}

        {gameState === GameState.DEFENDER_SETUP && (
          <group>
             {board.mines.map(m => <Mine key={m.id} mine={m} isRevealed={true} isGhost={true} />)}
             <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.1, 0]} onClick={(e) => {
               const p = e.point;
               setBoard(prev => ({ ...prev, mines: [...prev.mines, { id: Date.now().toString(), position: [p.x, 0, p.z] }] }));
             }}>
               <planeGeometry args={[WORLD_SIZE * 2, WORLD_SIZE]} />
               <meshBasicMaterial transparent opacity={0.1} color="red" />
             </mesh>
          </group>
        )}
      </Canvas>

      {/* UI: MAIN MENU */}
      {gameState === GameState.MAIN_MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-50">
          <h1 className="text-8xl font-pirate text-yellow-500 mb-8 drop-shadow-xl">STEAL THE TREASURE</h1>
          <div className="bg-slate-900/90 border-4 border-yellow-700 p-8 rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-yellow-500 uppercase text-xs font-bold">Phase {profile.phase}</p>
                <h2 className="text-3xl font-medieval">{PHASES[profile.phase-1].name}</h2>
              </div>
              <div className="bg-yellow-950/50 p-3 rounded-full border border-yellow-600 flex items-center gap-2">
                <LucideCoins className="text-yellow-500" />
                <span className="text-2xl font-bold">{profile.coins}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={startAttacker} className="bg-yellow-600 hover:bg-yellow-500 h-32 rounded-xl flex flex-col items-center justify-center gap-2 font-bold transition-all">
                <LucideTarget size={40} /> ATTACK
              </button>
              <button onClick={() => { setBoard({ mines: [], islands: [] }); setGameState(GameState.DEFENDER_SETUP); }} className="bg-indigo-600 hover:bg-indigo-500 h-32 rounded-xl flex flex-col items-center justify-center gap-2 font-bold transition-all">
                <LucideBomb size={40} /> DEFEND
              </button>
              <button onClick={() => setGameState(GameState.SHOP)} className="bg-slate-800 hover:bg-slate-700 h-16 rounded-xl flex items-center justify-center gap-2 font-bold transition-all">
                <LucideShoppingBag /> SHOP
              </button>
              <button className="bg-slate-800 hover:bg-slate-700 h-16 rounded-xl flex items-center justify-center gap-2 font-bold transition-all opacity-50 cursor-not-allowed">
                <LucideMapPin /> DELIVERY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UI: HUD */}
      {gameState === GameState.ATTACKER_RUN && (
        <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-black/50 p-4 rounded-xl border border-yellow-700/50">
              <p className="text-yellow-500 text-xs font-bold uppercase">Time Remaining</p>
              <p className={`text-5xl font-medieval ${timeRemaining < 10 ? 'text-red-500 animate-pulse' : ''}`}>{timeRemaining}s</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-black/50 p-3 rounded-xl border border-yellow-700/50 flex items-center gap-2">
                <span className="text-2xl font-bold">{profile.coins}</span>
                <LucideCoins className="text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pointer-events-auto">
            {profile.unlockedAbilities.map(id => {
              const ability = ABILITIES.find(a => a.id === id);
              if (!ability || ability.role !== 'Attacker') return null;
              const isActive = activeAbilities.has(id);
              return (
                <button 
                  key={id} 
                  onClick={() => useAbility(id)}
                  disabled={isActive || profile.coins < ability.useCost}
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-3xl transition-all shadow-lg ${isActive ? 'bg-yellow-500 border-white animate-pulse' : 'bg-black/70 border-yellow-600 hover:scale-110'}`}
                >
                  {ability.emoji}
                  <span className="absolute -bottom-2 bg-yellow-600 text-[10px] px-1 rounded">{ability.useCost}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* UI: DEFENDER SETUP */}
      {gameState === GameState.DEFENDER_SETUP && (
        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-4 z-50">
           <div className="bg-black/80 p-6 rounded-2xl border-4 border-indigo-600 text-center max-w-lg">
             <h2 className="text-2xl font-medieval mb-2 text-indigo-400">DEFENSE GRID</h2>
             <p className="text-sm text-slate-400 mb-4">Click on the water to place mines. Protect your stash!</p>
             <div className="flex gap-4 justify-center">
                <button onClick={() => setGameState(GameState.MAIN_MENU)} className="px-6 py-2 bg-slate-700 rounded-lg">CANCEL</button>
                <button onClick={() => setGameState(GameState.MAIN_MENU)} className="px-10 py-2 bg-indigo-600 rounded-lg font-bold">SAVE BOARD</button>
             </div>
           </div>
        </div>
      )}

      {/* UI: RESULTS */}
      {gameState === GameState.RESULTS && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 p-6">
          <div className="bg-slate-900 border-4 border-yellow-600 rounded-2xl p-10 max-w-md w-full text-center">
            <h2 className={`text-7xl font-pirate mb-4 ${outcome === Outcome.WIN ? 'text-yellow-500' : 'text-red-500'}`}>
              {outcome === Outcome.WIN ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              {outcome === Outcome.WIN ? 'The treasure is yours!' : 'The sea claims another victim...'}
            </p>
            <button onClick={() => setGameState(GameState.MAIN_MENU)} className="w-full bg-yellow-600 py-4 rounded-xl font-bold text-xl hover:bg-yellow-500 transition-all">CONTINUE</button>
          </div>
        </div>
      )}

      {/* UI: SHOP (Minimal for space) */}
      {gameState === GameState.SHOP && (
        <div className="absolute inset-0 bg-slate-950/95 z-[100] p-10 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <button onClick={() => setGameState(GameState.MAIN_MENU)}><LucideArrowLeft size={40} /></button>
            <h2 className="text-5xl font-pirate text-yellow-500">PIRATE EMPORIUM</h2>
            <div className="flex items-center gap-2"><span className="text-3xl font-bold">{profile.coins}</span><LucideCoins className="text-yellow-500" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
             {ABILITIES.filter(a => a.role === 'Attacker').map(a => {
               const owned = profile.unlockedAbilities.includes(a.id);
               return (
                 <div key={a.id} className="bg-slate-900 p-6 rounded-xl border-2 border-slate-800 flex flex-col">
                    <span className="text-4xl mb-2">{a.emoji}</span>
                    <h3 className="text-xl font-bold">{a.name}</h3>
                    <p className="text-xs text-slate-500 flex-1 mb-4">{a.description}</p>
                    {owned ? <div className="text-emerald-500 text-center font-bold">OWNED</div> : 
                      <button onClick={() => {
                        if (profile.coins >= a.buyCost) setProfile(p => ({ ...p, coins: p.coins - a.buyCost, unlockedAbilities: [...p.unlockedAbilities, a.id] }));
                      }} className="bg-yellow-600 py-2 rounded font-bold">BUY: {a.buyCost}</button>
                    }
                 </div>
               )
             })}
          </div>
        </div>
      )}
    </div>
  );
}
