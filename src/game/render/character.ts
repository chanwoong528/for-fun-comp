import type { Direction, Point, Rect } from '../types';
import { drawGlow, ellipse, fillAndStroke, OUTLINE_COLOR, roundedRect } from './shapes';

export type HairStyle = 'short' | 'parted' | 'slick' | 'thin';
export type Expression = 'determined' | 'smile' | 'stern' | 'frown';
export type Outfit = 'hoodie' | 'knit' | 'suit';
export type ArmPose = 'rest' | 'aimForward' | 'aimUp' | 'gesture' | 'phone';

export type PersonLook = {
  skin: string;
  hair: string;
  top: string;
  topShade: string;
  bottom: string;
  shoe: string;
  tie: string | null;
  hasGlasses: boolean;
  hasLanyard: boolean;
  hairStyle: HairStyle;
  expression: Expression;
  outfit: Outfit;
};

type PersonPose = Rect & {
  facing: Direction;
  walkPhase: number;
  look: PersonLook;
  isFlashing: boolean;
  time: number;
  isWalking?: boolean;
  isAirborne?: boolean;
  arm?: ArmPose;
  // 0~1, 총구 섬광 세기
  muzzleFlash?: number;
};

// 캐릭터는 "발끝이 원점, 키 100, 오른쪽을 바라보는" 설계 좌표계에서 그린 뒤 크기와 방향을 맞춘다
const DESIGN_HEIGHT = 100;
const OUTLINE_WIDTH = 2.4;
const FLASH_COLOR = '#ffffff';

const HEAD_X = 2;
const HEAD_Y = -74;
const HEAD_RADIUS_X = 25;
const HEAD_RADIUS_Y = 23;
const EYE_Y = -73.5;
const EYE_XS = [5, 17] as const;

const HIP_Y = -26;
const SHOULDER_Y = -47;
const LEG_WIDTH = 9;
const ARM_WIDTH = 7;
const STRIDE = 11;
const STEP_LIFT = 6;

const BLINK_PERIOD_SECONDS = 3.2;
const BLINK_SECONDS = 0.12;
const MUZZLE_FLASH_THRESHOLD = 0.45;

type Limbs = { back: Point; front: Point };

const useOutline = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = OUTLINE_WIDTH;
};

const drawLimb = (ctx: CanvasRenderingContext2D, from: Point, to: Point, width: number, color: string) => {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = width + OUTLINE_WIDTH * 2;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  useOutline(ctx);
};

const getFeet = (isWalking: boolean, isAirborne: boolean, walkPhase: number): Limbs => {
  if (isAirborne) return { back: { x: -12, y: -9 }, front: { x: 9, y: -4 } };
  if (!isWalking) return { back: { x: -7, y: 0 }, front: { x: 7, y: 0 } };

  const swing = Math.sin(walkPhase) * STRIDE;
  const lift = Math.cos(walkPhase) * STEP_LIFT;
  return {
    back: { x: -4 - swing, y: -Math.max(0, lift) },
    front: { x: 4 + swing, y: -Math.max(0, -lift) },
  };
};

const getHands = (arm: ArmPose, isWalking: boolean, walkPhase: number): Limbs => {
  switch (arm) {
    case 'aimForward':
      return { back: { x: 19, y: -39 }, front: { x: 25, y: -40 } };
    case 'aimUp':
      return { back: { x: 7, y: -62 }, front: { x: 12, y: -66 } };
    case 'gesture':
      return { back: { x: -14, y: -28 }, front: { x: 27, y: -53 } };
    case 'phone':
      return { back: { x: -14, y: -28 }, front: { x: 21, y: -50 } };
    case 'rest': {
      const swing = isWalking ? Math.sin(walkPhase) * 8 : 0;
      return { back: { x: -13 + swing, y: -27 }, front: { x: 13 - swing, y: -27 } };
    }
  }
};

const drawLeg = (ctx: CanvasRenderingContext2D, hipX: number, foot: Point, look: PersonLook, paint: (color: string) => string) => {
  drawLimb(ctx, { x: hipX, y: HIP_Y }, { x: foot.x, y: foot.y - 6 }, LEG_WIDTH, paint(look.bottom));
  ellipse(ctx, foot.x + 3, foot.y - 3.5, 7.5, 4);
  fillAndStroke(ctx, paint(look.shoe));
};

const drawArm = (ctx: CanvasRenderingContext2D, shoulderX: number, hand: Point, look: PersonLook, paint: (color: string) => string) => {
  drawLimb(ctx, { x: shoulderX, y: SHOULDER_Y }, hand, ARM_WIDTH, paint(look.top));
  ellipse(ctx, hand.x, hand.y, 4.2, 4.2);
  fillAndStroke(ctx, paint(look.skin));
};

const drawOutfitDetails = (ctx: CanvasRenderingContext2D, look: PersonLook) => {
  ctx.lineWidth = 1.6;

  if (look.outfit === 'hoodie') {
    // 후드 끈과 앞주머니
    ctx.beginPath();
    ctx.moveTo(-1, -53);
    ctx.lineTo(-1, -44);
    ctx.moveTo(5, -53);
    ctx.lineTo(5, -44);
    ctx.moveTo(-8, -30);
    ctx.quadraticCurveTo(2, -37, 12, -30);
    ctx.stroke();
  }

  if (look.outfit === 'knit') {
    // 셔츠 깃
    ctx.beginPath();
    ctx.moveTo(-4, -54);
    ctx.lineTo(2, -47);
    ctx.lineTo(8, -54);
    ctx.closePath();
    fillAndStroke(ctx, '#f6f6f6');
  }

  if (look.outfit === 'suit') {
    // 셔츠, 넥타이, 라펠
    ctx.beginPath();
    ctx.moveTo(-5, -54);
    ctx.lineTo(9, -54);
    ctx.lineTo(2, -35);
    ctx.closePath();
    fillAndStroke(ctx, '#f6f6f6');

    if (look.tie) {
      ctx.beginPath();
      ctx.moveTo(2, -54);
      ctx.lineTo(4.6, -50);
      ctx.lineTo(3.6, -40);
      ctx.lineTo(2, -37);
      ctx.lineTo(0.4, -40);
      ctx.lineTo(-0.6, -50);
      ctx.closePath();
      fillAndStroke(ctx, look.tie);
    }

    ellipse(ctx, 2, -29, 1.2, 1.2);
    ctx.fillStyle = OUTLINE_COLOR;
    ctx.fill();
  }

  if (look.hasLanyard) {
    // 사원증
    ctx.strokeStyle = '#e5484d';
    ctx.beginPath();
    ctx.moveTo(-6, -54);
    ctx.lineTo(-4, -40);
    ctx.stroke();
    useOutline(ctx);
    ctx.lineWidth = 1.4;
    roundedRect(ctx, -8.5, -41, 9, 11, 1.5);
    fillAndStroke(ctx, '#ffffff');
    ctx.fillStyle = '#4c8dff';
    ctx.fillRect(-7, -39.5, 6, 3);
  }

  useOutline(ctx);
};

const drawFace = (ctx: CanvasRenderingContext2D, look: PersonLook, time: number) => {
  const isSmiling = look.expression === 'smile';
  const isBlinking = time % BLINK_PERIOD_SECONDS < BLINK_SECONDS;

  // 볼터치
  ctx.fillStyle = isSmiling ? 'rgba(255, 120, 130, 0.5)' : 'rgba(255, 120, 130, 0.28)';
  ellipse(ctx, 20, -66, 4, 2.4);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.fillStyle = OUTLINE_COLOR;
  EYE_XS.forEach((eyeX) => {
    if (isSmiling) {
      ctx.beginPath();
      ctx.arc(eyeX, EYE_Y + 1.5, 3, Math.PI, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (isBlinking) {
      ctx.beginPath();
      ctx.moveTo(eyeX - 2.6, EYE_Y);
      ctx.lineTo(eyeX + 2.6, EYE_Y);
      ctx.stroke();
      return;
    }

    ellipse(ctx, eyeX, EYE_Y, 2.5, 3.5);
    ctx.fillStyle = OUTLINE_COLOR;
    ctx.fill();
    ellipse(ctx, eyeX + 0.8, EYE_Y - 1.3, 0.9, 0.9);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });

  // 눈썹과 입으로 표정을 만든다
  ctx.beginPath();
  switch (look.expression) {
    case 'determined':
      ctx.moveTo(0.5, -82);
      ctx.lineTo(8, -79.5);
      ctx.moveTo(14, -79.5);
      ctx.lineTo(21.5, -82);
      ctx.moveTo(9, -63);
      ctx.lineTo(14, -63.6);
      break;
    case 'smile':
      ctx.moveTo(1, -80);
      ctx.quadraticCurveTo(5, -82.5, 9, -80);
      ctx.moveTo(13, -80);
      ctx.quadraticCurveTo(17, -82.5, 21, -80);
      ctx.moveTo(15.5, -65.5);
      ctx.arc(11, -65.5, 4.5, 0, Math.PI);
      break;
    case 'stern':
      ctx.moveTo(0.5, -81);
      ctx.lineTo(9, -81);
      ctx.moveTo(13, -81);
      ctx.lineTo(21.5, -81);
      ctx.moveTo(7.5, -62.5);
      ctx.lineTo(15, -62.5);
      break;
    case 'frown':
      ctx.moveTo(0, -83);
      ctx.lineTo(8.5, -79);
      ctx.moveTo(13.5, -79);
      ctx.lineTo(22, -83);
      ctx.moveTo(15.5, -60.5);
      ctx.arc(11.5, -60.5, 4, 0, Math.PI, true);
      break;
  }
  ctx.stroke();

  if (look.hasGlasses) {
    ctx.lineWidth = 1.8;
    EYE_XS.forEach((eyeX) => {
      roundedRect(ctx, eyeX - 5.6, EYE_Y - 5.2, 11.2, 10.4, 3.2);
      fillAndStroke(ctx, 'rgba(255, 255, 255, 0.28)');
    });
    ctx.beginPath();
    ctx.moveTo(EYE_XS[0] - 5.6, EYE_Y - 1);
    ctx.lineTo(-19, EYE_Y - 2);
    ctx.stroke();
  }

  useOutline(ctx);
};

const HAIR_FRINGE: Record<Exclude<HairStyle, 'thin'>, Array<[number, number]>> = {
  short: [[23, -80], [17, -73], [10, -81], [3, -74], [-5, -81], [-13, -75], [-19, -70], [-25, -64]],
  parted: [[24, -79], [14, -87], [0, -85], [-8, -78], [-18, -72], [-25, -66]],
  slick: [[25, -83], [10, -91], [-6, -89], [-20, -77], [-25, -68]],
};

const drawHair = (ctx: CanvasRenderingContext2D, look: PersonLook, paint: (color: string) => string) => {
  ctx.beginPath();

  if (look.hairStyle === 'thin') {
    // 숱이 적은 머리: 뒤통수와 옆머리만 남긴다
    ctx.ellipse(HEAD_X, HEAD_Y, 26, 24.5, 0, Math.PI * 0.95, Math.PI * 1.6);
    ctx.lineTo(4, -90);
    ctx.lineTo(-10, -86);
    ctx.lineTo(-20, -76);
    ctx.lineTo(-22, -68);
  } else {
    ctx.ellipse(HEAD_X, HEAD_Y - 1, 26.5, 25, 0, Math.PI, Math.PI * 2);
    HAIR_FRINGE[look.hairStyle].forEach(([x, y]) => ctx.lineTo(x, y));
  }

  ctx.closePath();
  fillAndStroke(ctx, paint(look.hair));

  if (look.hairStyle !== 'slick') return;

  // 포마드 광택
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, -93);
  ctx.quadraticCurveTo(4, -99, 16, -94);
  ctx.stroke();
  useOutline(ctx);
};

const drawKeyboardBlaster = (ctx: CanvasRenderingContext2D, hand: Point, isAimingUp: boolean, flash: number) => {
  ctx.save();
  ctx.translate(hand.x, hand.y);
  if (isAimingUp) ctx.rotate(-Math.PI / 2);

  roundedRect(ctx, -6, -6, 32, 11, 3);
  fillAndStroke(ctx, '#dfe4ee');
  ctx.fillStyle = '#5a6278';
  [-2, 3, 8, 13, 18].forEach((keyX) => ctx.fillRect(keyX, -3.5, 3.2, 2.6));
  ctx.fillRect(-2, 0.5, 18, 2);
  roundedRect(ctx, 24, -4.5, 6, 8, 2);
  fillAndStroke(ctx, '#57e0ff');

  if (flash > MUZZLE_FLASH_THRESHOLD) {
    drawGlow(ctx, 36, -0.5, 22 * flash, '255, 232, 120', 0.95);
    ellipse(ctx, 35, -0.5, 7 * flash, 4.5 * flash);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  ctx.restore();
};

const drawPhone = (ctx: CanvasRenderingContext2D, hand: Point) => {
  roundedRect(ctx, hand.x - 1, hand.y - 12, 8, 14, 2);
  fillAndStroke(ctx, '#2a2f45');
  ctx.fillStyle = '#9ff0ff';
  ctx.fillRect(hand.x + 0.6, hand.y - 10.2, 4.8, 9);
};

export const drawPerson = (ctx: CanvasRenderingContext2D, pose: PersonPose) => {
  const { x, y, w, h, facing, walkPhase, look, isFlashing, time } = pose;
  const { isWalking = false, isAirborne = false, arm = 'rest', muzzleFlash = 0 } = pose;
  const paint = (color: string) => (isFlashing ? FLASH_COLOR : color);
  const scale = h / DESIGN_HEIGHT;

  ctx.save();
  ctx.translate(x + w / 2, y + h);

  if (!isAirborne) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ellipse(ctx, 0, 0, 22 * scale, 5 * scale);
    ctx.fill();
  }

  ctx.scale(facing * scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  useOutline(ctx);

  const feet = getFeet(isWalking, isAirborne, walkPhase);
  const hands = getHands(arm, isWalking, walkPhase);
  // 걸을 때는 통통 튀고, 서 있을 때는 숨 쉬듯 살짝 움직인다
  const bodyBob = isWalking ? -Math.abs(Math.sin(walkPhase)) * 1.8 : Math.sin(time * 2.6) * 0.7;

  drawLeg(ctx, -6, feet.back, look, paint);
  drawLeg(ctx, 6, feet.front, look, paint);

  ctx.translate(0, bodyBob);
  drawArm(ctx, -10, hands.back, look, paint);

  // 목과 몸통
  ctx.fillStyle = paint(look.skin);
  ctx.fillRect(-4, -58, 9, 6);
  if (look.outfit === 'hoodie') {
    ellipse(ctx, -5, -55, 13, 6.5);
    fillAndStroke(ctx, paint(look.topShade));
  }
  roundedRect(ctx, -15, -54, 31, 32, 8);
  ctx.fillStyle = paint(look.top);
  ctx.fill();
  ctx.fillStyle = paint(look.topShade);
  ctx.beginPath();
  ctx.roundRect(-15, -54, 10, 32, [8, 0, 0, 8]);
  ctx.fill();
  roundedRect(ctx, -15, -54, 31, 32, 8);
  ctx.stroke();
  if (!isFlashing) drawOutfitDetails(ctx, look);

  // 머리
  ellipse(ctx, HEAD_X, HEAD_Y, HEAD_RADIUS_X, HEAD_RADIUS_Y);
  fillAndStroke(ctx, paint(look.skin));
  if (!isFlashing) drawFace(ctx, look, time);
  drawHair(ctx, look, paint);

  drawArm(ctx, 10, hands.front, look, paint);
  if (arm === 'aimForward' || arm === 'aimUp') drawKeyboardBlaster(ctx, hands.front, arm === 'aimUp', muzzleFlash);
  if (arm === 'phone') drawPhone(ctx, hands.front);

  ctx.restore();
};
