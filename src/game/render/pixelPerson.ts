import type { Direction, Rect } from '../types';

export type PersonLook = {
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  tie: string | null;
  hasGlasses: boolean;
};

type PersonPose = Rect & {
  facing: Direction;
  walkPhase: number;
  look: PersonLook;
  isFlashing: boolean;
};

const FLASH_COLOR = '#ffffff';
const HEAD_HEIGHT_RATIO = 0.3;
const BODY_HEIGHT_RATIO = 0.4;
const HEAD_WIDTH_RATIO = 0.72;
const LEG_WIDTH_RATIO = 0.3;
const STRIDE_RATIO = 0.25;

export const drawPerson = (ctx: CanvasRenderingContext2D, pose: PersonPose) => {
  const { x, y, w, h, facing, walkPhase, look, isFlashing } = pose;
  const paint = (color: string) => (isFlashing ? FLASH_COLOR : color);

  const headHeight = h * HEAD_HEIGHT_RATIO;
  const headWidth = w * HEAD_WIDTH_RATIO;
  const headX = x + (w - headWidth) / 2;
  const bodyY = y + headHeight;
  const bodyHeight = h * BODY_HEIGHT_RATIO;
  const legY = bodyY + bodyHeight;
  const legHeight = h - headHeight - bodyHeight;
  const legWidth = w * LEG_WIDTH_RATIO;
  const stride = Math.sin(walkPhase) * legHeight * STRIDE_RATIO;

  // 다리: 걸을 때 번갈아 들어 올린다
  ctx.fillStyle = paint(look.bottom);
  ctx.fillRect(x + w * 0.15, legY, legWidth, legHeight - Math.max(0, stride));
  ctx.fillRect(x + w * 0.55, legY, legWidth, legHeight - Math.max(0, -stride));

  // 몸통
  ctx.fillStyle = paint(look.top);
  ctx.fillRect(x, bodyY, w, bodyHeight);

  if (look.tie) {
    ctx.fillStyle = paint('#f4f4f4');
    ctx.fillRect(x + w * 0.36, bodyY, w * 0.28, bodyHeight * 0.75);
    ctx.fillStyle = paint(look.tie);
    ctx.fillRect(x + w * 0.45, bodyY, w * 0.1, bodyHeight * 0.65);
  }

  // 머리와 머리카락
  ctx.fillStyle = paint(look.skin);
  ctx.fillRect(headX, y, headWidth, headHeight);
  ctx.fillStyle = paint(look.hair);
  ctx.fillRect(headX, y, headWidth, headHeight * 0.32);
  const backHairX = facing === 1 ? headX : headX + headWidth * 0.82;
  ctx.fillRect(backHairX, y, headWidth * 0.18, headHeight * 0.7);

  // 눈 (바라보는 방향으로 치우친다)
  const eyeSize = Math.max(2, w * 0.09);
  const eyeY = y + headHeight * 0.5;
  const eyeCenterX = headX + headWidth / 2 + facing * headWidth * 0.14;
  const eyeGap = headWidth * 0.2;
  ctx.fillStyle = paint('#1b1b1b');
  ctx.fillRect(eyeCenterX - eyeGap - eyeSize / 2, eyeY, eyeSize, eyeSize);
  ctx.fillRect(eyeCenterX + eyeGap - eyeSize / 2, eyeY, eyeSize, eyeSize);

  if (!look.hasGlasses) return;

  const lensSize = eyeSize * 2.2;
  const lensY = eyeY - (lensSize - eyeSize) / 2;
  ctx.strokeStyle = paint('#1b1b1b');
  ctx.lineWidth = 1.5;
  ctx.strokeRect(eyeCenterX - eyeGap - lensSize / 2, lensY, lensSize, lensSize);
  ctx.strokeRect(eyeCenterX + eyeGap - lensSize / 2, lensY, lensSize, lensSize);
};
