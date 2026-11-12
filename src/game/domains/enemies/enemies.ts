import { GROUND_Y, VIEW_WIDTH } from '../../constants';
import { drawText } from '../../render/text';
import { sfx } from '../../sfx';
import type { Rect } from '../../types';
import type { World } from '../../world';
import {
  aimVelocity,
  centerOf,
  hurtPlayer,
  isOverlapping,
  spawnBurst,
  spawnEnemyBullet,
} from '../../worldActions';

export type EnemyKind = 'bug' | 'ticket' | 'alarm' | 'invite';

export type Enemy = Rect & {
  kind: EnemyKind;
  hp: number;
  age: number;
  baseY: number;
  shootTimer: number;
};

type EnemySpec = { w: number; h: number; hp: number; startY: number; color: string; label: string };

const ENEMY_SPECS: Record<EnemyKind, EnemySpec> = {
  bug: { w: 38, h: 30, hp: 2, startY: GROUND_Y - 30, color: '#5fbf4a', label: 'BUG' },
  ticket: { w: 44, h: 30, hp: 1, startY: 250, color: '#3b82f6', label: 'JIRA' },
  alarm: { w: 36, h: 44, hp: 3, startY: GROUND_Y - 44, color: '#e5484d', label: '마감' },
  invite: { w: 44, h: 30, hp: 2, startY: 110, color: '#9b6bff', label: '회의' },
};

const CONTACT_DAMAGE = 1;
const DESPAWN_MARGIN = 200;
const COFFEE_DROP_CHANCE = 0.15;
const COFFEE_SIZE = 20;

const BUG_SPEED = 90;
const TICKET_SPEED = 130;
const TICKET_WAVE_HEIGHT = 40;
const TICKET_WAVE_SPEED = 3;
const INVITE_SPEED = 110;
const ALARM_SHOOT_INTERVAL_SECONDS = 2;
const ALARM_BULLET_SPEED = 230;
const ALARM_BULLET_SIZE = 18;

export const createEnemy = (kind: EnemyKind, x: number): Enemy => {
  const spec = ENEMY_SPECS[kind];

  return {
    kind,
    x,
    y: spec.startY,
    w: spec.w,
    h: spec.h,
    hp: spec.hp,
    age: 0,
    baseY: spec.startY,
    shootTimer: ALARM_SHOOT_INTERVAL_SECONDS / 2,
  };
};

const removeEnemy = (world: World, enemy: Enemy) => {
  const center = centerOf(enemy);
  world.enemies = world.enemies.filter((candidate) => candidate !== enemy);
  spawnBurst(world, center.x, center.y, ENEMY_SPECS[enemy.kind].color, 12);
  sfx.enemyDown();

  if (Math.random() >= COFFEE_DROP_CHANCE) return;

  world.pickups.push({ x: center.x - COFFEE_SIZE / 2, y: center.y, w: COFFEE_SIZE, h: COFFEE_SIZE, vy: -200 });
};

export const damageEnemy = (world: World, enemy: Enemy, damage: number) => {
  enemy.hp -= damage;
  if (enemy.hp > 0) return;

  removeEnemy(world, enemy);
};

const shootAlarmBullet = (world: World, enemy: Enemy) => {
  const from = centerOf(enemy);
  const velocity = aimVelocity(from, centerOf(world.player), ALARM_BULLET_SPEED);

  spawnEnemyBullet(world, {
    x: from.x - ALARM_BULLET_SIZE / 2,
    y: from.y - ALARM_BULLET_SIZE / 2,
    w: ALARM_BULLET_SIZE,
    h: ALARM_BULLET_SIZE,
    ...velocity,
    look: 'alert',
    effect: 'damage',
    text: '!',
    isShootable: false,
    wobble: 0,
  });
};

const moveEnemy = (world: World, enemy: Enemy, dt: number) => {
  const playerCenter = centerOf(world.player);
  const enemyCenter = centerOf(enemy);

  switch (enemy.kind) {
    case 'bug': {
      enemy.x += Math.sign(playerCenter.x - enemyCenter.x) * BUG_SPEED * dt;
      return;
    }
    case 'ticket': {
      enemy.x -= TICKET_SPEED * dt;
      enemy.y = enemy.baseY + Math.sin(enemy.age * TICKET_WAVE_SPEED) * TICKET_WAVE_HEIGHT;
      return;
    }
    case 'invite': {
      const velocity = aimVelocity(enemyCenter, playerCenter, INVITE_SPEED);
      enemy.x += velocity.vx * dt;
      enemy.y += velocity.vy * dt;
      return;
    }
    case 'alarm': {
      enemy.shootTimer -= dt;
      const isOnScreen = enemy.x < world.cameraX + VIEW_WIDTH;
      if (enemy.shootTimer > 0 || !isOnScreen) return;

      enemy.shootTimer = ALARM_SHOOT_INTERVAL_SECONDS;
      shootAlarmBullet(world, enemy);
      return;
    }
  }
};

export const updateEnemies = (world: World, dt: number) => {
  world.enemies.forEach((enemy) => {
    enemy.age += dt;
    moveEnemy(world, enemy, dt);
    if (isOverlapping(enemy, world.player)) hurtPlayer(world, CONTACT_DAMAGE);
  });

  world.enemies = world.enemies.filter((enemy) => enemy.x + enemy.w > world.cameraX - DESPAWN_MARGIN);
};

export const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
  const spec = ENEMY_SPECS[enemy.kind];
  const { x, y, w, h } = enemy;

  ctx.fillStyle = spec.color;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(x, y + h - 5, w, 5);

  if (enemy.kind === 'bug') {
    // 벌레 다리가 꼼지락거린다
    const legLift = Math.sin(enemy.age * 16) * 3;
    ctx.fillStyle = '#2f6b25';
    ctx.fillRect(x - 5, y + 8 + legLift, 5, 4);
    ctx.fillRect(x - 5, y + 20 - legLift, 5, 4);
    ctx.fillRect(x + w, y + 8 - legLift, 5, 4);
    ctx.fillRect(x + w, y + 20 + legLift, 5, 4);
  }

  if (enemy.kind === 'alarm') {
    // 알람 시계의 종
    ctx.fillStyle = '#ffd27d';
    ctx.fillRect(x + 2, y - 6, 10, 6);
    ctx.fillRect(x + w - 12, y - 6, 10, 6);
  }

  drawText(ctx, spec.label, x + w / 2, y + h / 2, { size: 12, align: 'center' });
};
