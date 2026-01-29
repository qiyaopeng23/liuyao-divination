/**
 * 占卜状态管理
 */

import { create } from 'zustand';
import type {
  YaoState, QuestionCategory, CastingMethod, DivinationResult,
} from '@/lib/liuyao/types';
import { castHexagram, createCastingTime } from '@/lib/liuyao/engine';

interface DivinationState {
  // 起卦配置
  method: CastingMethod;
  questionCategory: QuestionCategory;
  questionSubType: string;

  // 投币过程
  coinResults: number[]; // 存储每次投币结果
  currentYaoIndex: number; // 当前投币到第几爻

  // 六爻状态
  yaoStates: YaoState[];

  // 结果
  result: DivinationResult | null;

  // 用户模式
  isExpertMode: boolean;
  isFirstVisit: boolean;

  // Actions
  setMethod: (method: CastingMethod) => void;
  setQuestionCategory: (category: QuestionCategory) => void;
  setQuestionSubType: (subType: string) => void;
  addCoinResult: (result: number) => void;
  setYaoState: (index: number, state: YaoState) => void;
  setAllYaoStates: (states: YaoState[]) => void;
  performDivination: () => void;
  reset: () => void;
  toggleExpertMode: () => void;
  setFirstVisitComplete: () => void;
}

const coinResultToYaoState = (sum: 6 | 7 | 8 | 9): YaoState => {
  switch (sum) {
    case 6:
      return { yinYang: '阴', isMoving: true, type: 'old_yin', coinResult: 6 };
    case 7:
      return { yinYang: '阳', isMoving: false, type: 'young_yang', coinResult: 7 };
    case 8:
      return { yinYang: '阴', isMoving: false, type: 'young_yin', coinResult: 8 };
    case 9:
      return { yinYang: '阳', isMoving: true, type: 'old_yang', coinResult: 9 };
  }
};

export const useDivinationStore = create<DivinationState>((set, get) => ({
  // 初始状态
  method: 'coin',
  questionCategory: 'other',
  questionSubType: 'other_general',
  coinResults: [],
  currentYaoIndex: 0,
  yaoStates: [],
  result: null,
  isExpertMode: false,
  isFirstVisit: true,

  // Actions
  setMethod: (method) => set({ method }),

  setQuestionCategory: (category) => set({
    questionCategory: category,
    questionSubType: getDefaultSubType(category),
  }),

  setQuestionSubType: (subType) => set({ questionSubType: subType }),

  addCoinResult: (result) => {
    const { coinResults, currentYaoIndex, yaoStates } = get();
    const newCoinResults = [...coinResults, result];

    // 每3次投币决定一爻
    if (newCoinResults.length % 3 === 0) {
      const lastThree = newCoinResults.slice(-3);
      const sum = lastThree.reduce((a, b) => a + b, 0) as 6 | 7 | 8 | 9;
      const yaoState = coinResultToYaoState(sum);

      const newYaoStates = [...yaoStates, yaoState];

      set({
        coinResults: newCoinResults,
        yaoStates: newYaoStates,
        currentYaoIndex: currentYaoIndex + 1,
      });
    } else {
      set({ coinResults: newCoinResults });
    }
  },

  setYaoState: (index, state) => {
    const { yaoStates } = get();
    const newStates = [...yaoStates];
    newStates[index] = state;
    set({ yaoStates: newStates });
  },

  setAllYaoStates: (states) => set({
    yaoStates: states,
    currentYaoIndex: 6,
  }),

  performDivination: () => {
    const { method, questionCategory, yaoStates } = get();

    if (yaoStates.length !== 6) {
      console.error('需要6个爻的状态');
      return;
    }

    const input = {
      method,
      yaoStates: yaoStates as [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState],
      time: createCastingTime(new Date()),
      questionCategory,
    };

    const result = castHexagram(input);
    set({ result });
  },

  reset: () => set({
    coinResults: [],
    currentYaoIndex: 0,
    yaoStates: [],
    result: null,
  }),

  toggleExpertMode: () => set((state) => ({
    isExpertMode: !state.isExpertMode,
  })),

  setFirstVisitComplete: () => set({ isFirstVisit: false }),
}));

function getDefaultSubType(category: QuestionCategory): string {
  const defaults: Record<QuestionCategory, string> = {
    career: 'career_job',
    love: 'love_relationship',
    wealth: 'wealth_general',
    health: 'health_self',
    study: 'study_exam',
    lawsuit: 'lawsuit_plaintiff',
    travel: 'travel_self',
    lost: 'lost_item',
    other: 'other_general',
  };
  return defaults[category];
}
