import { VIEW_HEIGHT, VIEW_WIDTH } from '../constants';
import { DIVISION_HEAD_LOOK } from '../domains/bosses/divisionHeadBoss';
import { EXECUTIVE_LOOK } from '../domains/bosses/executiveBoss';
import { TEAM_LEAD_LOOK } from '../domains/bosses/teamLeadBoss';
import { PLAYER_LOOK, PLAYER_NAME } from '../domains/player/player';
import type { World } from '../world';
import { drawPerson, type PersonLook } from './pixelPerson';
import { drawNameTag, drawText } from './text';

const CENTER_X = VIEW_WIDTH / 2;
const DIALOG_HEIGHT = 110;
const DIALOG_MARGIN = 40;

const CAST: Array<{ label: string; look: PersonLook }> = [
  { label: PLAYER_NAME, look: PLAYER_LOOK },
  { label: '요쥰씩 팀장', look: TEAM_LEAD_LOOK },
  { label: '으탹히 부문장', look: DIVISION_HEAD_LOOK },
  { label: '궝둉횽 전무', look: EXECUTIVE_LOOK },
];
const CAST_SPACING = 170;
const CAST_WIDTH = 44;
const CAST_HEIGHT = 80;
const CAST_Y = 250;

const drawDim = (ctx: CanvasRenderingContext2D, alpha: number) => {
  ctx.fillStyle = `rgba(8, 10, 20, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
};

const drawCast = (ctx: CanvasRenderingContext2D) => {
  const firstX = CENTER_X - ((CAST.length - 1) * CAST_SPACING) / 2;

  CAST.forEach(({ label, look }, index) => {
    const centerX = firstX + index * CAST_SPACING;
    drawPerson(ctx, {
      x: centerX - CAST_WIDTH / 2,
      y: CAST_Y,
      w: CAST_WIDTH,
      h: CAST_HEIGHT,
      facing: index === 0 ? 1 : -1,
      walkPhase: 0,
      look,
      isFlashing: false,
    });
    drawNameTag(ctx, label, centerX, CAST_Y + CAST_HEIGHT + 18);
  });
};

export const drawTitleScreen = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#141a2e';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  drawText(ctx, '칼퇴 작전', CENTER_X, 110, { size: 64, color: '#ffe066', align: 'center', outline: '#7a4a00' });
  drawText(ctx, '— 한귝일보 편 —', CENTER_X, 170, { size: 22, align: 'center' });
  drawCast(ctx);
  drawText(ctx, '←→ 이동   ↑ 위로 조준   Space 점프   Z 발사   X 핫픽스 배포', CENTER_X, 420, {
    size: 16,
    color: '#b9c2dc',
    align: 'center',
  });
  drawText(ctx, 'Enter 를 눌러 출근하기', CENTER_X, 470, { size: 24, color: '#7dffb0', align: 'center' });
  drawText(ctx, '웃자고 만든 픽션입니다 :)', CENTER_X, 512, { size: 12, color: '#6f7892', align: 'center' });
};

export const drawStageIntro = (ctx: CanvasRenderingContext2D, world: World) => {
  drawDim(ctx, 0.75);
  drawText(ctx, `STAGE ${world.stageIndex + 1}`, CENTER_X, 210, { size: 26, color: '#ffe066', align: 'center' });
  drawText(ctx, world.stage.name, CENTER_X, 265, { size: 48, align: 'center' });
  drawText(ctx, world.stage.subtitle, CENTER_X, 320, { size: 18, color: '#b9c2dc', align: 'center' });
};

const drawDialog = (ctx: CanvasRenderingContext2D, speaker: string, line: string) => {
  const dialogY = VIEW_HEIGHT - DIALOG_HEIGHT - 20;

  ctx.fillStyle = 'rgba(8, 10, 20, 0.88)';
  ctx.fillRect(DIALOG_MARGIN, dialogY, VIEW_WIDTH - DIALOG_MARGIN * 2, DIALOG_HEIGHT);
  ctx.strokeStyle = '#ffe066';
  ctx.lineWidth = 3;
  ctx.strokeRect(DIALOG_MARGIN, dialogY, VIEW_WIDTH - DIALOG_MARGIN * 2, DIALOG_HEIGHT);

  drawText(ctx, speaker, DIALOG_MARGIN + 24, dialogY + 30, { size: 18, color: '#ffe066' });
  drawText(ctx, line, DIALOG_MARGIN + 24, dialogY + 70, { size: 20 });
};

export const drawBossIntro = (ctx: CanvasRenderingContext2D, world: World) => {
  const { boss, stage } = world;
  if (!boss) return;

  drawDim(ctx, 0.3);
  drawText(ctx, 'WARNING', CENTER_X, 170, { size: 54, color: '#ff5a6e', align: 'center', outline: '#3a0a12' });
  drawDialog(ctx, `${boss.name} ${boss.title}`, stage.bossIntroLine);
};

const drawApprovalStamp = (ctx: CanvasRenderingContext2D, text: string) => {
  ctx.save();
  ctx.translate(CENTER_X, 200);
  ctx.rotate(-0.15);
  ctx.strokeStyle = '#ff3b4e';
  ctx.lineWidth = 8;
  ctx.strokeRect(-190, -60, 380, 120);
  drawText(ctx, text, 0, 4, { size: 72, color: '#ff3b4e', align: 'center' });
  ctx.restore();
};

export const drawBossDefeated = (ctx: CanvasRenderingContext2D, world: World) => {
  const { boss, stage } = world;
  if (!boss) return;

  drawDim(ctx, 0.3);
  drawApprovalStamp(ctx, stage.clearStampText);
  drawDialog(ctx, `${boss.name} ${boss.title}`, stage.bossDefeatLine);
};

export const drawGameOver = (ctx: CanvasRenderingContext2D) => {
  drawDim(ctx, 0.8);
  drawText(ctx, '야근 확정…', CENTER_X, 220, { size: 60, color: '#ff5a6e', align: 'center' });
  drawText(ctx, 'Enter 를 눌러 이 스테이지 다시 도전', CENTER_X, 310, { size: 22, color: '#7dffb0', align: 'center' });
};

export const drawEnding = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#1a2b4a';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  drawText(ctx, '칼퇴 성공!', CENTER_X, 110, { size: 64, color: '#ffe066', align: 'center', outline: '#7a4a00' });
  drawText(ctx, '모든 결재가 승인되었습니다. 오늘도 수고하셨습니다.', CENTER_X, 180, { size: 20, align: 'center' });
  drawCast(ctx);
  drawText(ctx, '출연해 주신 모든 분들께 감사드립니다', CENTER_X, 420, { size: 16, color: '#b9c2dc', align: 'center' });
  drawText(ctx, 'Enter 를 눌러 처음으로', CENTER_X, 470, { size: 22, color: '#7dffb0', align: 'center' });
};
