import { VIEW_HEIGHT, VIEW_WIDTH } from '../constants';
import { drawEnemy } from '../domains/enemies/enemies';
import { drawPlayer } from '../domains/player/player';
import type { EnemyBullet, World } from '../world';
import { drawBackground } from './background';
import { drawHud } from './hud';
import { drawText } from './text';

const SHAKE_STRENGTH = 6;
const FLASH_MAX_ALPHA = 0.7;
const FLASH_SECONDS = 0.35;

const drawPlatforms = (ctx: CanvasRenderingContext2D, world: World) => {
  world.stage.platforms.forEach((platform) => {
    ctx.fillStyle = world.stage.theme.platform;
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(platform.x, platform.y + platform.h - 4, platform.w, 4);
  });
};

const drawEnemyBullet = (ctx: CanvasRenderingContext2D, bullet: EnemyBullet) => {
  const centerX = bullet.x + bullet.w / 2;
  const centerY = bullet.y + bullet.h / 2;

  switch (bullet.look) {
    case 'alert': {
      ctx.fillStyle = '#e5484d';
      ctx.beginPath();
      ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, bullet.text, centerX, centerY, { size: 14, align: 'center' });
      return;
    }
    case 'bubble': {
      ctx.fillStyle = '#fff5fa';
      ctx.strokeStyle = '#ff8fbd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bullet.x, bullet.y, bullet.w, bullet.h, bullet.h / 2);
      ctx.fill();
      ctx.stroke();
      drawText(ctx, bullet.text, centerX, centerY, { size: 14, color: '#a0336a', align: 'center' });
      return;
    }
    case 'wave': {
      ctx.fillStyle = 'rgba(255, 143, 189, 0.85)';
      ctx.beginPath();
      ctx.ellipse(centerX, bullet.y + bullet.h, bullet.w / 2, bullet.h, 0, Math.PI, 0);
      ctx.fill();
      drawText(ctx, bullet.text, centerX, centerY + 4, { size: 14, align: 'center' });
      return;
    }
    case 'document': {
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);
      ctx.fillStyle = '#8f96a8';
      ctx.fillRect(bullet.x + 4, bullet.y + 6, bullet.w - 8, 2);
      ctx.fillRect(bullet.x + 4, bullet.y + 12, bullet.w - 8, 2);
      ctx.fillRect(bullet.x + 4, bullet.y + 18, bullet.w - 12, 2);
      return;
    }
  }
};

const drawPickups = (ctx: CanvasRenderingContext2D, world: World) => {
  world.pickups.forEach((pickup) => {
    // 커피 컵
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(pickup.x, pickup.y, pickup.w, pickup.h);
    ctx.fillStyle = '#7a4a2a';
    ctx.fillRect(pickup.x, pickup.y + 6, pickup.w, 8);
  });
};

const drawEffects = (ctx: CanvasRenderingContext2D, world: World) => {
  world.particles.forEach((particle) => {
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  });
  ctx.globalAlpha = 1;

  world.floatingTexts.forEach((floatingText) => {
    drawText(ctx, floatingText.text, floatingText.x, floatingText.y, {
      size: 16,
      color: floatingText.color,
      align: 'center',
      outline: '#000000',
    });
  });
};

export const renderWorld = (ctx: CanvasRenderingContext2D, world: World) => {
  drawBackground(ctx, world);

  const isShaking = world.shakeTimer > 0;
  const shakeX = isShaking ? (Math.random() - 0.5) * SHAKE_STRENGTH : 0;
  const shakeY = isShaking ? (Math.random() - 0.5) * SHAKE_STRENGTH : 0;

  ctx.save();
  ctx.translate(-world.cameraX + shakeX, shakeY);

  drawPlatforms(ctx, world);
  drawPickups(ctx, world);
  world.enemies.forEach((enemy) => drawEnemy(ctx, enemy));
  world.boss?.draw(ctx, world);
  drawPlayer(ctx, world.player);

  ctx.fillStyle = '#ffe066';
  world.playerBullets.forEach((bullet) => ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h));
  world.enemyBullets.forEach((bullet) => drawEnemyBullet(ctx, bullet));
  drawEffects(ctx, world);

  ctx.restore();

  if (world.flashTimer > 0) {
    ctx.fillStyle = `rgba(125, 255, 176, ${(world.flashTimer / FLASH_SECONDS) * FLASH_MAX_ALPHA})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  drawHud(ctx, world);
};
