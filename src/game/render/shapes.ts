export const OUTLINE_COLOR = '#1b1726';

type Fill = string | CanvasGradient;

export const fillAndStroke = (ctx: CanvasRenderingContext2D, fill: Fill) => {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();
};

export const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
};

export const ellipse = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) => {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
};

export const heartPath = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.9);
  ctx.bezierCurveTo(cx - size * 1.4, cy - size * 0.1, cx - size * 0.7, cy - size * 1.1, cx, cy - size * 0.35);
  ctx.bezierCurveTo(cx + size * 0.7, cy - size * 1.1, cx + size * 1.4, cy - size * 0.1, cx, cy + size * 0.9);
  ctx.closePath();
};

export const verticalGradient = (
  ctx: CanvasRenderingContext2D,
  topY: number,
  bottomY: number,
  topColor: string,
  bottomColor: string,
) => {
  const gradient = ctx.createLinearGradient(0, topY, 0, bottomY);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  return gradient;
};

// rgb 는 '255, 220, 100' 형태. 중심에서 바깥으로 투명해지는 빛 번짐을 그린다.
export const drawGlow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rgb: string,
  alpha: number,
) => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${rgb}, ${alpha})`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
};

// 같은 seed 에는 항상 같은 0~1 값을 돌려준다 (배경 건물 높이처럼 프레임마다 흔들리면 안 되는 값에 쓴다)
export const pseudoRandom = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};
