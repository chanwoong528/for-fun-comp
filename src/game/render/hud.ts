import { VIEW_HEIGHT, VIEW_WIDTH } from '../constants';
import { isInSecondPhase } from '../domains/bosses/boss';
import { PLAYER_MAX_HP, PLAYER_NAME } from '../domains/player/player';
import type { World } from '../world';
import { heartPath, OUTLINE_COLOR, roundedRect } from './shapes';
import { drawText, FONT_FAMILY } from './text';

const PANEL_X = 14;
const PANEL_Y = 12;
const PANEL_WIDTH = 222;
const PANEL_HEIGHT = 88;
const PANEL_COLOR = 'rgba(14, 12, 26, 0.68)';

const HEART_SIZE = 8.5;
const HEART_SPACING = 23;
const HOTFIX_CHIP_WIDTH = 58;
const HOTFIX_CHIP_HEIGHT = 17;

const BOSS_BAR_WIDTH = 400;
const BOSS_BAR_HEIGHT = 16;
const BOSS_BAR_Y = 44;
const SECOND_PHASE_MARK_RATIO = 0.5;

const drawHearts = (ctx: CanvasRenderingContext2D, hp: number) => {
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE_COLOR;

  for (let index = 0; index < PLAYER_MAX_HP; index += 1) {
    heartPath(ctx, PANEL_X + 24 + index * HEART_SPACING, PANEL_Y + 46, HEART_SIZE);
    ctx.fillStyle = index < hp ? '#ff4d6d' : '#3a3f58';
    ctx.fill();
    ctx.stroke();
  }
};

const drawHotfixChips = (ctx: CanvasRenderingContext2D, hotfixCount: number) => {
  const chipY = PANEL_Y + 62;

  if (hotfixCount === 0) {
    drawText(ctx, '핫픽스 소진', PANEL_X + 14, chipY + HOTFIX_CHIP_HEIGHT / 2, { size: 12, color: '#7f879f' });
    return;
  }

  for (let index = 0; index < hotfixCount; index += 1) {
    const chipX = PANEL_X + 14 + index * (HOTFIX_CHIP_WIDTH + 6);
    roundedRect(ctx, chipX, chipY, HOTFIX_CHIP_WIDTH, HOTFIX_CHIP_HEIGHT, HOTFIX_CHIP_HEIGHT / 2);
    ctx.fillStyle = '#2bd98a';
    ctx.fill();
    drawText(ctx, 'X 핫픽스', chipX + HOTFIX_CHIP_WIDTH / 2, chipY + HOTFIX_CHIP_HEIGHT / 2 + 1, {
      size: 11,
      color: '#0d3a25',
      align: 'center',
    });
  }
};

const drawPlayerPanel = (ctx: CanvasRenderingContext2D, world: World) => {
  roundedRect(ctx, PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, 14);
  ctx.fillStyle = PANEL_COLOR;
  ctx.fill();

  drawText(ctx, PLAYER_NAME, PANEL_X + 14, PANEL_Y + 20, { size: 16 });
  drawHearts(ctx, world.player.hp);
  drawHotfixChips(ctx, world.player.hotfixCount);
};

const drawStageLabel = (ctx: CanvasRenderingContext2D, world: World) => {
  const label = `STAGE ${world.stageIndex + 1} · ${world.stage.name}`;
  ctx.font = `14px ${FONT_FAMILY}`;
  const width = ctx.measureText(label).width + 28;

  roundedRect(ctx, VIEW_WIDTH - PANEL_X - width, PANEL_Y, width, 28, 14);
  ctx.fillStyle = PANEL_COLOR;
  ctx.fill();
  drawText(ctx, label, VIEW_WIDTH - PANEL_X - width / 2, PANEL_Y + 15, { size: 14, align: 'center' });
};

const drawBossBar = (ctx: CanvasRenderingContext2D, world: World) => {
  const { boss } = world;
  if (!boss) return;

  const barX = (VIEW_WIDTH - BOSS_BAR_WIDTH) / 2;
  const hpRatio = boss.hp / boss.maxHp;
  const fill = ctx.createLinearGradient(barX, 0, barX + BOSS_BAR_WIDTH, 0);
  fill.addColorStop(0, '#ff3b4e');
  fill.addColorStop(1, isInSecondPhase(boss) ? '#ff3b4e' : '#ffb347');

  drawText(ctx, `${boss.name} ${boss.title}`, VIEW_WIDTH / 2, BOSS_BAR_Y - 16, {
    size: 17,
    align: 'center',
    outline: '#17131f',
  });

  roundedRect(ctx, barX - 4, BOSS_BAR_Y - 4, BOSS_BAR_WIDTH + 8, BOSS_BAR_HEIGHT + 8, 12);
  ctx.fillStyle = 'rgba(14, 12, 26, 0.85)';
  ctx.fill();

  if (hpRatio > 0) {
    roundedRect(ctx, barX, BOSS_BAR_Y, BOSS_BAR_WIDTH * hpRatio, BOSS_BAR_HEIGHT, 8);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(barX + 6, BOSS_BAR_Y + 3, Math.max(0, BOSS_BAR_WIDTH * hpRatio - 12), 3);
  }

  // 2페이즈 진입 지점 표시
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(barX + BOSS_BAR_WIDTH * SECOND_PHASE_MARK_RATIO - 1, BOSS_BAR_Y - 2, 2, BOSS_BAR_HEIGHT + 4);
};

const drawPersuadedNotice = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = 'rgba(255, 120, 180, 0.16)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  drawText(ctx, '설득당하는 중… 좌우 조작 반전!', VIEW_WIDTH / 2, 124, {
    size: 22,
    color: '#ffd0e4',
    align: 'center',
    outline: '#6a2148',
  });
};

export const drawHud = (ctx: CanvasRenderingContext2D, world: World) => {
  drawPlayerPanel(ctx, world);
  drawStageLabel(ctx, world);
  drawBossBar(ctx, world);
  if (world.player.persuadedTimer > 0) drawPersuadedNotice(ctx);
};
