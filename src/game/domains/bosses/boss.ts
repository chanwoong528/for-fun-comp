import { drawNameTag } from '../../render/text';
import type { Rect } from '../../types';
import type { World } from '../../world';

export type DamageSource = 'bullet' | 'hotfix';

export interface Boss extends Rect {
  readonly name: string;
  readonly title: string;
  readonly maxHp: number;
  hp: number;
  update(world: World, dt: number): void;
  draw(ctx: CanvasRenderingContext2D, world: World): void;
  // 피해가 실제로 들어갔으면 true, 튕겨냈으면 false
  takeDamage(world: World, amount: number, source: DamageSource): boolean;
}

export const BOSS_CONTACT_DAMAGE = 1;
export const BOSS_HIT_FLASH_SECONDS = 0.08;
export const BOSS_ARENA_MARGIN = 40;

const SECOND_PHASE_HP_RATIO = 0.5;

export const isInSecondPhase = (boss: Boss) => boss.hp <= boss.maxHp * SECOND_PHASE_HP_RATIO;

export const drawBossNameTag = (ctx: CanvasRenderingContext2D, boss: Boss) => {
  drawNameTag(ctx, `${boss.name} ${boss.title}`, boss.x + boss.w / 2, boss.y - 14);
};
