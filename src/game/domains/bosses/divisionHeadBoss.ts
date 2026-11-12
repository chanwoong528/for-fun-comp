import { GROUND_Y, VIEW_WIDTH } from '../../constants';
import { drawPerson, type PersonLook } from '../../render/character';
import { drawGlow } from '../../render/shapes';
import { drawSpeechBubble, drawText } from '../../render/text';
import { sfx } from '../../sfx';
import type { Direction } from '../../types';
import type { World } from '../../world';
import {
  addFloatingText,
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
  type DamageSource,
} from './boss';

// 임태희 부문장: 뭐라하든 내 갈 길을 간다.
// 행진 중에는 총알(의견)이 전부 튕겨 나간다. 잠시 멈춰 메일을 확인할 때만 공격이 통한다.
// 행진은 점프로 넘거나 발판 위로 피한다. 핫픽스는 행진 중에도 통한다.

type DivisionHeadState = 'march' | 'pause';

export const DIVISION_HEAD_LOOK: PersonLook = {
  skin: '#f0c49c',
  hair: '#1e1e26',
  top: '#3d4c8a',
  topShade: '#2c3868',
  bottom: '#2a3050',
  shoe: '#1c1c24',
  tie: '#d6453d',
  hasGlasses: true,
  hasLanyard: false,
  hairStyle: 'slick',
  expression: 'stern',
  outfit: 'suit',
};

const WIDTH = 64;
const HEIGHT = 100;
const MAX_HP = 60;
const WALK_ANIMATION_SPEED = 13;

const MARCH_SPEED = 250;
const SECOND_PHASE_MARCH_SPEED = 330;
const MARCH_PASSES = 3;
const PAUSE_SECONDS = 3.2;

const DOCUMENT_INTERVAL_SECONDS = 1.5;
const SECOND_PHASE_DOCUMENT_INTERVAL_SECONDS = 1.1;
const DOCUMENT_SPEED = 250;
const DOCUMENT_WIDTH = 22;
const DOCUMENT_HEIGHT = 28;

const DEFLECT_LINES = ['의견 감사합니다', '참고하겠습니다', '그래도 갑니다'] as const;
const DEFLECT_TEXT_INTERVAL_SECONDS = 0.7;
const PAUSE_LINE = '(메일 확인 중…)';
const MARCH_LABEL = '마이웨이';
const SPEED_LINE_OFFSETS = [0.25, 0.5, 0.75] as const;

export class DivisionHeadBoss implements Boss {
  readonly name = '임태희';
  readonly title = '부문장';
  readonly maxHp = MAX_HP;
  readonly look = DIVISION_HEAD_LOOK;
  hp = MAX_HP;
  x: number;
  y = GROUND_Y - HEIGHT;
  w = WIDTH;
  h = HEIGHT;

  private readonly leftEdgeX: number;
  private readonly rightEdgeX: number;
  private state: DivisionHeadState = 'march';
  private stateTimer = 0;
  private direction: Direction = -1;
  private passesLeft = MARCH_PASSES;
  private documentTimer = DOCUMENT_INTERVAL_SECONDS;
  private deflectTextTimer = 0;
  private walkPhase = 0;
  private hitFlashTimer = 0;

  constructor(arenaLeft: number) {
    this.leftEdgeX = arenaLeft + BOSS_ARENA_MARGIN;
    this.rightEdgeX = arenaLeft + VIEW_WIDTH - WIDTH - BOSS_ARENA_MARGIN;
    this.x = this.rightEdgeX;
  }

  update(world: World, dt: number) {
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    this.deflectTextTimer = Math.max(0, this.deflectTextTimer - dt);

    if (this.state === 'march') this.updateMarch(world, dt);
    if (this.state === 'pause') this.updatePause(dt);

    if (isOverlapping(this, world.player)) hurtPlayer(world, BOSS_CONTACT_DAMAGE);
  }

  takeDamage(world: World, amount: number, source: DamageSource) {
    const isDeflected = this.state === 'march' && source === 'bullet';
    if (isDeflected) {
      this.showDeflect(world);
      return false;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.hitFlashTimer = BOSS_HIT_FLASH_SECONDS;
    spawnBurst(world, centerOf(this).x, centerOf(this).y, '#ffffff', 2);
    return true;
  }

  draw(ctx: CanvasRenderingContext2D, world: World) {
    const isMarching = this.state === 'march';
    const centerX = this.x + this.w / 2;

    if (isMarching) this.drawMarchAura(ctx, world.time);

    drawPerson(ctx, {
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      facing: this.direction,
      walkPhase: this.walkPhase,
      look: DIVISION_HEAD_LOOK,
      isFlashing: this.hitFlashTimer > 0,
      time: world.time,
      isWalking: isMarching,
      arm: isMarching ? 'rest' : 'phone',
    });
    drawBossNameTag(ctx, this);

    if (isMarching) {
      drawText(ctx, MARCH_LABEL, centerX, this.y - 40, {
        size: 17,
        color: '#ffd666',
        align: 'center',
        outline: '#3a2a00',
      });
      return;
    }

    drawSpeechBubble(ctx, PAUSE_LINE, centerX, this.y - 30);
  }

  // 마이웨이 오라: 행진 중 무적임을 금빛 광채와 속도선으로 보여준다
  private drawMarchAura(ctx: CanvasRenderingContext2D, time: number) {
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const pulse = 0.5 + Math.sin(time * 10) * 0.12;
    drawGlow(ctx, centerX, centerY, this.h * 0.95, '255, 214, 102', pulse);

    ctx.strokeStyle = 'rgba(255, 236, 170, 0.8)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    SPEED_LINE_OFFSETS.forEach((offset, index) => {
      const lineY = this.y + this.h * offset;
      const tailX = centerX - this.direction * (this.w * 0.7 + index * 8);
      ctx.moveTo(tailX, lineY);
      ctx.lineTo(tailX - this.direction * (26 + index * 10), lineY);
    });
    ctx.stroke();
  }

  private updateMarch(world: World, dt: number) {
    const isSecondPhase = isInSecondPhase(this);
    const speed = isSecondPhase ? SECOND_PHASE_MARCH_SPEED : MARCH_SPEED;
    this.x += this.direction * speed * dt;
    this.walkPhase += dt * WALK_ANIMATION_SPEED;

    this.documentTimer -= dt;
    if (this.documentTimer <= 0) {
      this.documentTimer = isSecondPhase ? SECOND_PHASE_DOCUMENT_INTERVAL_SECONDS : DOCUMENT_INTERVAL_SECONDS;
      this.throwDocument(world);
    }

    const hasReachedEdge = this.direction === -1 ? this.x <= this.leftEdgeX : this.x >= this.rightEdgeX;
    if (!hasReachedEdge) return;

    this.x = this.direction === -1 ? this.leftEdgeX : this.rightEdgeX;
    this.direction = this.direction === -1 ? 1 : -1;
    this.passesLeft -= 1;
    if (this.passesLeft > 0) return;

    this.state = 'pause';
    this.stateTimer = PAUSE_SECONDS;
  }

  private updatePause(dt: number) {
    this.stateTimer -= dt;
    if (this.stateTimer > 0) return;

    this.state = 'march';
    this.passesLeft = MARCH_PASSES;
  }

  private throwDocument(world: World) {
    const from = centerOf(this);
    const velocity = aimVelocity(from, centerOf(world.player), DOCUMENT_SPEED);

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
  }

  private showDeflect(world: World) {
    sfx.deflect();
    if (this.deflectTextTimer > 0) return;

    this.deflectTextTimer = DEFLECT_TEXT_INTERVAL_SECONDS;
    addFloatingText(world, this.x + this.w / 2, this.y - 60, pickRandom(DEFLECT_LINES), '#ffd666');
  }
}
