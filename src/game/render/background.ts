import { GROUND_Y, VIEW_HEIGHT, VIEW_WIDTH } from '../constants';
import type { StageCelestial, StageDeco, StageTheme } from '../stages';
import type { World } from '../world';
import { drawGlow, ellipse, pseudoRandom, roundedRect, verticalGradient } from './shapes';

// 배경은 외곽선 없이 채도를 낮춰 그려서, 외곽선이 있는 캐릭터·적과 구분되게 한다

const WINDOW_PARALLAX = 0.5;
const WINDOW_SPACING = 380;
const WINDOW_WIDTH = 240;
const WINDOW_HEIGHT = 170;
const WINDOW_Y = 64;
const WINDOW_FRAME = 8;

const BUILDING_WIDTH = 27;
const BUILDING_GAP = 4;
const BUILDING_MIN_HEIGHT = 36;
const BUILDING_HEIGHT_RANGE = 78;

const LIGHT_PARALLAX = 0.8;
const LIGHT_SPACING = 320;
const LIGHT_WIDTH = 96;

const WAINSCOT_HEIGHT = 80;
const FLOOR_TILE_WIDTH = 80;

const PROP_SPACING = 300;
const PROP_OFFSET_X = 70;

type PropDrawer = (ctx: CanvasRenderingContext2D, x: number, index: number) => void;

const drawCelestial = (ctx: CanvasRenderingContext2D, celestial: StageCelestial, x: number, index: number) => {
  switch (celestial) {
    case 'day': {
      drawGlow(ctx, x + WINDOW_WIDTH * 0.76, WINDOW_Y + 40, 60, '255, 250, 210', 0.9);
      ctx.fillStyle = '#fffbe0';
      ellipse(ctx, x + WINDOW_WIDTH * 0.76, WINDOW_Y + 40, 15, 15);
      ctx.fill();
      return;
    }
    case 'sunset': {
      drawGlow(ctx, x + WINDOW_WIDTH * 0.5, WINDOW_Y + WINDOW_HEIGHT * 0.66, 120, '255, 226, 130', 0.85);
      ctx.fillStyle = '#fff1b0';
      ellipse(ctx, x + WINDOW_WIDTH * 0.5, WINDOW_Y + WINDOW_HEIGHT * 0.66, 30, 30);
      ctx.fill();
      return;
    }
    case 'night': {
      ctx.fillStyle = '#ffffff';
      for (let star = 0; star < 14; star += 1) {
        const starX = x + pseudoRandom(index * 31 + star) * WINDOW_WIDTH;
        const starY = WINDOW_Y + pseudoRandom(index * 17 + star * 3) * WINDOW_HEIGHT * 0.55;
        ctx.fillRect(starX, starY, 2, 2);
      }
      drawGlow(ctx, x + WINDOW_WIDTH * 0.76, WINDOW_Y + 38, 46, '240, 236, 200', 0.6);
      ctx.fillStyle = '#f6f2d6';
      ellipse(ctx, x + WINDOW_WIDTH * 0.76, WINDOW_Y + 38, 14, 14);
      ctx.fill();
      return;
    }
  }
};

const drawSkyline = (ctx: CanvasRenderingContext2D, theme: StageTheme, x: number, index: number) => {
  const windowBottom = WINDOW_Y + WINDOW_HEIGHT;
  const buildingCount = Math.ceil(WINDOW_WIDTH / (BUILDING_WIDTH + BUILDING_GAP));

  for (let building = 0; building < buildingCount; building += 1) {
    const seed = index * 13 + building;
    const height = BUILDING_MIN_HEIGHT + pseudoRandom(seed) * BUILDING_HEIGHT_RANGE;
    const buildingX = x + building * (BUILDING_WIDTH + BUILDING_GAP);
    const buildingTop = windowBottom - height;

    ctx.fillStyle = theme.building;
    ctx.fillRect(buildingX, buildingTop, BUILDING_WIDTH, height);

    // 건물 창문: 일부만 불이 켜져 있다
    ctx.fillStyle = theme.buildingLight;
    for (let row = 0; row < Math.floor(height / 12) - 1; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const isLit = pseudoRandom(seed * 7 + row * 3 + column) > 0.45;
        if (isLit) ctx.fillRect(buildingX + 4 + column * 7, buildingTop + 7 + row * 12, 4, 6);
      }
    }
  }
};

const drawWindow = (ctx: CanvasRenderingContext2D, theme: StageTheme, x: number, index: number) => {
  ctx.fillStyle = theme.wainscot;
  roundedRect(ctx, x - WINDOW_FRAME, WINDOW_Y - WINDOW_FRAME, WINDOW_WIDTH + WINDOW_FRAME * 2, WINDOW_HEIGHT + WINDOW_FRAME * 2, 6);
  ctx.fill();

  ctx.save();
  roundedRect(ctx, x, WINDOW_Y, WINDOW_WIDTH, WINDOW_HEIGHT, 3);
  ctx.clip();

  ctx.fillStyle = verticalGradient(ctx, WINDOW_Y, WINDOW_Y + WINDOW_HEIGHT, theme.skyTop, theme.skyBottom);
  ctx.fillRect(x, WINDOW_Y, WINDOW_WIDTH, WINDOW_HEIGHT);
  drawCelestial(ctx, theme.celestial, x, index);
  drawSkyline(ctx, theme, x, index);

  // 유리 반사
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(x + 30, WINDOW_Y);
  ctx.lineTo(x + 80, WINDOW_Y);
  ctx.lineTo(x + 10, WINDOW_Y + WINDOW_HEIGHT);
  ctx.lineTo(x - 40, WINDOW_Y + WINDOW_HEIGHT);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = theme.wainscot;
  ctx.fillRect(x + WINDOW_WIDTH / 2 - 3, WINDOW_Y, 6, WINDOW_HEIGHT);
  ctx.fillStyle = theme.trim;
  roundedRect(ctx, x - 16, WINDOW_Y + WINDOW_HEIGHT + WINDOW_FRAME, WINDOW_WIDTH + 32, 8, 3);
  ctx.fill();
};

const drawCeilingLight = (ctx: CanvasRenderingContext2D, x: number) => {
  const cone = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  cone.addColorStop(0, 'rgba(255, 244, 214, 0.22)');
  cone.addColorStop(1, 'rgba(255, 244, 214, 0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(x, 10);
  ctx.lineTo(x + LIGHT_WIDTH, 10);
  ctx.lineTo(x + LIGHT_WIDTH + 90, GROUND_Y);
  ctx.lineTo(x - 90, GROUND_Y);
  ctx.fill();

  ctx.fillStyle = '#fff6dc';
  roundedRect(ctx, x, 0, LIGHT_WIDTH, 10, 3);
  ctx.fill();
};

const drawDesk: PropDrawer = (ctx, x) => {
  // 의자
  ctx.fillStyle = '#3b4260';
  roundedRect(ctx, x - 40, GROUND_Y - 88, 28, 48, 7);
  ctx.fill();
  ctx.fillRect(x - 44, GROUND_Y - 44, 38, 8);
  ctx.fillRect(x - 27, GROUND_Y - 36, 4, 26);
  ctx.fillRect(x - 40, GROUND_Y - 12, 30, 5);

  // 책상
  ctx.fillStyle = '#8a6a50';
  roundedRect(ctx, x, GROUND_Y - 60, 136, 9, 3);
  ctx.fill();
  ctx.fillStyle = '#6b513c';
  ctx.fillRect(x + 6, GROUND_Y - 51, 6, 51);
  ctx.fillRect(x + 88, GROUND_Y - 51, 42, 51);
  ctx.fillStyle = '#8a6a50';
  ctx.fillRect(x + 102, GROUND_Y - 36, 14, 3);
  ctx.fillRect(x + 102, GROUND_Y - 18, 14, 3);

  // 모니터와 코드 화면
  ctx.fillStyle = '#262c40';
  ctx.fillRect(x + 40, GROUND_Y - 72, 6, 12);
  ctx.fillRect(x + 30, GROUND_Y - 63, 26, 3);
  roundedRect(ctx, x + 12, GROUND_Y - 116, 62, 46, 4);
  ctx.fill();
  ctx.fillStyle = '#1d3b3a';
  ctx.fillRect(x + 16, GROUND_Y - 112, 54, 38);
  ctx.fillStyle = '#62e6b6';
  [0, 1, 2, 3].forEach((line) => ctx.fillRect(x + 20 + (line % 2) * 6, GROUND_Y - 107 + line * 8, 22 + line * 5, 3));
  drawGlow(ctx, x + 43, GROUND_Y - 93, 60, '98, 230, 182', 0.16);

  // 머그컵
  ctx.fillStyle = '#e8e2d4';
  roundedRect(ctx, x + 84, GROUND_Y - 71, 9, 11, 2);
  ctx.fill();
};

const drawPlant: PropDrawer = (ctx, x) => {
  const leafColors = ['#3f8f5a', '#2f7347', '#4aa368'];
  [-0.9, -0.45, 0, 0.45, 0.9].forEach((angle, leafIndex) => {
    ctx.save();
    ctx.translate(x + 40, GROUND_Y - 44);
    ctx.rotate(angle);
    ctx.fillStyle = leafColors[leafIndex % leafColors.length];
    ellipse(ctx, 0, -34, 10, 36);
    ctx.fill();
    ctx.restore();
  });

  ctx.fillStyle = '#b5654a';
  ctx.beginPath();
  ctx.moveTo(x + 18, GROUND_Y - 46);
  ctx.lineTo(x + 62, GROUND_Y - 46);
  ctx.lineTo(x + 55, GROUND_Y);
  ctx.lineTo(x + 25, GROUND_Y);
  ctx.fill();
  ctx.fillStyle = '#c97a5e';
  roundedRect(ctx, x + 14, GROUND_Y - 52, 52, 9, 3);
  ctx.fill();
};

const drawCabinet: PropDrawer = (ctx, x) => {
  ctx.fillStyle = '#4b5373';
  roundedRect(ctx, x, GROUND_Y - 118, 80, 118, 4);
  ctx.fill();
  ctx.fillStyle = '#3b4260';
  [0, 1, 2].forEach((drawer) => ctx.fillRect(x + 6, GROUND_Y - 110 + drawer * 37, 68, 31));
  ctx.fillStyle = '#9aa3c4';
  [0, 1, 2].forEach((drawer) => ctx.fillRect(x + 30, GROUND_Y - 98 + drawer * 37, 20, 4));

  // 프린터
  ctx.fillStyle = '#d6dae6';
  roundedRect(ctx, x + 10, GROUND_Y - 146, 60, 28, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 22, GROUND_Y - 158, 36, 14);
  ctx.fillStyle = '#62e6b6';
  ctx.fillRect(x + 56, GROUND_Y - 138, 6, 4);
};

const drawWhiteboard: PropDrawer = (ctx, x) => {
  ctx.fillStyle = '#8f96a8';
  ctx.fillRect(x + 22, GROUND_Y - 84, 5, 84);
  ctx.fillRect(x + 153, GROUND_Y - 84, 5, 84);
  roundedRect(ctx, x, GROUND_Y - 196, 180, 118, 5);
  ctx.fill();
  ctx.fillStyle = '#f1f4fa';
  ctx.fillRect(x + 6, GROUND_Y - 190, 168, 106);

  // 우상향 그래프와 포스트잇
  ctx.strokeStyle = '#e5484d';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 20, GROUND_Y - 104);
  ctx.lineTo(x + 56, GROUND_Y - 126);
  ctx.lineTo(x + 84, GROUND_Y - 116);
  ctx.lineTo(x + 124, GROUND_Y - 166);
  ctx.stroke();
  ctx.fillStyle = '#ffd966';
  ctx.fillRect(x + 134, GROUND_Y - 180, 26, 24);
  ctx.fillStyle = '#ff9ecb';
  ctx.fillRect(x + 140, GROUND_Y - 148, 26, 24);
  ctx.fillStyle = '#8fd3ff';
  ctx.fillRect(x + 128, GROUND_Y - 118, 26, 24);
};

const drawBookshelf: PropDrawer = (ctx, x, index) => {
  const bookColors = ['#8e3c3c', '#3d5a80', '#c79a35', '#4a7c59', '#6d4c7d'];

  ctx.fillStyle = '#4c301d';
  roundedRect(ctx, x, GROUND_Y - 210, 130, 210, 4);
  ctx.fill();
  ctx.fillStyle = '#2f1d11';
  [0, 1, 2, 3].forEach((shelf) => ctx.fillRect(x + 8, GROUND_Y - 202 + shelf * 50, 114, 42));

  [0, 1, 2, 3].forEach((shelf) => {
    let bookX = x + 11;
    for (let book = 0; book < 9; book += 1) {
      const seed = index * 53 + shelf * 11 + book;
      const width = 8 + pseudoRandom(seed) * 6;
      const height = 26 + pseudoRandom(seed + 0.5) * 12;
      ctx.fillStyle = bookColors[Math.floor(pseudoRandom(seed + 0.25) * bookColors.length)];
      ctx.fillRect(bookX, GROUND_Y - 160 + shelf * 50 - height, width, height);
      bookX += width + 1.5;
    }
  });
};

const drawTrophy: PropDrawer = (ctx, x) => {
  ctx.fillStyle = '#3b2416';
  roundedRect(ctx, x + 8, GROUND_Y - 78, 60, 78, 3);
  ctx.fill();
  ctx.fillStyle = '#5a3823';
  roundedRect(ctx, x + 2, GROUND_Y - 86, 72, 10, 3);
  ctx.fill();

  drawGlow(ctx, x + 38, GROUND_Y - 118, 70, '255, 215, 106', 0.3);
  ctx.fillStyle = '#e8c15a';
  ctx.fillRect(x + 28, GROUND_Y - 92, 20, 6);
  ctx.fillRect(x + 35, GROUND_Y - 106, 6, 14);
  ctx.beginPath();
  ctx.moveTo(x + 20, GROUND_Y - 140);
  ctx.lineTo(x + 56, GROUND_Y - 140);
  ctx.quadraticCurveTo(x + 54, GROUND_Y - 106, x + 38, GROUND_Y - 104);
  ctx.quadraticCurveTo(x + 22, GROUND_Y - 106, x + 20, GROUND_Y - 140);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.fillRect(x + 26, GROUND_Y - 136, 5, 20);
};

const PROPS_BY_DECO: Record<StageDeco, readonly PropDrawer[]> = {
  office: [drawDesk, drawPlant, drawCabinet],
  meeting: [drawWhiteboard, drawPlant, drawDesk],
  executive: [drawBookshelf, drawTrophy, drawPlant],
};

const drawFloor = (ctx: CanvasRenderingContext2D, theme: StageTheme, cameraX: number) => {
  ctx.fillStyle = verticalGradient(ctx, GROUND_Y, VIEW_HEIGHT, theme.floorTop, theme.floorBottom);
  ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  const firstTileX = -(cameraX % FLOOR_TILE_WIDTH);
  for (let tileX = firstTileX; tileX < VIEW_WIDTH; tileX += FLOOR_TILE_WIDTH) {
    ctx.fillRect(tileX, GROUND_Y, 2, VIEW_HEIGHT - GROUND_Y);
  }

  // 바닥 윗면의 광택
  ctx.fillStyle = verticalGradient(ctx, GROUND_Y, GROUND_Y + 36, 'rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0)');
  ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, 36);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, 2);
};

// 화면 좌표에서 그리는 원경: 벽, 창밖 풍경, 천장 조명, 바닥
export const drawBackdrop = (ctx: CanvasRenderingContext2D, world: World) => {
  const { theme } = world.stage;

  ctx.fillStyle = verticalGradient(ctx, 0, GROUND_Y, theme.wallTop, theme.wallBottom);
  ctx.fillRect(0, 0, VIEW_WIDTH, GROUND_Y);

  const windowScroll = world.cameraX * WINDOW_PARALLAX;
  const firstWindowIndex = Math.floor(windowScroll / WINDOW_SPACING);
  for (let offset = 0; offset < Math.ceil(VIEW_WIDTH / WINDOW_SPACING) + 1; offset += 1) {
    const windowIndex = firstWindowIndex + offset;
    drawWindow(ctx, theme, windowIndex * WINDOW_SPACING - windowScroll + 40, windowIndex);
  }

  ctx.fillStyle = theme.wainscot;
  ctx.fillRect(0, GROUND_Y - WAINSCOT_HEIGHT, VIEW_WIDTH, WAINSCOT_HEIGHT);
  ctx.fillStyle = theme.trim;
  ctx.fillRect(0, GROUND_Y - WAINSCOT_HEIGHT, VIEW_WIDTH, 4);

  const lightScroll = (world.cameraX * LIGHT_PARALLAX) % LIGHT_SPACING;
  for (let lightX = 80 - lightScroll; lightX < VIEW_WIDTH + LIGHT_SPACING; lightX += LIGHT_SPACING) {
    drawCeilingLight(ctx, lightX);
  }

  drawFloor(ctx, theme, world.cameraX);
};

// 월드 좌표에서 그리는 근경 소품 (카메라 변환이 적용된 상태에서 호출한다)
export const drawProps = (ctx: CanvasRenderingContext2D, world: World) => {
  const props = PROPS_BY_DECO[world.stage.theme.deco];
  const firstIndex = Math.floor((world.cameraX - PROP_SPACING) / PROP_SPACING);
  const lastIndex = Math.ceil((world.cameraX + VIEW_WIDTH) / PROP_SPACING);

  for (let index = Math.max(0, firstIndex); index <= lastIndex; index += 1) {
    props[index % props.length](ctx, index * PROP_SPACING + PROP_OFFSET_X, index);
  }
};

export const drawVignette = (ctx: CanvasRenderingContext2D) => {
  const gradient = ctx.createRadialGradient(
    VIEW_WIDTH / 2,
    VIEW_HEIGHT / 2,
    VIEW_HEIGHT * 0.45,
    VIEW_WIDTH / 2,
    VIEW_HEIGHT / 2,
    VIEW_WIDTH * 0.72,
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
};
