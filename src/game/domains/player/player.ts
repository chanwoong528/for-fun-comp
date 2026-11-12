import { GRAVITY, GROUND_Y, VIEW_WIDTH } from '../../constants';
import type { Input } from '../../input';
import { drawPerson, type PersonLook } from '../../render/pixelPerson';
import { drawNameTag } from '../../render/text';
import { sfx } from '../../sfx';
import type { Direction, Rect } from '../../types';
import type { World } from '../../world';
import { addFloatingText, centerOf, clamp, spawnBurst } from '../../worldActions';
import { damageEnemy } from '../enemies/enemies';

export type Player = Rect & {
  vx: number;
  vy: number;
  facing: Direction;
  isOnGround: boolean;
  isAimingUp: boolean;
  hp: number;
  hotfixCount: number;
  shootCooldown: number;
  invulnerableTimer: number;
  persuadedTimer: number;
  walkPhase: number;
};

export const PLAYER_NAME = '민창우';
export const PLAYER_MAX_HP = 6;
export const PLAYER_BULLET_DAMAGE = 1;

export const PLAYER_LOOK: PersonLook = {
  skin: '#f2c9a0',
  hair: '#22222a',
  top: '#2f7de1',
  bottom: '#2b2f45',
  tie: null,
  hasGlasses: true,
};

const PLAYER_WIDTH = 34;
const PLAYER_HEIGHT = 62;
const PLAYER_SPEED = 230;
const PLAYER_JUMP_VELOCITY = 660;
const PLAYER_START_HOTFIX_COUNT = 2;
const WALK_ANIMATION_SPEED = 14;

const SHOOT_INTERVAL_SECONDS = 0.13;
const BULLET_SPEED = 720;
const BULLET_LENGTH = 16;
const BULLET_THICKNESS = 6;

const HOTFIX_ENEMY_DAMAGE = 5;
const HOTFIX_BOSS_DAMAGE = 12;
const HOTFIX_FLASH_SECONDS = 0.35;

const BLINK_INTERVAL_SECONDS = 0.1;
const LANDING_TOLERANCE = 0.01;

export const createPlayer = (x: number): Player => ({
  x,
  y: GROUND_Y - PLAYER_HEIGHT,
  w: PLAYER_WIDTH,
  h: PLAYER_HEIGHT,
  vx: 0,
  vy: 0,
  facing: 1,
  isOnGround: true,
  isAimingUp: false,
  hp: PLAYER_MAX_HP,
  hotfixCount: PLAYER_START_HOTFIX_COUNT,
  shootCooldown: 0,
  invulnerableTimer: 0,
  persuadedTimer: 0,
  walkPhase: 0,
});

// 떨어지는 중에 발이 통과한 가장 높은 바닥(땅 또는 발판)의 y를 찾는다
const findLandingY = (world: World, previousBottom: number): number | null => {
  const { player, stage } = world;
  if (player.vy < 0) return null;

  const currentBottom = player.y + player.h;
  const surfaceTops = stage.platforms
    .filter((platform) => player.x + player.w > platform.x && player.x < platform.x + platform.w)
    .map((platform) => platform.y)
    .concat(GROUND_Y);

  const crossedTops = surfaceTops.filter(
    (top) => previousBottom <= top + LANDING_TOLERANCE && currentBottom >= top,
  );
  if (crossedTops.length === 0) return null;

  return Math.min(...crossedTops);
};

const movePlayer = (world: World, dt: number) => {
  const { player } = world;
  const previousBottom = player.y + player.h;

  player.vy += GRAVITY * dt;
  player.x = clamp(player.x + player.vx * dt, world.cameraX, world.cameraX + VIEW_WIDTH - player.w);
  player.y += player.vy * dt;

  const landingY = findLandingY(world, previousBottom);
  player.isOnGround = landingY !== null;
  if (landingY === null) return;

  player.y = landingY - player.h;
  player.vy = 0;
};

const fireBullet = (world: World) => {
  const { player } = world;
  const center = centerOf(player);
  player.shootCooldown = SHOOT_INTERVAL_SECONDS;
  sfx.shoot();

  if (player.isAimingUp) {
    world.playerBullets.push({
      x: center.x - BULLET_THICKNESS / 2,
      y: player.y - BULLET_LENGTH,
      w: BULLET_THICKNESS,
      h: BULLET_LENGTH,
      vx: 0,
      vy: -BULLET_SPEED,
    });
    return;
  }

  world.playerBullets.push({
    x: player.facing === 1 ? player.x + player.w : player.x - BULLET_LENGTH,
    y: player.y + player.h * 0.45,
    w: BULLET_LENGTH,
    h: BULLET_THICKNESS,
    vx: player.facing * BULLET_SPEED,
    vy: 0,
  });
};

// 핫픽스 배포: 화면의 적 탄을 모두 지우고 모든 적과 보스에게 피해를 준다
const deployHotfix = (world: World) => {
  const { player } = world;
  player.hotfixCount -= 1;
  world.enemyBullets = [];
  world.flashTimer = HOTFIX_FLASH_SECONDS;
  addFloatingText(world, player.x + player.w / 2, player.y - 30, '핫픽스 배포!', '#7dffb0');
  sfx.hotfix();

  [...world.enemies].forEach((enemy) => damageEnemy(world, enemy, HOTFIX_ENEMY_DAMAGE));
  world.boss?.takeDamage(world, HOTFIX_BOSS_DAMAGE, 'hotfix');
};

export const updatePlayer = (world: World, input: Input, dt: number) => {
  const { player } = world;
  player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);
  player.persuadedTimer = Math.max(0, player.persuadedTimer - dt);
  player.shootCooldown = Math.max(0, player.shootCooldown - dt);

  // 설득당한 동안에는 마음이 돌아서서 좌우 조작이 반대로 먹는다
  const inputDirection = Number(input.isDown('right')) - Number(input.isDown('left'));
  const moveDirection = player.persuadedTimer > 0 ? -inputDirection : inputDirection;

  player.vx = moveDirection * PLAYER_SPEED;
  player.isAimingUp = input.isDown('up');
  if (moveDirection !== 0) {
    player.facing = moveDirection > 0 ? 1 : -1;
    player.walkPhase += dt * WALK_ANIMATION_SPEED;
  }

  if (input.wasPressed('jump') && player.isOnGround) {
    player.vy = -PLAYER_JUMP_VELOCITY;
    player.isOnGround = false;
    sfx.jump();
  }

  movePlayer(world, dt);

  if (input.isDown('shoot') && player.shootCooldown === 0) fireBullet(world);
  if (input.wasPressed('special') && player.hotfixCount > 0) deployHotfix(world);
};

export const healPlayer = (world: World, amount: number) => {
  const { player } = world;
  player.hp = Math.min(PLAYER_MAX_HP, player.hp + amount);
  spawnBurst(world, player.x + player.w / 2, player.y, '#ffd27d', 6);
};

const drawKeyboardGun = (ctx: CanvasRenderingContext2D, player: Player) => {
  ctx.fillStyle = '#c9ced8';

  if (player.isAimingUp) {
    ctx.fillRect(player.x + player.w / 2 - 5, player.y - 12, 10, 22);
    return;
  }

  const gunX = player.facing === 1 ? player.x + player.w - 6 : player.x - 16;
  ctx.fillRect(gunX, player.y + player.h * 0.42, 22, 9);
};

export const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
  const isBlinkedOut =
    player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / BLINK_INTERVAL_SECONDS) % 2 === 0;
  if (isBlinkedOut) return;

  drawPerson(ctx, { ...player, look: PLAYER_LOOK, isFlashing: false });
  drawKeyboardGun(ctx, player);
  drawNameTag(ctx, PLAYER_NAME, player.x + player.w / 2, player.y - 12);
};
