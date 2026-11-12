import { VIEW_HEIGHT, VIEW_WIDTH } from '../constants';
import { drawEnemy } from '../domains/enemies/enemies';
import { drawPlayer } from '../domains/player/player';
import type { EnemyBullet, PlayerBullet, World } from '../world';
import { drawBackdrop, drawProps, drawVignette } from './background';
import { drawHud } from './hud';
import { drawGlow, ellipse, fillAndStroke, heartPath, OUTLINE_COLOR, roundedRect, verticalGradient } from './shapes';
import { drawText } from './text';

const SHAKE_STRENGTH = 6;
const FLASH_MAX_ALPHA = 0.7;
const FLASH_SECONDS = 0.35;
const BULLET_TRAIL_LENGTH = 26;
const DOCUMENT_SPIN_SPEED = 5;
const WAVE_HEART_COUNT = 3;

const useOutline = (ctx: CanvasRenderingContext2D, width: number) => {
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
};

const drawPlatforms = (ctx: CanvasRenderingContext2D, world: World) => {
  const { theme } = world.stage;

  world.stage.platforms.forEach((platform) => {
    const { x, y, w, h } = platform;

    // 벽에 고정된 받침대
    useOutline(ctx, 2.2);
    [x + 22, x + w - 36].forEach((bracketX) => {
      ctx.beginPath();
      ctx.moveTo(bracketX, y + h);
      ctx.lineTo(bracketX + 14, y + h);
      ctx.lineTo(bracketX, y + h + 16);
      ctx.closePath();
      fillAndStroke(ctx, theme.platformShade);
    });

    roundedRect(ctx, x, y, w, h, 5);
    fillAndStroke(ctx, verticalGradient(ctx, y, y + h, theme.platform, theme.platformShade));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(x + 6, y + 3, w - 12, 2);
  });
};

const drawPlayerBullet = (ctx: CanvasRenderingContext2D, bullet: PlayerBullet) => {
  const centerX = bullet.x + bullet.w / 2;
  const centerY = bullet.y + bullet.h / 2;
  const isVertical = bullet.vx === 0;
  const direction = isVertical ? -1 : Math.sign(bullet.vx);

  ctx.save();
  ctx.translate(centerX, centerY);
  if (isVertical) ctx.rotate(-Math.PI / 2);
  else ctx.scale(direction, 1);

  // 꼬리 잔상 → 빛 번짐 → 탄두
  const trail = ctx.createLinearGradient(-BULLET_TRAIL_LENGTH, 0, 0, 0);
  trail.addColorStop(0, 'rgba(255, 224, 102, 0)');
  trail.addColorStop(1, 'rgba(255, 224, 102, 0.7)');
  ctx.fillStyle = trail;
  ctx.fillRect(-BULLET_TRAIL_LENGTH, -2.5, BULLET_TRAIL_LENGTH, 5);
  drawGlow(ctx, 0, 0, 16, '255, 224, 102', 0.7);
  roundedRect(ctx, -8, -3.5, 16, 7, 3.5);
  ctx.fillStyle = '#fff7c2';
  ctx.fill();

  ctx.restore();
};

const drawAlertBullet = (ctx: CanvasRenderingContext2D, bullet: EnemyBullet, centerX: number, centerY: number) => {
  drawGlow(ctx, centerX, centerY, bullet.w * 1.5, '255, 80, 80', 0.7);
  useOutline(ctx, 2);
  ellipse(ctx, centerX, centerY, bullet.w / 2, bullet.h / 2);
  fillAndStroke(ctx, '#ff5a5a');
  drawText(ctx, bullet.text, centerX, centerY + 1, { size: 14, align: 'center' });
};

const drawBubbleBullet = (ctx: CanvasRenderingContext2D, bullet: EnemyBullet, centerX: number, centerY: number) => {
  drawGlow(ctx, centerX, centerY, bullet.w * 0.6, '255, 143, 189', 0.35);
  ctx.strokeStyle = '#e0669f';
  ctx.lineWidth = 2;
  roundedRect(ctx, bullet.x, bullet.y, bullet.w, bullet.h, bullet.h / 2);
  fillAndStroke(ctx, '#fff3f8');
  heartPath(ctx, bullet.x + 15, centerY, 5);
  ctx.fillStyle = '#ff6fa5';
  ctx.fill();
  drawText(ctx, bullet.text, centerX + 8, centerY + 1, { size: 14, color: '#a0336a', align: 'center' });
};

const drawWaveBullet = (ctx: CanvasRenderingContext2D, bullet: EnemyBullet, centerX: number) => {
  const baseY = bullet.y + bullet.h;
  drawGlow(ctx, centerX, baseY - 8, bullet.w * 1.3, '255, 143, 189', 0.55);

  ctx.fillStyle = 'rgba(255, 143, 189, 0.9)';
  ctx.beginPath();
  ctx.ellipse(centerX, baseY, bullet.w / 2 + 6, bullet.h, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#c94584';
  ctx.lineWidth = 1.6;
  for (let heart = 0; heart < WAVE_HEART_COUNT; heart += 1) {
    const heartX = centerX + (heart - 1) * 13;
    const heartY = baseY - 14 - Math.abs(Math.sin(bullet.age * 9 + heart * 1.3)) * 10;
    heartPath(ctx, heartX, heartY, 5);
    fillAndStroke(ctx, '#ffffff');
  }
};

const drawDocumentBullet = (ctx: CanvasRenderingContext2D, bullet: EnemyBullet, centerX: number, centerY: number) => {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(bullet.age * DOCUMENT_SPIN_SPEED);

  useOutline(ctx, 1.8);
  roundedRect(ctx, -bullet.w / 2, -bullet.h / 2, bullet.w, bullet.h, 2);
  fillAndStroke(ctx, '#fbfbf6');
  ctx.fillStyle = '#9aa1b5';
  [-8, -3, 2].forEach((lineY) => ctx.fillRect(-bullet.w / 2 + 4, lineY, bullet.w - 8, 2));
  ctx.fillStyle = '#e5484d';
  ctx.fillRect(1, 7, 6, 4);

  ctx.restore();
};

const drawEnemyBullet = (ctx: CanvasRenderingContext2D, bullet: EnemyBullet) => {
  const centerX = bullet.x + bullet.w / 2;
  const centerY = bullet.y + bullet.h / 2;

  switch (bullet.look) {
    case 'alert':
      drawAlertBullet(ctx, bullet, centerX, centerY);
      return;
    case 'bubble':
      drawBubbleBullet(ctx, bullet, centerX, centerY);
      return;
    case 'wave':
      drawWaveBullet(ctx, bullet, centerX);
      return;
    case 'document':
      drawDocumentBullet(ctx, bullet, centerX, centerY);
      return;
  }
};

const drawPickups = (ctx: CanvasRenderingContext2D, world: World) => {
  world.pickups.forEach((pickup) => {
    const centerX = pickup.x + pickup.w / 2;
    const bob = Math.sin(world.time * 5 + pickup.x) * 2;
    const top = pickup.y + bob;

    // 테이크아웃 커피 컵
    drawGlow(ctx, centerX, top + pickup.h / 2, 26, '255, 210, 125', 0.5);
    useOutline(ctx, 2);
    ctx.beginPath();
    ctx.moveTo(pickup.x + 1, top + 4);
    ctx.lineTo(pickup.x + pickup.w - 1, top + 4);
    ctx.lineTo(pickup.x + pickup.w - 4, top + pickup.h);
    ctx.lineTo(pickup.x + 4, top + pickup.h);
    ctx.closePath();
    fillAndStroke(ctx, '#fbfbf6');
    ctx.fillStyle = '#9a623a';
    ctx.fillRect(pickup.x + 3, top + 9, pickup.w - 6, 6);
    roundedRect(ctx, pickup.x - 1, top, pickup.w + 2, 5, 2);
    fillAndStroke(ctx, '#7a4a2a');
  });
};

const drawEffects = (ctx: CanvasRenderingContext2D, world: World) => {
  // 불꽃 입자는 겹칠수록 밝아지도록 가산 합성으로 그린다
  ctx.globalCompositeOperation = 'lighter';
  world.particles.forEach((particle) => {
    const lifeRatio = particle.life / particle.maxLife;
    ctx.globalAlpha = lifeRatio;
    ctx.fillStyle = particle.color;
    ellipse(ctx, particle.x, particle.y, particle.size * (0.4 + lifeRatio), particle.size * (0.4 + lifeRatio));
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  world.floatingTexts.forEach((floatingText) => {
    drawText(ctx, floatingText.text, floatingText.x, floatingText.y, {
      size: 17,
      color: floatingText.color,
      align: 'center',
      outline: '#17131f',
    });
  });
};

export const renderWorld = (ctx: CanvasRenderingContext2D, world: World) => {
  drawBackdrop(ctx, world);

  const isShaking = world.shakeTimer > 0;
  const shakeX = isShaking ? (Math.random() - 0.5) * SHAKE_STRENGTH : 0;
  const shakeY = isShaking ? (Math.random() - 0.5) * SHAKE_STRENGTH : 0;
  const playerCenterX = world.player.x + world.player.w / 2;

  ctx.save();
  ctx.translate(-world.cameraX + shakeX, shakeY);

  drawProps(ctx, world);
  drawPlatforms(ctx, world);
  drawPickups(ctx, world);
  world.enemies.forEach((enemy) => drawEnemy(ctx, enemy, playerCenterX < enemy.x + enemy.w / 2 ? -1 : 1));
  world.boss?.draw(ctx, world);
  drawPlayer(ctx, world.player, world.time);
  world.playerBullets.forEach((bullet) => drawPlayerBullet(ctx, bullet));
  world.enemyBullets.forEach((bullet) => drawEnemyBullet(ctx, bullet));
  drawEffects(ctx, world);

  ctx.restore();

  drawVignette(ctx);

  if (world.flashTimer > 0) {
    ctx.fillStyle = `rgba(125, 255, 176, ${(world.flashTimer / FLASH_SECONDS) * FLASH_MAX_ALPHA})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  drawHud(ctx, world);
};
