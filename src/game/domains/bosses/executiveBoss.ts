import { GROUND_Y, VIEW_WIDTH } from '../../constants';
import { drawPerson, type PersonLook } from '../../render/pixelPerson';
import { drawText } from '../../render/text';
import { sfx } from '../../sfx';
import type { Rect } from '../../types';
import type { World } from '../../world';
import {
  addFloatingText,
  aimVelocity,
  centerOf,
  clamp,
  hurtPlayer,
  isOverlapping,
  spawnBurst,
  spawnEnemyBullet,
} from '../../worldActions';
import { createEnemy } from '../enemies/enemies';
import {
  BOSS_ARENA_MARGIN,
  BOSS_CONTACT_DAMAGE,
  BOSS_HIT_FLASH_SECONDS,
  drawBossNameTag,
  isInSecondPhase,
  type Boss,
} from './boss';

// 곽동훈 전무: 책상 뒤에서 결재 반려 도장을 떨어뜨리고 서류를 뿌린다.
// 체력이 절반 이하가 되면 "전사 긴급 회의"로 회의 초대장을 소환한다.

type ExecutiveState = 'idle' | 'stamps' | 'documents' | 'meeting';
type ExecutivePattern = Exclude<ExecutiveState, 'idle'>;
type StampPhase = 'warning' | 'falling' | 'landed';
type Stamp = Rect & { phase: StampPhase; timer: number };

export const EXECUTIVE_LOOK: PersonLook = {
  skin: '#e9bd95',
  hair: '#8d8d96',
  top: '#1f2430',
  bottom: '#1f2430',
  tie: '#b8902f',
  hasGlasses: false,
};

const WIDTH = 130;
const HEIGHT = 140;
const MAX_HP = 110;
const PERSON_WIDTH = 70;
const DESK_HEIGHT = 56;

const FIRST_PHASE_PATTERNS: readonly ExecutivePattern[] = ['stamps', 'documents'];
const SECOND_PHASE_PATTERNS: readonly ExecutivePattern[] = ['stamps', 'meeting', 'documents'];
const IDLE_SECONDS = 1.2;
const SECOND_PHASE_IDLE_SECONDS = 0.7;

const STAMP_COUNT = 3;
const SECOND_PHASE_STAMP_COUNT = 5;
const STAMP_INTERVAL_SECONDS = 0.6;
const STAMP_WARNING_SECONDS = 0.8;
const STAMP_LANDED_SECONDS = 0.35;
const STAMP_FALL_SPEED = 1400;
const STAMP_WIDTH = 76;
const STAMP_HEIGHT = 70;
const STAMP_START_Y = -STAMP_HEIGHT;
const STAMP_DAMAGE = 1;
const STAMP_SHAKE_SECONDS = 0.15;

const DOCUMENT_VOLLEY_COUNT = 2;
const DOCUMENT_VOLLEY_INTERVAL_SECONDS = 0.9;
const DOCUMENT_FAN_ANGLES = [-0.4, -0.2, 0, 0.2, 0.4] as const;
const DOCUMENT_SPEED = 260;
const DOCUMENT_WIDTH = 22;
const DOCUMENT_HEIGHT = 28;

const MEETING_INVITE_COUNT = 3;
const MEETING_INVITE_GAP = 70;
const MEETING_MAX_ENEMIES = 4;
const MEETING_SECONDS = 1.5;
const MEETING_LINE = '전사 긴급 회의 소집!';

export class ExecutiveBoss implements Boss {
  readonly name = '곽동훈';
  readonly title = '전무';
  readonly maxHp = MAX_HP;
  hp = MAX_HP;
  x: number;
  y = GROUND_Y - HEIGHT;
  w = WIDTH;
  h = HEIGHT;

  private readonly arenaLeft: number;
  private state: ExecutiveState = 'idle';
  private stateTimer = IDLE_SECONDS;
  private patternIndex = 0;
  private shotsLeft = 0;
  private shotTimer = 0;
  private stamps: Stamp[] = [];
  private hitFlashTimer = 0;

  constructor(arenaLeft: number) {
    this.arenaLeft = arenaLeft;
    this.x = arenaLeft + VIEW_WIDTH - WIDTH - BOSS_ARENA_MARGIN;
  }

  update(world: World, dt: number) {
    this.stateTimer -= dt;
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

    switch (this.state) {
      case 'idle':
        if (this.stateTimer <= 0) this.startNextPattern(world);
        break;
      case 'stamps':
        this.updateVolley(dt, STAMP_INTERVAL_SECONDS, () => this.dropStamp(world));
        break;
      case 'documents':
        this.updateVolley(dt, DOCUMENT_VOLLEY_INTERVAL_SECONDS, () => this.throwDocumentFan(world));
        break;
      case 'meeting':
        if (this.stateTimer <= 0) this.enterIdle();
        break;
    }

    this.updateStamps(world, dt);
    if (isOverlapping(this, world.player)) hurtPlayer(world, BOSS_CONTACT_DAMAGE);
  }

  takeDamage(world: World, amount: number) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlashTimer = BOSS_HIT_FLASH_SECONDS;
    spawnBurst(world, this.x, centerOf(this).y, '#ffffff', 2);
    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const isFlashing = this.hitFlashTimer > 0;

    drawPerson(ctx, {
      x: this.x + (this.w - PERSON_WIDTH) / 2,
      y: this.y,
      w: PERSON_WIDTH,
      h: this.h,
      facing: -1,
      walkPhase: 0,
      look: EXECUTIVE_LOOK,
      isFlashing,
    });

    // 책상과 명패
    const deskY = this.y + this.h - DESK_HEIGHT;
    ctx.fillStyle = isFlashing ? '#ffffff' : '#6b4226';
    ctx.fillRect(this.x, deskY, this.w, DESK_HEIGHT);
    ctx.fillStyle = isFlashing ? '#ffffff' : '#4f2f19';
    ctx.fillRect(this.x, deskY, this.w, 8);
    ctx.fillStyle = '#d9b45a';
    ctx.fillRect(this.x + 14, deskY + 18, 60, 22);
    drawText(ctx, this.title, this.x + 44, deskY + 30, { size: 13, color: '#3a2a10', align: 'center' });

    drawBossNameTag(ctx, this);
    this.stamps.forEach((stamp) => this.drawStamp(ctx, stamp));
  }

  private enterIdle() {
    this.state = 'idle';
    this.stateTimer = isInSecondPhase(this) ? SECOND_PHASE_IDLE_SECONDS : IDLE_SECONDS;
  }

  private startNextPattern(world: World) {
    const isSecondPhase = isInSecondPhase(this);
    const patterns = isSecondPhase ? SECOND_PHASE_PATTERNS : FIRST_PHASE_PATTERNS;
    const pattern = patterns[this.patternIndex % patterns.length];
    this.patternIndex += 1;
    this.shotTimer = 0;
    this.state = pattern;

    if (pattern === 'stamps') {
      this.shotsLeft = isSecondPhase ? SECOND_PHASE_STAMP_COUNT : STAMP_COUNT;
      return;
    }

    if (pattern === 'documents') {
      this.shotsLeft = DOCUMENT_VOLLEY_COUNT;
      return;
    }

    this.stateTimer = MEETING_SECONDS;
    this.callMeeting(world);
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

  // 플레이어 머리 위를 조준해 경고 표시 후 도장을 떨어뜨린다
  private dropStamp(world: World) {
    const targetCenterX = centerOf(world.player).x;
    const stampX = clamp(targetCenterX - STAMP_WIDTH / 2, this.arenaLeft, this.x - STAMP_WIDTH);

    this.stamps.push({
      x: stampX,
      y: STAMP_START_Y,
      w: STAMP_WIDTH,
      h: STAMP_HEIGHT,
      phase: 'warning',
      timer: STAMP_WARNING_SECONDS,
    });
  }

  private updateStamps(world: World, dt: number) {
    this.stamps.forEach((stamp) => {
      stamp.timer -= dt;

      if (stamp.phase === 'warning') {
        if (stamp.timer <= 0) stamp.phase = 'falling';
        return;
      }

      if (isOverlapping(stamp, world.player)) hurtPlayer(world, STAMP_DAMAGE);
      if (stamp.phase === 'landed') return;

      stamp.y += STAMP_FALL_SPEED * dt;
      const landedY = GROUND_Y - stamp.h;
      if (stamp.y < landedY) return;

      stamp.y = landedY;
      stamp.phase = 'landed';
      stamp.timer = STAMP_LANDED_SECONDS;
      world.shakeTimer = STAMP_SHAKE_SECONDS;
      addFloatingText(world, stamp.x + stamp.w / 2, landedY - 16, '반려!', '#ff6b6b');
      sfx.stamp();
    });

    this.stamps = this.stamps.filter((stamp) => stamp.phase !== 'landed' || stamp.timer > 0);
  }

  private throwDocumentFan(world: World) {
    const from = { x: this.x, y: this.y + this.h * 0.35 };

    DOCUMENT_FAN_ANGLES.forEach((angleOffset) => {
      const velocity = aimVelocity(from, centerOf(world.player), DOCUMENT_SPEED, angleOffset);

      spawnEnemyBullet(world, {
        x: from.x - DOCUMENT_WIDTH / 2,
        y: from.y - DOCUMENT_HEIGHT / 2,
        w: DOCUMENT_WIDTH,
        h: DOCUMENT_HEIGHT,
        ...velocity,
        look: 'document',
        effect: 'damage',
        text: '',
        isShootable: false,
        wobble: 0,
      });
    });
  }

  private callMeeting(world: World) {
    addFloatingText(world, this.arenaLeft + VIEW_WIDTH / 2, 150, MEETING_LINE, '#c9a6ff');
    if (world.enemies.length >= MEETING_MAX_ENEMIES) return;

    for (let index = 0; index < MEETING_INVITE_COUNT; index += 1) {
      world.enemies.push(createEnemy('invite', this.x - index * MEETING_INVITE_GAP));
    }
  }

  private drawStamp(ctx: CanvasRenderingContext2D, stamp: Stamp) {
    if (stamp.phase === 'warning') {
      const isBlinkOn = Math.floor(stamp.timer * 12) % 2 === 0;
      ctx.fillStyle = isBlinkOn ? 'rgba(255, 80, 80, 0.55)' : 'rgba(255, 80, 80, 0.25)';
      ctx.fillRect(stamp.x, GROUND_Y - 6, stamp.w, 6);
      drawText(ctx, '▼', stamp.x + stamp.w / 2, GROUND_Y - 24, { size: 18, color: '#ff6b6b', align: 'center' });
      return;
    }

    // 도장 손잡이와 인면
    ctx.fillStyle = '#7a4a2a';
    ctx.fillRect(stamp.x + stamp.w * 0.3, stamp.y, stamp.w * 0.4, stamp.h * 0.5);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(stamp.x, stamp.y + stamp.h * 0.5, stamp.w, stamp.h * 0.5);
    drawText(ctx, '반려', stamp.x + stamp.w / 2, stamp.y + stamp.h * 0.75, { size: 18, align: 'center' });
  }
}
