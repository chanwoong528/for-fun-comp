import { GROUND_Y, VIEW_WIDTH } from '../../constants';
import { ellipse, fillAndStroke, heartPath, OUTLINE_COLOR, roundedRect } from '../../render/shapes';
import { sfx } from '../../sfx';
import type { Direction, Rect } from '../../types';
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

type EnemySpec = { w: number; h: number; hp: number; startY: number; color: string };

const ENEMY_SPECS: Record<EnemyKind, EnemySpec> = {
  bug: { w: 38, h: 30, hp: 2, startY: GROUND_Y - 30, color: '#5fbf4a' },
  ticket: { w: 44, h: 30, hp: 1, startY: 250, color: '#3b82f6' },
  alarm: { w: 36, h: 44, hp: 3, startY: GROUND_Y - 44, color: '#e5484d' },
  invite: { w: 44, h: 30, hp: 2, startY: 110, color: '#9b6bff' },
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
const ALARM_WARNING_SECONDS = 0.4;

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

const drawWings = (ctx: CanvasRenderingContext2D, age: number) => {
  const flap = Math.sin(age * 22) * 0.45;

  [-1, 1].forEach((side) => {
    ctx.save();
    ctx.translate(side * 13, -11);
    ctx.rotate(side * (0.5 + flap));
    ellipse(ctx, side * 9, 0, 11, 5);
    fillAndStroke(ctx, '#ffffff');
    ctx.restore();
  });
};

const drawBug = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
  // 꼼지락거리는 다리
  ctx.beginPath();
  [-1, 0, 1].forEach((legIndex) => {
    const wiggle = Math.sin(enemy.age * 18 + legIndex * 2) * 3;
    ctx.moveTo(legIndex * 9 + 2, 6);
    ctx.lineTo(legIndex * 9 - 3 + wiggle, 15);
  });
  ctx.stroke();

  ellipse(ctx, 3, 0, 16, 12);
  fillAndStroke(ctx, '#6fd35a');
  ctx.fillStyle = '#3f9b34';
  [[7, -4, 3], [11, 4, 2.4], [-1, 3, 2.6]].forEach(([spotX, spotY, radius]) => {
    ellipse(ctx, spotX, spotY, radius, radius);
    ctx.fill();
  });

  // 더듬이와 머리
  ctx.beginPath();
  ctx.moveTo(-15, -3);
  ctx.quadraticCurveTo(-19, -10, -23, -12);
  ctx.moveTo(-11, -4);
  ctx.quadraticCurveTo(-12, -12, -15, -15);
  ctx.stroke();
  ellipse(ctx, -13, 3, 8.5, 8.5);
  fillAndStroke(ctx, '#3f9b34');
  ellipse(ctx, -15.5, 1.5, 3.6, 3.6);
  fillAndStroke(ctx, '#ffffff');
  ellipse(ctx, -16.6, 1.8, 1.6, 1.6);
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-20, -4);
  ctx.lineTo(-12, -2.5);
  ctx.stroke();
};

const drawTicket = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
  drawWings(ctx, enemy.age);
  ctx.rotate(Math.sin(enemy.age * 3) * 0.08);

  roundedRect(ctx, -20, -13, 40, 26, 5);
  fillAndStroke(ctx, '#4c8dff');
  ctx.fillStyle = '#2f6fe0';
  ctx.beginPath();
  ctx.roundRect(-19, -12, 38, 8, [4, 4, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-15, -1, 7, 7);
  ctx.fillRect(-5, 0, 19, 2.4);
  ctx.fillRect(-5, 5, 12, 2.4);
  ctx.strokeStyle = '#2f6fe0';
  ctx.beginPath();
  ctx.moveTo(-13.5, 2.5);
  ctx.lineTo(-11.8, 4.4);
  ctx.lineTo(-9.4, 0.6);
  ctx.stroke();
};

const drawAlarm = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
  const isAboutToShoot = enemy.shootTimer < ALARM_WARNING_SECONDS;
  if (isAboutToShoot) ctx.translate(Math.sin(enemy.age * 70) * 2, 0);

  // 다리와 종
  ctx.beginPath();
  ctx.moveTo(-9, 15);
  ctx.lineTo(-13, 22);
  ctx.moveTo(9, 15);
  ctx.lineTo(13, 22);
  ctx.stroke();
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(side * 11, -13, 8, 7, side * 0.5, Math.PI, Math.PI * 2);
    ctx.closePath();
    fillAndStroke(ctx, '#ffcf5a');
  });

  ellipse(ctx, 0, 3, 17, 17);
  fillAndStroke(ctx, isAboutToShoot ? '#ff6b6b' : '#e5484d');
  ellipse(ctx, 0, 3, 11.5, 11.5);
  fillAndStroke(ctx, '#fff8ec');

  // 시곗바늘: 마감 직전을 가리킨다
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.lineTo(0, -5);
  ctx.moveTo(0, 3);
  ctx.lineTo(-5, 0);
  ctx.stroke();
};

const drawInvite = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
  drawWings(ctx, enemy.age);

  roundedRect(ctx, -20, -13, 40, 26, 4);
  fillAndStroke(ctx, '#b99cff');
  ctx.beginPath();
  ctx.moveTo(-20, -11);
  ctx.lineTo(0, 4);
  ctx.lineTo(20, -11);
  ctx.stroke();
  heartPath(ctx, 0, 3, 4.5);
  fillAndStroke(ctx, '#ff5a7a');
};

const ENEMY_DRAWERS: Record<EnemyKind, (ctx: CanvasRenderingContext2D, enemy: Enemy) => void> = {
  bug: drawBug,
  ticket: drawTicket,
  alarm: drawAlarm,
  invite: drawInvite,
};

// 적은 왼쪽을 바라보는 모양으로 그리고, 플레이어가 오른쪽에 있으면 뒤집는다
export const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy, facing: Direction) => {
  ctx.save();
  ctx.translate(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
  ctx.scale(-facing, 1);
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE_COLOR;
  ENEMY_DRAWERS[enemy.kind](ctx, enemy);
  ctx.restore();
};
