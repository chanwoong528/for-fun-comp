import { MAX_FRAME_SECONDS } from './constants';
import { createKeyboardInput } from './input';
import {
  drawBossDefeated,
  drawBossIntro,
  drawEnding,
  drawGameOver,
  drawStageIntro,
  drawTitleScreen,
} from './render/overlays';
import { renderWorld } from './render/renderWorld';
import { sfx } from './sfx';
import { STAGES } from './stages';
import { updateEffects, updateWorld } from './updateWorld';
import { createWorld, getArenaLeft, type World } from './world';
import { spawnBurst } from './worldActions';

type Scene = 'title' | 'stageIntro' | 'playing' | 'bossIntro' | 'bossDefeated' | 'gameOver' | 'ending';

type StartOptions = { startStageIndex: number; shouldSkipToBoss: boolean };

type Session = { scene: Scene; sceneTimer: number; world: World };

const STAGE_INTRO_SECONDS = 2;
const BOSS_INTRO_SECONDS = 2.8;
const BOSS_DEFEATED_SECONDS = 3.5;
const DEFEAT_BURST_CHANCE_PER_FRAME = 0.25;

export const startGame = (canvas: HTMLCanvasElement, pixelRatio: number, options: StartOptions) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const input = createKeyboardInput(window);
  const session: Session = { scene: 'title', sceneTimer: 0, world: createWorld(0, false) };
  let previousTime = performance.now();
  // 타이틀·연출 화면의 애니메이션에 쓰는 누적 시간(초)
  let clock = 0;

  const enterStage = (stageIndex: number, shouldSkipToBoss: boolean) => {
    session.world = createWorld(stageIndex, shouldSkipToBoss);
    session.scene = 'stageIntro';
    session.sceneTimer = STAGE_INTRO_SECONDS;
  };

  const enterBossIntro = () => {
    const { world } = session;
    world.boss = world.stage.createBoss(getArenaLeft(world.stage));
    session.scene = 'bossIntro';
    session.sceneTimer = BOSS_INTRO_SECONDS;
  };

  const enterBossDefeated = () => {
    const { world } = session;
    world.enemies = [];
    world.enemyBullets = [];
    world.playerBullets = [];
    session.scene = 'bossDefeated';
    session.sceneTimer = BOSS_DEFEATED_SECONDS;
    sfx.clear();
  };

  const updatePlaying = (dt: number) => {
    const { world } = session;
    updateWorld(world, input, dt);

    if (world.player.hp <= 0) {
      session.scene = 'gameOver';
      return;
    }

    if (world.boss && world.boss.hp <= 0) {
      enterBossDefeated();
      return;
    }

    if (!world.boss && world.isArenaReached) enterBossIntro();
  };

  const updateBossDefeated = (dt: number) => {
    const { world } = session;
    const { boss } = world;
    updateEffects(world, dt);

    if (boss && Math.random() < DEFEAT_BURST_CHANCE_PER_FRAME) {
      spawnBurst(world, boss.x + Math.random() * boss.w, boss.y + Math.random() * boss.h, '#ffe066', 6);
    }

    session.sceneTimer -= dt;
    if (session.sceneTimer > 0) return;

    const nextStageIndex = world.stageIndex + 1;
    if (nextStageIndex >= STAGES.length) {
      session.scene = 'ending';
      return;
    }

    enterStage(nextStageIndex, false);
  };

  const update = (dt: number) => {
    const isConfirmPressed = input.wasPressed('confirm');

    switch (session.scene) {
      case 'title':
        if (isConfirmPressed) enterStage(options.startStageIndex, options.shouldSkipToBoss);
        return;
      case 'stageIntro':
      case 'bossIntro':
        session.sceneTimer -= dt;
        if (session.sceneTimer <= 0 || isConfirmPressed) session.scene = 'playing';
        return;
      case 'playing':
        updatePlaying(dt);
        return;
      case 'bossDefeated':
        updateBossDefeated(dt);
        return;
      case 'gameOver':
        if (isConfirmPressed) enterStage(session.world.stageIndex, false);
        return;
      case 'ending':
        if (isConfirmPressed) session.scene = 'title';
        return;
    }
  };

  const render = () => {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    if (session.scene === 'title') {
      drawTitleScreen(ctx, clock);
      return;
    }

    if (session.scene === 'ending') {
      drawEnding(ctx, clock);
      return;
    }

    renderWorld(ctx, session.world);

    if (session.scene === 'stageIntro') drawStageIntro(ctx, session.world);
    if (session.scene === 'bossIntro') drawBossIntro(ctx, session.world, clock);
    if (session.scene === 'bossDefeated') drawBossDefeated(ctx, session.world, clock);
    if (session.scene === 'gameOver') drawGameOver(ctx, clock);
  };

  const onFrame = (currentTime: number) => {
    const dt = Math.min(MAX_FRAME_SECONDS, (currentTime - previousTime) / 1000);
    previousTime = currentTime;
    clock += dt;

    update(dt);
    render();
    input.endFrame();
    requestAnimationFrame(onFrame);
  };

  requestAnimationFrame(onFrame);
};
