import { VIEW_HEIGHT, VIEW_WIDTH } from '../constants';
import { PLAYER_MAX_HP, PLAYER_NAME } from '../domains/player/player';
import type { World } from '../world';
import { drawText } from './text';

const HUD_MARGIN = 20;
const HEART_SIZE = 18;
const HEART_GAP = 6;
const BOSS_BAR_WIDTH = 420;
const BOSS_BAR_HEIGHT = 14;
const BOSS_BAR_Y = 62;

const drawHearts = (ctx: CanvasRenderingContext2D, hp: number) => {
  for (let index = 0; index < PLAYER_MAX_HP; index += 1) {
    ctx.fillStyle = index < hp ? '#ff5a6e' : 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(HUD_MARGIN + index * (HEART_SIZE + HEART_GAP), 40, HEART_SIZE, HEART_SIZE);
  }
};

const drawBossBar = (ctx: CanvasRenderingContext2D, world: World) => {
  const { boss } = world;
  if (!boss) return;

  const barX = (VIEW_WIDTH - BOSS_BAR_WIDTH) / 2;
  const hpRatio = boss.hp / boss.maxHp;

  drawText(ctx, `${boss.name} ${boss.title}`, VIEW_WIDTH / 2, BOSS_BAR_Y - 16, {
    size: 16,
    align: 'center',
    outline: '#000000',
  });
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX - 3, BOSS_BAR_Y - 3, BOSS_BAR_WIDTH + 6, BOSS_BAR_HEIGHT + 6);
  ctx.fillStyle = '#e5484d';
  ctx.fillRect(barX, BOSS_BAR_Y, BOSS_BAR_WIDTH * hpRatio, BOSS_BAR_HEIGHT);
};

const drawPersuadedNotice = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = 'rgba(255, 120, 180, 0.14)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  drawText(ctx, '설득당하는 중… 좌우 조작 반전!', VIEW_WIDTH / 2, 110, {
    size: 20,
    color: '#ffc2dc',
    align: 'center',
    outline: '#5c1f3d',
  });
};

export const drawHud = (ctx: CanvasRenderingContext2D, world: World) => {
  const { player, stage, stageIndex } = world;

  drawText(ctx, PLAYER_NAME, HUD_MARGIN, 22, { size: 16, outline: '#000000' });
  drawHearts(ctx, player.hp);
  drawText(ctx, `핫픽스 ×${player.hotfixCount}`, HUD_MARGIN, 76, { size: 14, color: '#7dffb0', outline: '#000000' });
  drawText(ctx, `STAGE ${stageIndex + 1} · ${stage.name}`, VIEW_WIDTH - HUD_MARGIN, 22, {
    size: 14,
    align: 'right',
    outline: '#000000',
  });

  drawBossBar(ctx, world);
  if (player.persuadedTimer > 0) drawPersuadedNotice(ctx);
};
