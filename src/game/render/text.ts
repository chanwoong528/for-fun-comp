export const FONT_FAMILY = "'Jua', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif";
export const TITLE_FONT_FAMILY = `'Black Han Sans', ${FONT_FAMILY}`;

type TextOptions = {
  size?: number;
  color?: string | CanvasGradient;
  align?: CanvasTextAlign;
  outline?: string;
  family?: string;
};

export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  { size = 16, color = '#ffffff', align = 'left', outline, family = FONT_FAMILY }: TextOptions = {},
) => {
  ctx.font = `${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  if (outline) {
    ctx.lineWidth = Math.max(3, size / 4);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = outline;
    ctx.strokeText(text, x, y);
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
};

const NAME_TAG_SIZE = 13;
const NAME_TAG_HEIGHT = 20;
const NAME_TAG_PADDING = 9;

export const drawNameTag = (ctx: CanvasRenderingContext2D, text: string, centerX: number, centerY: number) => {
  ctx.font = `${NAME_TAG_SIZE}px ${FONT_FAMILY}`;
  const width = ctx.measureText(text).width + NAME_TAG_PADDING * 2;

  ctx.fillStyle = 'rgba(14, 12, 26, 0.72)';
  ctx.beginPath();
  ctx.roundRect(centerX - width / 2, centerY - NAME_TAG_HEIGHT / 2, width, NAME_TAG_HEIGHT, NAME_TAG_HEIGHT / 2);
  ctx.fill();
  drawText(ctx, text, centerX, centerY + 1, { size: NAME_TAG_SIZE, align: 'center' });
};

const BUBBLE_SIZE = 15;
const BUBBLE_HEIGHT = 30;
const BUBBLE_PADDING = 13;
const BUBBLE_TAIL = 8;

type BubbleColors = { fill: string; text: string; border: string };

const DEFAULT_BUBBLE_COLORS: BubbleColors = { fill: '#ffffff', text: '#2a2238', border: '#2a2238' };

// 꼬리 끝이 (centerX, tipY) 를 가리키는 말풍선
export const drawSpeechBubble = (
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  tipY: number,
  colors: BubbleColors = DEFAULT_BUBBLE_COLORS,
) => {
  ctx.font = `${BUBBLE_SIZE}px ${FONT_FAMILY}`;
  const width = ctx.measureText(text).width + BUBBLE_PADDING * 2;
  const bottom = tipY - BUBBLE_TAIL;
  const top = bottom - BUBBLE_HEIGHT;

  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = colors.border;
  ctx.fillStyle = colors.fill;

  ctx.beginPath();
  ctx.roundRect(centerX - width / 2, top, width, BUBBLE_HEIGHT, BUBBLE_HEIGHT / 2);
  ctx.fill();
  ctx.stroke();

  // 꼬리: 몸통 테두리를 덮도록 채운 뒤 양쪽 변만 선을 긋는다
  ctx.beginPath();
  ctx.moveTo(centerX - 7, bottom - 1.5);
  ctx.lineTo(centerX, tipY);
  ctx.lineTo(centerX + 7, bottom - 1.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(centerX - 7, bottom);
  ctx.lineTo(centerX, tipY);
  ctx.lineTo(centerX + 7, bottom);
  ctx.stroke();

  drawText(ctx, text, centerX, top + BUBBLE_HEIGHT / 2 + 1, { size: BUBBLE_SIZE, color: colors.text, align: 'center' });
};
