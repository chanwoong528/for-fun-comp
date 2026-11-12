import { GROUND_Y, VIEW_HEIGHT, VIEW_WIDTH } from '../constants';
import type { StageDeco, StageTheme } from '../stages';
import type { World } from '../world';

const DECO_PARALLAX = 0.6;
const DECO_SPACING = 300;
const DECO_Y = 110;
const FLOOR_TILE_WIDTH = 80;

const drawOfficeDeco = (ctx: CanvasRenderingContext2D, x: number) => {
  // 창문
  ctx.fillStyle = '#7fb2e5';
  ctx.fillRect(x, DECO_Y, 150, 110);
  ctx.fillStyle = '#a9cdf0';
  ctx.fillRect(x, DECO_Y, 150, 40);
  ctx.fillStyle = '#1c2436';
  ctx.fillRect(x + 72, DECO_Y, 6, 110);
  ctx.fillRect(x, DECO_Y + 52, 150, 6);

  // 책상과 모니터
  ctx.fillStyle = '#1c2436';
  ctx.fillRect(x + 180, GROUND_Y - 70, 100, 70);
  ctx.fillRect(x + 200, GROUND_Y - 120, 60, 40);
  ctx.fillStyle = '#4fd1a5';
  ctx.fillRect(x + 206, GROUND_Y - 114, 48, 28);
};

const drawMeetingDeco = (ctx: CanvasRenderingContext2D, x: number) => {
  // 화이트보드와 우상향 그래프
  ctx.fillStyle = '#e9edf5';
  ctx.fillRect(x, DECO_Y, 200, 120);
  ctx.strokeStyle = '#e5484d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 20, DECO_Y + 95);
  ctx.lineTo(x + 70, DECO_Y + 70);
  ctx.lineTo(x + 115, DECO_Y + 80);
  ctx.lineTo(x + 180, DECO_Y + 25);
  ctx.stroke();
  ctx.fillStyle = '#8f96a8';
  ctx.fillRect(x, DECO_Y + 120, 200, 8);
};

const drawExecutiveDeco = (ctx: CanvasRenderingContext2D, x: number) => {
  // 액자
  ctx.fillStyle = '#b8902f';
  ctx.fillRect(x, DECO_Y, 120, 90);
  ctx.fillStyle = '#26334a';
  ctx.fillRect(x + 10, DECO_Y + 10, 100, 70);
  ctx.fillStyle = '#d9b45a';
  ctx.fillRect(x + 30, DECO_Y + 45, 60, 6);

  // 벽 패널
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fillRect(x + 180, 0, 8, GROUND_Y);
};

const DECO_DRAWERS: Record<StageDeco, (ctx: CanvasRenderingContext2D, x: number) => void> = {
  office: drawOfficeDeco,
  meeting: drawMeetingDeco,
  executive: drawExecutiveDeco,
};

const drawFloor = (ctx: CanvasRenderingContext2D, theme: StageTheme, cameraX: number) => {
  ctx.fillStyle = theme.floor;
  ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y);
  ctx.fillStyle = theme.floorLine;
  ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, 6);

  const firstTileX = -(cameraX % FLOOR_TILE_WIDTH);
  for (let tileX = firstTileX; tileX < VIEW_WIDTH; tileX += FLOOR_TILE_WIDTH) {
    ctx.fillRect(tileX, GROUND_Y, 3, VIEW_HEIGHT - GROUND_Y);
  }
};

export const drawBackground = (ctx: CanvasRenderingContext2D, world: World) => {
  const { theme } = world.stage;

  ctx.fillStyle = theme.wall;
  ctx.fillRect(0, 0, VIEW_WIDTH, GROUND_Y);
  ctx.fillStyle = theme.wallAccent;
  ctx.fillRect(0, GROUND_Y - 90, VIEW_WIDTH, 90);

  const drawDeco = DECO_DRAWERS[theme.deco];
  const firstDecoX = -((world.cameraX * DECO_PARALLAX) % DECO_SPACING);
  for (let decoX = firstDecoX; decoX < VIEW_WIDTH; decoX += DECO_SPACING) {
    drawDeco(ctx, decoX);
  }

  drawFloor(ctx, theme, world.cameraX);
};
