import { sfx } from './sfx';
import type { Point, Rect } from './types';
import type { EnemyBullet, World } from './world';

const PLAYER_INVULNERABLE_SECONDS = 1.2;
const PLAYER_PERSUADED_SECONDS = 2.5;
const HURT_SHAKE_SECONDS = 0.25;
const FLOATING_TEXT_SECONDS = 1.1;
const PARTICLE_SPEED = 220;
const PARTICLE_SECONDS = 0.5;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const isOverlapping = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const centerOf = (rect: Rect): Point => ({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });

export const aimVelocity = (from: Point, to: Point, speed: number, angleOffset = 0) => {
  const angle = Math.atan2(to.y - from.y, to.x - from.x) + angleOffset;
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
};

export const pickRandom = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export const spawnBurst = (world: World, x: number, y: number, color: string, count: number) => {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = PARTICLE_SPEED * (0.3 + Math.random() * 0.7);
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: PARTICLE_SECONDS,
      maxLife: PARTICLE_SECONDS,
      color,
      size: 3 + Math.random() * 4,
    });
  }
};

export const addFloatingText = (world: World, x: number, y: number, text: string, color: string) => {
  world.floatingTexts.push({ x, y, text, color, life: FLOATING_TEXT_SECONDS });
};

export const spawnEnemyBullet = (world: World, bullet: Omit<EnemyBullet, 'age'>) => {
  world.enemyBullets.push({ ...bullet, age: 0 });
};

export const hurtPlayer = (world: World, damage: number) => {
  const { player } = world;
  const canBeHurt = player.hp > 0 && player.invulnerableTimer === 0;
  if (!canBeHurt) return;

  const center = centerOf(player);
  player.hp = Math.max(0, player.hp - damage);
  player.invulnerableTimer = PLAYER_INVULNERABLE_SECONDS;
  world.shakeTimer = HURT_SHAKE_SECONDS;
  spawnBurst(world, center.x, center.y, '#ff5a5a', 10);
  sfx.hurt();
};

export const persuadePlayer = (world: World) => {
  const { player } = world;
  if (player.hp <= 0) return;

  player.persuadedTimer = PLAYER_PERSUADED_SECONDS;
  addFloatingText(world, player.x + player.w / 2, player.y - 30, '설득당함…', '#ff9ecb');
  sfx.persuade();
};
