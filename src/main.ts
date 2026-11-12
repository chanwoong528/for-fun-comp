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

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');

if (canvas) {
  const pixelRatio = Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1);
  canvas.width = VIEW_WIDTH * pixelRatio;
  canvas.height = VIEW_HEIGHT * pixelRatio;
  canvas.focus();
  startGame(canvas, pixelRatio, readStartOptions());
}
