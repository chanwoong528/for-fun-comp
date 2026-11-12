import { VIEW_HEIGHT, VIEW_WIDTH } from '../constants';
import { DIVISION_HEAD_LOOK } from '../domains/bosses/divisionHeadBoss';
import { EXECUTIVE_LOOK } from '../domains/bosses/executiveBoss';
import { TEAM_LEAD_LOOK } from '../domains/bosses/teamLeadBoss';
import { PLAYER_LOOK, PLAYER_NAME } from '../domains/player/player';
import type { World } from '../world';
import { drawPerson, type ArmPose, type PersonLook } from './character';
import { drawGlow, pseudoRandom, roundedRect, verticalGradient } from './shapes';
import { drawNameTag, drawText, FONT_FAMILY, TITLE_FONT_FAMILY } from './text';

const CENTER_X = VIEW_WIDTH / 2;

const CAST: Array<{ label: string; look: PersonLook; arm: ArmPose }> = [
  { label: PLAYER_NAME, look: PLAYER_LOOK, arm: 'throwForward' },
  { label: '우종석 팀장', look: TEAM_LEAD_LOOK, arm: 'gesture' },
  { label: '임태희 부문장', look: DIVISION_HEAD_LOOK, arm: 'phone' },
  { label: '곽동훈 전무', look: EXECUTIVE_LOOK, arm: 'rest' },
];
const CAST_SPACING = 180;
const CAST_WIDTH = 60;
const CAST_HEIGHT = 108;
const ROOFTOP_Y = 372;

const SKYLINE_BUILDING_WIDTH = 46;
const SKYLINE_MIN_HEIGHT = 60;
const SKYLINE_HEIGHT_RANGE = 150;

const KEY_HINTS: Array<[string, string]> = [
  ['←→', '이동'],
  ['↑', '위로 조준'],
  ['Space', '점프'],
  ['Z', '키캡 던지기'],
  ['X', '핫픽스 배포'],
];
const KEY_HINT_SIZE = 15;
const KEY_CAP_PADDING = 9;
const KEY_CAP_HEIGHT = 24;
const KEY_LABEL_GAP = 7;
const KEY_HINT_GAP = 22;

// 대화창은 바닥에 선 캐릭터를 가리지 않도록 화면 가운데 위쪽에 둔다
const DIALOG_Y = 214;
const DIALOG_HEIGHT = 100;
const DIALOG_MARGIN = 40;
const PORTRAIT_SIZE = 76;
const PORTRAIT_INSET = 12;

const WARNING_BAND_Y = 96;
const WARNING_BAND_HEIGHT = 80;
const STAMP_Y = 134;

const HAZARD_BAND_HEIGHT = 20;
const HAZARD_STRIPE_WIDTH = 28;
const HAZARD_SCROLL_SPEED = 60;

const drawDim = (ctx: CanvasRenderingContext2D, alpha: number) => {
  ctx.fillStyle = `rgba(10, 9, 20, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
};

// 퇴근 시간의 노을 진 도시
const drawSunsetCity = (ctx: CanvasRenderingContext2D) => {
  const sky = ctx.createLinearGradient(0, 0, 0, ROOFTOP_Y);
  sky.addColorStop(0, '#1c2550');
  sky.addColorStop(0.55, '#8a4b7c');
  sky.addColorStop(1, '#ffa45c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  drawGlow(ctx, CENTER_X, ROOFTOP_Y - 20, 330, '255, 214, 130', 0.75);
  ctx.fillStyle = '#fff0b8';
  ctx.beginPath();
  ctx.arc(CENTER_X, ROOFTOP_Y - 10, 62, 0, Math.PI * 2);
  ctx.fill();

  for (let building = 0; building * SKYLINE_BUILDING_WIDTH < VIEW_WIDTH; building += 1) {
    const height = SKYLINE_MIN_HEIGHT + pseudoRandom(building + 3) * SKYLINE_HEIGHT_RANGE;
    const buildingX = building * SKYLINE_BUILDING_WIDTH;
    const buildingTop = ROOFTOP_Y - height;

    ctx.fillStyle = '#2a2147';
    ctx.fillRect(buildingX, buildingTop, SKYLINE_BUILDING_WIDTH - 3, height);
    ctx.fillStyle = '#ffd98a';
    for (let row = 0; row < Math.floor(height / 16) - 1; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const isLit = pseudoRandom(building * 19 + row * 5 + column) > 0.55;
        if (isLit) ctx.fillRect(buildingX + 7 + column * 12, buildingTop + 10 + row * 16, 6, 8);
      }
    }
  }

  ctx.fillStyle = verticalGradient(ctx, ROOFTOP_Y, VIEW_HEIGHT, '#1a1630', '#0e0c1c');
  ctx.fillRect(0, ROOFTOP_Y, VIEW_WIDTH, VIEW_HEIGHT - ROOFTOP_Y);
  ctx.fillStyle = 'rgba(255, 190, 120, 0.5)';
  ctx.fillRect(0, ROOFTOP_Y, VIEW_WIDTH, 2);
};

const drawLogo = (ctx: CanvasRenderingContext2D, text: string, y: number) => {
  const fill = verticalGradient(ctx, y - 44, y + 40, '#fff3a8', '#ff9d2e');
  drawText(ctx, text, CENTER_X + 4, y + 6, { size: 92, color: '#170f2a', align: 'center', family: TITLE_FONT_FAMILY });
  drawText(ctx, text, CENTER_X, y, {
    size: 92,
    color: fill,
    align: 'center',
    outline: '#3a1a4a',
    family: TITLE_FONT_FAMILY,
  });
};

const drawCast = (ctx: CanvasRenderingContext2D, time: number) => {
  const firstX = CENTER_X - ((CAST.length - 1) * CAST_SPACING) / 2;

  CAST.forEach(({ label, look, arm }, index) => {
    const centerX = firstX + index * CAST_SPACING;
    drawPerson(ctx, {
      x: centerX - CAST_WIDTH / 2,
      y: ROOFTOP_Y - CAST_HEIGHT,
      w: CAST_WIDTH,
      h: CAST_HEIGHT,
      facing: index === 0 ? 1 : -1,
      walkPhase: 0,
      look,
      isFlashing: false,
      time: time + index * 0.7,
      arm,
    });
    drawNameTag(ctx, label, centerX, ROOFTOP_Y + 20);
  });
};

const drawKeyHints = (ctx: CanvasRenderingContext2D, y: number) => {
  ctx.font = `${KEY_HINT_SIZE}px ${FONT_FAMILY}`;
  const widths = KEY_HINTS.map(([key, label]) => ({
    cap: ctx.measureText(key).width + KEY_CAP_PADDING * 2,
    label: ctx.measureText(label).width,
  }));
  const totalWidth =
    widths.reduce((sum, width) => sum + width.cap + KEY_LABEL_GAP + width.label, 0) +
    KEY_HINT_GAP * (KEY_HINTS.length - 1);

  let cursorX = CENTER_X - totalWidth / 2;
  KEY_HINTS.forEach(([key, label], index) => {
    const { cap, label: labelWidth } = widths[index];

    roundedRect(ctx, cursorX, y - KEY_CAP_HEIGHT / 2, cap, KEY_CAP_HEIGHT, 6);
    ctx.fillStyle = '#f1edf9';
    ctx.fill();
    ctx.fillStyle = '#b9b0d0';
    ctx.fillRect(cursorX + 3, y + KEY_CAP_HEIGHT / 2 - 4, cap - 6, 2);
    drawText(ctx, key, cursorX + cap / 2, y, { size: KEY_HINT_SIZE, color: '#2a2238', align: 'center' });
    drawText(ctx, label, cursorX + cap + KEY_LABEL_GAP, y + 1, { size: KEY_HINT_SIZE, color: '#d9d2ee' });

    cursorX += cap + KEY_LABEL_GAP + labelWidth + KEY_HINT_GAP;
  });
};

const drawBlinkingPrompt = (ctx: CanvasRenderingContext2D, text: string, y: number, time: number) => {
  ctx.globalAlpha = 0.55 + Math.sin(time * 5) * 0.45;
  drawText(ctx, text, CENTER_X, y, { size: 24, color: '#7dffb0', align: 'center', outline: '#0d3a25' });
  ctx.globalAlpha = 1;
};

export const drawTitleScreen = (ctx: CanvasRenderingContext2D, time: number) => {
  drawSunsetCity(ctx);
  drawLogo(ctx, '칼퇴 작전', 92);
  drawText(ctx, '— 한결일보 편 —', CENTER_X, 162, { size: 22, align: 'center', outline: '#3a1a4a' });
  drawCast(ctx, time);
  drawKeyHints(ctx, 438);
  drawBlinkingPrompt(ctx, 'Enter 를 눌러 출근하기', 484, time);
  drawText(ctx, '웃자고 만든 픽션입니다 :)', CENTER_X, 520, { size: 12, color: '#8a84a3', align: 'center' });
};

export const drawStageIntro = (ctx: CanvasRenderingContext2D, world: World) => {
  drawDim(ctx, 0.72);

  const label = `STAGE ${world.stageIndex + 1}`;
  roundedRect(ctx, CENTER_X - 62, 186, 124, 32, 16);
  ctx.fillStyle = '#ffd666';
  ctx.fill();
  drawText(ctx, label, CENTER_X, 203, { size: 18, color: '#3a2a00', align: 'center' });
  drawText(ctx, world.stage.name, CENTER_X, 268, {
    size: 60,
    align: 'center',
    outline: '#17131f',
    family: TITLE_FONT_FAMILY,
  });
  drawText(ctx, world.stage.subtitle, CENTER_X, 326, { size: 19, color: '#c9c2e0', align: 'center' });
};

const drawPortrait = (ctx: CanvasRenderingContext2D, look: PersonLook, x: number, y: number, time: number) => {
  ctx.save();
  roundedRect(ctx, x, y, PORTRAIT_SIZE, PORTRAIT_SIZE, 12);
  ctx.fillStyle = '#3a3358';
  ctx.fill();
  ctx.clip();
  // 얼굴이 초상화 칸을 채우도록 크게 그리고 아래는 잘라낸다
  drawPerson(ctx, {
    x: x + PORTRAIT_SIZE / 2 - 50,
    y: y + 3,
    w: 100,
    h: 156,
    facing: 1,
    walkPhase: 0,
    look,
    isFlashing: false,
    time,
  });
  ctx.restore();

  ctx.strokeStyle = '#ffd666';
  ctx.lineWidth = 3;
  roundedRect(ctx, x, y, PORTRAIT_SIZE, PORTRAIT_SIZE, 12);
  ctx.stroke();
};

const drawDialog = (ctx: CanvasRenderingContext2D, world: World, line: string, time: number) => {
  const { boss } = world;
  if (!boss) return;

  const dialogY = DIALOG_Y;
  const textX = DIALOG_MARGIN + PORTRAIT_SIZE + 34;

  roundedRect(ctx, DIALOG_MARGIN, dialogY, VIEW_WIDTH - DIALOG_MARGIN * 2, DIALOG_HEIGHT, 16);
  ctx.fillStyle = 'rgba(14, 12, 26, 0.92)';
  ctx.fill();
  ctx.strokeStyle = '#ffd666';
  ctx.lineWidth = 3;
  ctx.stroke();

  drawPortrait(ctx, boss.look, DIALOG_MARGIN + PORTRAIT_INSET, dialogY + PORTRAIT_INSET, time);
  drawText(ctx, `${boss.name} ${boss.title}`, textX, dialogY + 30, { size: 18, color: '#ffd666' });
  drawText(ctx, line, textX, dialogY + 66, { size: 21 });
};

const drawHazardBand = (ctx: CanvasRenderingContext2D, y: number, time: number) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, VIEW_WIDTH, HAZARD_BAND_HEIGHT);
  ctx.clip();
  ctx.fillStyle = '#17131f';
  ctx.fillRect(0, y, VIEW_WIDTH, HAZARD_BAND_HEIGHT);

  ctx.fillStyle = '#ffcf3a';
  const scroll = (time * HAZARD_SCROLL_SPEED) % (HAZARD_STRIPE_WIDTH * 2);
  for (let stripeX = -HAZARD_STRIPE_WIDTH * 2 + scroll; stripeX < VIEW_WIDTH + HAZARD_STRIPE_WIDTH; stripeX += HAZARD_STRIPE_WIDTH * 2) {
    ctx.beginPath();
    ctx.moveTo(stripeX, y + HAZARD_BAND_HEIGHT);
    ctx.lineTo(stripeX + HAZARD_STRIPE_WIDTH, y + HAZARD_BAND_HEIGHT);
    ctx.lineTo(stripeX + HAZARD_STRIPE_WIDTH * 1.7, y);
    ctx.lineTo(stripeX + HAZARD_STRIPE_WIDTH * 0.7, y);
    ctx.fill();
  }
  ctx.restore();
};

export const drawBossIntro = (ctx: CanvasRenderingContext2D, world: World, time: number) => {
  drawDim(ctx, 0.35);
  ctx.fillStyle = 'rgba(120, 10, 24, 0.55)';
  ctx.fillRect(0, WARNING_BAND_Y, VIEW_WIDTH, WARNING_BAND_HEIGHT);
  drawHazardBand(ctx, WARNING_BAND_Y - HAZARD_BAND_HEIGHT, time);
  drawHazardBand(ctx, WARNING_BAND_Y + WARNING_BAND_HEIGHT, time);

  ctx.globalAlpha = 0.7 + Math.sin(time * 9) * 0.3;
  drawText(ctx, 'WARNING', CENTER_X, WARNING_BAND_Y + WARNING_BAND_HEIGHT / 2 + 4, {
    size: 60,
    color: '#ff5a6e',
    align: 'center',
    outline: '#2a0810',
    family: TITLE_FONT_FAMILY,
  });
  ctx.globalAlpha = 1;

  drawDialog(ctx, world, world.stage.bossIntroLine, time);
};

const drawApprovalStamp = (ctx: CanvasRenderingContext2D, text: string) => {
  ctx.save();
  ctx.translate(CENTER_X, STAMP_Y);
  ctx.rotate(-0.1);
  ctx.strokeStyle = '#ff3b4e';
  ctx.lineWidth = 9;
  roundedRect(ctx, -180, -52, 360, 104, 14);
  ctx.stroke();
  ctx.lineWidth = 3;
  roundedRect(ctx, -168, -40, 336, 80, 8);
  ctx.stroke();
  drawText(ctx, text, 0, 5, { size: 64, color: '#ff3b4e', align: 'center', family: TITLE_FONT_FAMILY });
  ctx.restore();
};

export const drawBossDefeated = (ctx: CanvasRenderingContext2D, world: World, time: number) => {
  drawDim(ctx, 0.3);
  drawApprovalStamp(ctx, world.stage.clearStampText);
  drawDialog(ctx, world, world.stage.bossDefeatLine, time);
};

export const drawGameOver = (ctx: CanvasRenderingContext2D, time: number) => {
  drawDim(ctx, 0.8);
  drawText(ctx, '야근 확정…', CENTER_X, 216, {
    size: 84,
    color: '#ff5a6e',
    align: 'center',
    outline: '#2a0810',
    family: TITLE_FONT_FAMILY,
  });
  drawBlinkingPrompt(ctx, 'Enter 를 눌러 이 스테이지 다시 도전', 316, time);
};

export const drawEnding = (ctx: CanvasRenderingContext2D, time: number) => {
  drawSunsetCity(ctx);
  drawLogo(ctx, '칼퇴 성공!', 92);
  drawText(ctx, '모든 결재가 승인되었습니다. 오늘도 수고하셨습니다.', CENTER_X, 166, {
    size: 20,
    align: 'center',
    outline: '#3a1a4a',
  });
  drawCast(ctx, time);
  drawText(ctx, '출연해 주신 모든 분들께 감사드립니다', CENTER_X, 440, { size: 16, color: '#d9d2ee', align: 'center' });
  drawBlinkingPrompt(ctx, 'Enter 를 눌러 처음으로', 484, time);
};
