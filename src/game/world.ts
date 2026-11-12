import { VIEW_WIDTH } from './constants';
import type { Boss } from './domains/bosses/boss';
import type { Enemy } from './domains/enemies/enemies';
import { createPlayer, type Player } from './domains/player/player';
import { STAGES, type SpawnPoint, type StageDefinition } from './stages';
import type { Rect } from './types';

export type PlayerBullet = Rect & { vx: number; vy: number };

export type EnemyBulletLook = 'alert' | 'bubble' | 'wave' | 'document';
export type EnemyBulletEffect = 'damage' | 'persuade';

export type EnemyBullet = Rect & {
  vx: number;
  vy: number;
  look: EnemyBulletLook;
  effect: EnemyBulletEffect;
  text: string;
  isShootable: boolean;
  wobble: number;
  age: number;
};

export type Pickup = Rect & { vy: number };

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

export type FloatingText = { x: number; y: number; text: string; color: string; life: number };

export type World = {
  stageIndex: number;
  stage: StageDefinition;
  time: number;
  cameraX: number;
  isArenaReached: boolean;
  player: Player;
  playerBullets: PlayerBullet[];
  enemyBullets: EnemyBullet[];
  enemies: Enemy[];
  pickups: Pickup[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  boss: Boss | null;
  pendingSpawns: SpawnPoint[];
  shakeTimer: number;
  flashTimer: number;
};

const PLAYER_START_X = 80;

export const getArenaLeft = (stage: StageDefinition) => stage.length - VIEW_WIDTH;

export const createWorld = (stageIndex: number, shouldSkipToBoss: boolean): World => {
  const stage = STAGES[stageIndex];
  const arenaLeft = getArenaLeft(stage);
  const startCameraX = shouldSkipToBoss ? arenaLeft : 0;

  return {
    stageIndex,
    stage,
    time: 0,
    cameraX: startCameraX,
    isArenaReached: false,
    player: createPlayer(startCameraX + PLAYER_START_X),
    playerBullets: [],
    enemyBullets: [],
    enemies: [],
    pickups: [],
    particles: [],
    floatingTexts: [],
    boss: null,
    pendingSpawns: shouldSkipToBoss ? [] : [...stage.spawns].sort((a, b) => a.x - b.x),
    shakeTimer: 0,
    flashTimer: 0,
  };
};
