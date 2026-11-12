export const FONT_FAMILY = "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif";

type TextOptions = {
  size?: number;
  color?: string;
  align?: CanvasTextAlign;
  outline?: string;
};

export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  { size = 16, color = '#ffffff', align = 'left', outline }: TextOptions = {},
) => {
  ctx.font = `bold ${size}px ${FONT_FAMILY}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  if (outline) {
    ctx.lineWidth = Math.max(3, size / 5);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = outline;
    ctx.strokeText(text, x, y);
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
};

export const drawNameTag = (ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number) => {
  drawText(ctx, text, centerX, y, { size: 13, align: 'center', outline: '#000000' });
};
