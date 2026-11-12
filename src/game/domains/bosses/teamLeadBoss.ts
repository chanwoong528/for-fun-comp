import { GROUND_Y, VIEW_WIDTH } from '../../constants';
import { drawPerson, type PersonLook } from '../../render/character';
import { drawSpeechBubble } from '../../render/text';
import type { Direction } from '../../types';
import type { World } from '../../world';
import {
  aimVelocity,
  centerOf,
  hurtPlayer,
  isOverlapping,
  pickRandom,
  spawnBurst,
  spawnEnemyBullet,
} from '../../worldActions';
import {
  BOSS_ARENA_MARGIN,
  BOSS_CONTACT_DAMAGE,
  BOSS_HIT_FLASH_SECONDS,
  drawBossNameTag,
  isInSecondPhase,
  type Boss,
} from './boss';

// 우종석 팀장: 유한 대화로 맘 돌리기.
// 말풍선과 공감 파동에 맞으면 피해는 없지만 "설득당함" 상태가 되어 좌우 조작이 반전된다.

type TeamLeadState = 'idle' | 'talk' | 'wave' | 'telegraph' | 'approach';

export const TEAM_LEAD_LOOK: PersonLook = {
  skin: '#f5c9a0',
  hair: '#4a3628',
  top: '#7fbf8e',
  topShade: '#5c9c6c',
  bottom: '#4a4f66',
  shoe: '#5a4636',
  tie: null,
  hasGlasses: false,
  hasLanyard: true,
  hairStyle: 'parted',
  expression: 'smile',
  outfit: 'knit',
};

const WIDTH = 56;
const HEIGHT = 96;
const MAX_HP = 70;
const WALK_ANIMATION_SPEED = 12;

const PATTERN_ORDER = ['talk', 'wave', 'telegraph'] as const;
const IDLE_SECONDS = 1.1;
const SECOND_PHASE_IDLE_SECONDS = 0.6;

const PERSUASION_LINES = ['해보면 어때요~?', '좋게 갑시다~', '창우씨 말도 맞는데~', '일단 해보죠~'] as const;
const BUBBLE_COUNT = 4;
const SECOND_PHASE_BUBBLE_COUNT = 6;
const BUBBLE_INTERVAL_SECONDS = 0.65;
const BUBBLE_SPEED = 150;
const BUBBLE_WOBBLE = 70;
const BUBBLE_WIDTH = 150;
const BUBBLE_HEIGHT = 30;

const WAVE_COUNT = 2;
const SECOND_PHASE_WAVE_COUNT = 3;
const WAVE_INTERVAL_SECONDS = 0.9;
const WAVE_SPEED = 300;
const WAVE_WIDTH = 40;
const WAVE_HEIGHT = 26;

const TELEGRAPH_SECONDS = 0.8;
const TELEGRAPH_LINE = '잠깐 얘기 좀 할까요~?';
const APPROACH_SPEED = 380;

export class TeamLeadBoss implements Boss {
  readonly name = '우종석';
  readonly title = '팀장';
  readonly maxHp = MAX_HP;
  readonly look = TEAM_LEAD_LOOK;
  hp = MAX_HP;
  x: number;
  y = GROUND_Y - HEIGHT;
  w = WIDTH;
  h = HEIGHT;

  private readonly leftEdgeX: number;
  private readonly rightEdgeX: number;
  private state: TeamLeadState = 'idle';
  private stateTimer = IDLE_SECONDS;
  private patternIndex = 0;
  private shotsLeft = 0;
  private shotTimer = 0;
  private facing: Direction = -1;
  private approachTargetX = 0;
  private walkPhase = 0;
  private hitFlashTimer = 0;

  constructor(arenaLeft: number) {
    this.leftEdgeX = arenaLeft + BOSS_ARENA_MARGIN;
    this.rightEdgeX = arenaLeft + VIEW_WIDTH - WIDTH - BOSS_ARENA_MARGIN;
    this.x = this.rightEdgeX;
  }

  update(world: World, dt: number) {
    this.stateTimer -= dt;
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    if (this.state !== 'approach') this.facing = centerOf(world.player).x < centerOf(this).x ? -1 : 1;

    switch (this.state) {
      case 'idle':
        if (this.stateTimer <= 0) this.startNextPattern();
        break;
      case 'talk':
        this.updateVolley(dt, BUBBLE_INTERVAL_SECONDS, () => this.fireBubble(world));
        break;
      case 'wave':
        this.updateVolley(dt, WAVE_INTERVAL_SECONDS, () => this.fireWave(world));
        break;
      case 'telegraph':
        if (this.stateTimer <= 0) this.startApproach();
        break;
      case 'approach':
        this.updateApproach(dt);
        break;
    }

    if (isOverlapping(this, world.player)) hurtPlayer(world, BOSS_CONTACT_DAMAGE);
  }

  takeDamage(world: World, amount: number) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlashTimer = BOSS_HIT_FLASH_SECONDS;
    spawnBurst(world, centerOf(this).x, centerOf(this).y, '#ffffff', 2);
    return true;
  }

  draw(ctx: CanvasRenderingContext2D, world: World) {
    const isTalking = this.state === 'talk' || this.state === 'wave' || this.state === 'telegraph';

    drawPerson(ctx, {
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      facing: this.facing,
      walkPhase: this.walkPhase,
      look: TEAM_LEAD_LOOK,
      isFlashing: this.hitFlashTimer > 0,
      time: world.time,
      isWalking: this.state === 'approach',
      arm: isTalking ? 'gesture' : 'rest',
    });
    drawBossNameTag(ctx, this);

    if (this.state !== 'telegraph') return;

    drawSpeechBubble(ctx, TELEGRAPH_LINE, this.x + this.w / 2, this.y - 30, {
      fill: '#fff0f6',
      text: '#a0336a',
      border: '#d9659b',
    });
  }

  private enterIdle() {
    this.state = 'idle';
    this.stateTimer = isInSecondPhase(this) ? SECOND_PHASE_IDLE_SECONDS : IDLE_SECONDS;
  }

  private startNextPattern() {
    const pattern = PATTERN_ORDER[this.patternIndex % PATTERN_ORDER.length];
    const isSecondPhase = isInSecondPhase(this);
    this.patternIndex += 1;
    this.shotTimer = 0;

    if (pattern === 'talk') {
      this.state = 'talk';
      this.shotsLeft = isSecondPhase ? SECOND_PHASE_BUBBLE_COUNT : BUBBLE_COUNT;
      return;
    }

    if (pattern === 'wave') {
      this.state = 'wave';
      this.shotsLeft = isSecondPhase ? SECOND_PHASE_WAVE_COUNT : WAVE_COUNT;
      return;
    }

    this.state = 'telegraph';
    this.stateTimer = TELEGRAPH_SECONDS;
  }

  // 일정 간격으로 남은 발사 횟수만큼 쏘고, 다 쏘면 대기 상태로 돌아간다
  private updateVolley(dt: number, intervalSeconds: number, fire: () => void) {
    this.shotTimer -= dt;
    if (this.shotTimer > 0) return;

    if (this.shotsLeft === 0) {
      this.enterIdle();
      return;
    }

    fire();
    this.shotsLeft -= 1;
    this.shotTimer = intervalSeconds;
  }

  private fireBubble(world: World) {
    const mouth = { x: centerOf(this).x, y: this.y + this.h * 0.2 };
    const velocity = aimVelocity(mouth, centerOf(world.player), BUBBLE_SPEED);

    spawnEnemyBullet(world, {
      x: mouth.x - BUBBLE_WIDTH / 2,
      y: mouth.y - BUBBLE_HEIGHT / 2,
      w: BUBBLE_WIDTH,
      h: BUBBLE_HEIGHT,
      ...velocity,
      look: 'bubble',
      effect: 'persuade',
      text: pickRandom(PERSUASION_LINES),
      isShootable: true,
      wobble: BUBBLE_WOBBLE,
    });
  }

  private fireWave(world: World) {
    spawnEnemyBullet(world, {
      x: centerOf(this).x - WAVE_WIDTH / 2,
      y: GROUND_Y - WAVE_HEIGHT,
      w: WAVE_WIDTH,
      h: WAVE_HEIGHT,
      vx: this.facing * WAVE_SPEED,
      vy: 0,
      look: 'wave',
      effect: 'persuade',
      text: '♥',
      isShootable: false,
      wobble: 0,
    });
  }

  // 아레나 반대편 끝까지 걸어가며 플레이어 자리를 지나간다
  private startApproach() {
    const arenaCenterX = (this.leftEdgeX + this.rightEdgeX) / 2;
    this.approachTargetX = this.x > arenaCenterX ? this.leftEdgeX : this.rightEdgeX;
    this.facing = this.approachTargetX < this.x ? -1 : 1;
    this.state = 'approach';
  }

  private updateApproach(dt: number) {
    const step = APPROACH_SPEED * dt;
    const remaining = this.approachTargetX - this.x;
    this.walkPhase += dt * WALK_ANIMATION_SPEED;

    if (Math.abs(remaining) > step) {
      this.x += Math.sign(remaining) * step;
      return;
    }

    this.x = this.approachTargetX;
    this.enterIdle();
  }
}
