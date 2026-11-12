import { GRAVITY, GROUND_Y, VIEW_HEIGHT, VIEW_WIDTH } from './constants';
import { createEnemy, damageEnemy, updateEnemies } from './domains/enemies/enemies';
import { healPlayer, PLAYER_BULLET_DAMAGE, updatePlayer } from './domains/player/player';
import type { Input } from './input';
import { sfx } from './sfx';
import type { Rect } from './types';
import { getArenaLeft, type EnemyBullet, type PlayerBullet, type World } from './world';
import {
  addFloatingText,
  centerOf,
  clamp,
  hurtPlayer,
  isOverlapping,
  persuadePlayer,
  spawnBurst,
} from './worldActions';

// 플레이어를 화면 왼쪽 35% 지점에 두고 따라간다. 카메라는 뒤로 돌아가지 않는다.
const CAMERA_LEAD_RATIO = 0.35;
const SPAWN_AHEAD_DISTANCE = 40;
const OFFSCREEN_MARGIN = 120;
const ENEMY_BULLET_DAMAGE = 1;
const WOBBLE_SPEED = 5;
const COFFEE_HEAL_AMOUNT = 1;
const FLOATING_TEXT_RISE_SPEED = 40;

const isNearView = (world: World, rect: Rect) =>
  rect.x + rect.w > world.cameraX - OFFSCREEN_MARGIN &&
  rect.x < world.cameraX + VIEW_WIDTH + OFFSCREEN_MARGIN &&
  rect.y + rect.h > -OFFSCREEN_MARGIN &&
  rect.y < VIEW_HEIGHT + OFFSCREEN_MARGIN;

const updateCamera = (world: World) => {
  const arenaLeft = getArenaLeft(world.stage);
  const followX = world.player.x - VIEW_WIDTH * CAMERA_LEAD_RATIO;

  world.cameraX = clamp(Math.max(world.cameraX, followX), 0, arenaLeft);
  world.isArenaReached = world.cameraX >= arenaLeft;
};

const spawnPendingEnemies = (world: World) => {
  const spawnLineX = world.cameraX + VIEW_WIDTH + SPAWN_AHEAD_DISTANCE;
  const readySpawns = world.pendingSpawns.filter((spawn) => spawn.x <= spawnLineX);
  if (readySpawns.length === 0) return;

  readySpawns.forEach((spawn) => world.enemies.push(createEnemy(spawn.kind, spawn.x)));
  world.pendingSpawns = world.pendingSpawns.filter((spawn) => spawn.x > spawnLineX);
};

// 총알이 무언가에 맞아 사라져야 하면 true
const resolvePlayerBulletHit = (world: World, bullet: PlayerBullet): boolean => {
  const hitEnemy = world.enemies.find((enemy) => isOverlapping(bullet, enemy));
  if (hitEnemy) {
    damageEnemy(world, hitEnemy, PLAYER_BULLET_DAMAGE);
    return true;
  }

  const hitBubble = world.enemyBullets.find(
    (enemyBullet) => enemyBullet.isShootable && isOverlapping(bullet, enemyBullet),
  );
  if (hitBubble) {
    const center = centerOf(hitBubble);
    world.enemyBullets = world.enemyBullets.filter((enemyBullet) => enemyBullet !== hitBubble);
    spawnBurst(world, center.x, center.y, '#ffb3d1', 8);
    return true;
  }

  const { boss } = world;
  const isBossHit = boss !== null && boss.hp > 0 && isOverlapping(bullet, boss);
  if (!isBossHit) return false;

  boss.takeDamage(world, PLAYER_BULLET_DAMAGE, 'bullet');
  return true;
};

const updatePlayerBullets = (world: World, dt: number) => {
  world.playerBullets = world.playerBullets.filter((bullet) => {
    bullet.age += dt;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    const isOnScreen = bullet.x + bullet.w > world.cameraX && bullet.x < world.cameraX + VIEW_WIDTH && bullet.y > 0;
    if (!isOnScreen) return false;

    return !resolvePlayerBulletHit(world, bullet);
  });
};

const applyEnemyBulletEffect = (world: World, bullet: EnemyBullet) => {
  if (bullet.effect === 'persuade') {
    persuadePlayer(world);
    return;
  }

  hurtPlayer(world, ENEMY_BULLET_DAMAGE);
};

const updateEnemyBullets = (world: World, dt: number) => {
  // 순회 중 world.enemyBullets 가 바뀌지 않도록 맞은 탄을 먼저 모은 뒤 효과를 적용한다
  const hitBullets: EnemyBullet[] = [];

  world.enemyBullets = world.enemyBullets.filter((bullet) => {
    bullet.age += dt;
    bullet.x += bullet.vx * dt;
    bullet.y += (bullet.vy + Math.sin(bullet.age * WOBBLE_SPEED) * bullet.wobble) * dt;

    if (!isNearView(world, bullet)) return false;
    if (!isOverlapping(bullet, world.player)) return true;

    hitBullets.push(bullet);
    return false;
  });

  hitBullets.forEach((bullet) => applyEnemyBulletEffect(world, bullet));
};

const updatePickups = (world: World, dt: number) => {
  world.pickups = world.pickups.filter((pickup) => {
    pickup.vy += GRAVITY * dt;
    pickup.y = Math.min(GROUND_Y - pickup.h, pickup.y + pickup.vy * dt);

    if (!isOverlapping(pickup, world.player)) return pickup.x + pickup.w > world.cameraX;

    healPlayer(world, COFFEE_HEAL_AMOUNT);
    addFloatingText(world, pickup.x + pickup.w / 2, pickup.y - 10, '커피 수혈 +1', '#ffd27d');
    sfx.pickup();
    return false;
  });
};

export const updateEffects = (world: World, dt: number) => {
  world.shakeTimer = Math.max(0, world.shakeTimer - dt);
  world.flashTimer = Math.max(0, world.flashTimer - dt);

  world.particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  });
  world.particles = world.particles.filter((particle) => particle.life > 0);

  world.floatingTexts.forEach((floatingText) => {
    floatingText.y -= FLOATING_TEXT_RISE_SPEED * dt;
    floatingText.life -= dt;
  });
  world.floatingTexts = world.floatingTexts.filter((floatingText) => floatingText.life > 0);
};

export const updateWorld = (world: World, input: Input, dt: number) => {
  world.time += dt;
  updatePlayer(world, input, dt);
  updateCamera(world);
  spawnPendingEnemies(world);
  updateEnemies(world, dt);
  world.boss?.update(world, dt);
  updatePlayerBullets(world, dt);
  updateEnemyBullets(world, dt);
  updatePickups(world, dt);
  updateEffects(world, dt);
};
