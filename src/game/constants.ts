export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;
export const GROUND_Y = 460;
export const GRAVITY = 1500;

// 탭 전환 등으로 프레임이 길어져도 물리가 튀지 않도록 한 프레임 시간을 제한한다
export const MAX_FRAME_SECONDS = 1 / 30;

// 점프로 올라갈 수 있는 발판 높이 (플레이어 최대 점프 높이 약 145px 보다 낮아야 한다)
export const PLATFORM_Y = GROUND_Y - 120;
export const PLATFORM_THICKNESS = 16;
