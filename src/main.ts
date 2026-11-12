import './style.css';
import { VIEW_HEIGHT, VIEW_WIDTH } from './game/constants';
import { startGame } from './game/game';
import { STAGES } from './game/stages';

const MAX_PIXEL_RATIO = 2;

// 테스트용 진입점: ?stage=2 → 2스테이지부터, ?stage=2&boss=1 → 2스테이지 보스전부터
const readStartOptions = () => {
  const params = new URLSearchParams(window.location.search);
  const requestedStage = Number(params.get('stage') ?? '1');
  const isValidStage = Number.isInteger(requestedStage) && requestedStage >= 1 && requestedStage <= STAGES.length;

  return {
    startStageIndex: isValidStage ? requestedStage - 1 : 0,
    shouldSkipToBoss: params.get('boss') === '1',
  };
};

// 캔버스는 글꼴을 스스로 불러오지 않으므로 웹폰트를 미리 요청해 둔다 (실패하면 시스템 글꼴로 그린다)
const WEB_FONTS = ["16px 'Jua'", "16px 'Black Han Sans'"];
const FONT_PRELOAD_TEXT = '칼퇴 작전 한결일보 편 Enter 를 눌러 출근하기';
WEB_FONTS.forEach((font) => void document.fonts.load(font, FONT_PRELOAD_TEXT));

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');

if (canvas) {
  const pixelRatio = Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1);
  canvas.width = VIEW_WIDTH * pixelRatio;
  canvas.height = VIEW_HEIGHT * pixelRatio;
  canvas.focus();
  startGame(canvas, pixelRatio, readStartOptions());
}
