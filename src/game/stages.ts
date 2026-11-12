import { PLATFORM_THICKNESS, PLATFORM_Y, VIEW_WIDTH } from './constants';
import type { Boss } from './domains/bosses/boss';
import { DivisionHeadBoss } from './domains/bosses/divisionHeadBoss';
import { ExecutiveBoss } from './domains/bosses/executiveBoss';
import { TeamLeadBoss } from './domains/bosses/teamLeadBoss';
import type { EnemyKind } from './domains/enemies/enemies';
import type { Rect } from './types';

export type SpawnPoint = { x: number; kind: EnemyKind };
export type StageDeco = 'office' | 'meeting' | 'executive';

export type StageTheme = {
  wall: string;
  wallAccent: string;
  floor: string;
  floorLine: string;
  platform: string;
  deco: StageDeco;
};

export type StageDefinition = {
  name: string;
  subtitle: string;
  length: number;
  theme: StageTheme;
  platforms: Rect[];
  spawns: SpawnPoint[];
  createBoss: (arenaLeft: number) => Boss;
  bossIntroLine: string;
  bossDefeatLine: string;
  clearStampText: string;
};

const PLATFORM_WIDTH = 180;

const platformAt = (x: number): Rect => ({ x, y: PLATFORM_Y, w: PLATFORM_WIDTH, h: PLATFORM_THICKNESS });

const spawnsOf = (entries: Array<[number, EnemyKind]>): SpawnPoint[] => entries.map(([x, kind]) => ({ x, kind }));

const STAGE_1_LENGTH = 3600;
const STAGE_2_LENGTH = 3800;
const STAGE_3_LENGTH = 4000;

// 2스테이지 보스(행진)를 피할 수 있도록 아레나 양쪽에 발판을 둔다
const STAGE_2_ARENA_LEFT = STAGE_2_LENGTH - VIEW_WIDTH;
const ARENA_PLATFORM_INSET = 150;

export const STAGES: StageDefinition[] = [
  {
    name: '개발팀 사무실',
    subtitle: '버그와 티켓을 뚫고 팀장님 자리까지',
    length: STAGE_1_LENGTH,
    theme: {
      wall: '#27324a',
      wallAccent: '#33415f',
      floor: '#4a5068',
      floorLine: '#3b4057',
      platform: '#8a6a4a',
      deco: 'office',
    },
    platforms: [platformAt(900), platformAt(1500), platformAt(2150)],
    spawns: spawnsOf([
      [700, 'bug'],
      [860, 'bug'],
      [1100, 'ticket'],
      [1300, 'bug'],
      [1500, 'alarm'],
      [1650, 'ticket'],
      [1760, 'ticket'],
      [1950, 'bug'],
      [2060, 'bug'],
      [2300, 'alarm'],
      [2450, 'ticket'],
      [2580, 'bug'],
    ]),
    createBoss: (arenaLeft) => new TeamLeadBoss(arenaLeft),
    bossIntroLine: '창우씨, 잠깐 얘기 좀 할까요~? 좋게좋게 갑시다~',
    bossDefeatLine: '…그래요, 창우씨 말대로 합시다. 오늘은 퇴근하세요!',
    clearStampText: '퇴근 승인',
  },
  {
    name: '대회의실',
    subtitle: '쏟아지는 회의 초대를 지나 부문장님 앞으로',
    length: STAGE_2_LENGTH,
    theme: {
      wall: '#3a2f4a',
      wallAccent: '#4a3c5f',
      floor: '#5a5068',
      floorLine: '#483f55',
      platform: '#7a7f95',
      deco: 'meeting',
    },
    platforms: [
      platformAt(800),
      platformAt(1400),
      platformAt(2000),
      platformAt(STAGE_2_ARENA_LEFT + ARENA_PLATFORM_INSET),
      platformAt(STAGE_2_ARENA_LEFT + VIEW_WIDTH - ARENA_PLATFORM_INSET - PLATFORM_WIDTH),
    ],
    spawns: spawnsOf([
      [650, 'invite'],
      [800, 'bug'],
      [950, 'ticket'],
      [1050, 'ticket'],
      [1250, 'alarm'],
      [1400, 'invite'],
      [1550, 'bug'],
      [1650, 'bug'],
      [1850, 'ticket'],
      [1950, 'alarm'],
      [2150, 'invite'],
      [2250, 'invite'],
      [2450, 'bug'],
      [2600, 'alarm'],
      [2700, 'ticket'],
    ]),
    createBoss: (arenaLeft) => new DivisionHeadBoss(arenaLeft),
    bossIntroLine: '의견은 잘 들었습니다. 그래도 저는 제 갈 길을 갑니다.',
    bossDefeatLine: '…좋습니다. 이번에는 창우씨 방향으로 가보죠.',
    clearStampText: '방향 수용',
  },
  {
    name: '임원실',
    subtitle: '마지막 결재만 받으면 칼퇴다',
    length: STAGE_3_LENGTH,
    theme: {
      wall: '#3d2c22',
      wallAccent: '#503a2c',
      floor: '#6a2f2f',
      floorLine: '#572626',
      platform: '#b8902f',
      deco: 'executive',
    },
    platforms: [platformAt(850), platformAt(1600), platformAt(2300)],
    spawns: spawnsOf([
      [650, 'alarm'],
      [800, 'bug'],
      [900, 'bug'],
      [1100, 'invite'],
      [1200, 'ticket'],
      [1300, 'ticket'],
      [1500, 'alarm'],
      [1650, 'invite'],
      [1750, 'bug'],
      [1950, 'ticket'],
      [2050, 'ticket'],
      [2200, 'alarm'],
      [2350, 'invite'],
      [2450, 'invite'],
      [2650, 'bug'],
      [2750, 'bug'],
      [2900, 'alarm'],
    ]),
    createBoss: (arenaLeft) => new ExecutiveBoss(arenaLeft),
    bossIntroLine: '이 결재, 다시 올리세요.',
    bossDefeatLine: '승인. 수고했어요. 오늘은 전원 칼퇴!',
    clearStampText: '결재 승인',
  },
];
