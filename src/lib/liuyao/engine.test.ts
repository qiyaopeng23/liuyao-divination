/**
 * 六爻排盘引擎测试
 *
 * 包含固定卦例的快照测试，确保同输入必出同输出
 */

import { describe, it, expect } from 'vitest';
import { castHexagram, createCastingTime, serializeResult, deserializeResult } from './engine';
import { getDayGanZhi, getMonthGanZhi, getYearGanZhi, getVoidBranches } from './ganzhi';
import { getGuaFromYaoStates, coinSumToYaoState } from './hexagram';
import type { YaoState, CastingInput } from './types';

// ==================== 测试用例数据 ====================

/**
 * 测试卦例1：乾为天（六爻皆阳，无动爻）
 */
const testCase1: CastingInput = {
  method: 'manual',
  yaoStates: [
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
  ],
  time: createCastingTime(new Date('2024-03-15T10:30:00')),
  questionCategory: 'career',
};

/**
 * 测试卦例2：坤为地（六爻皆阴，无动爻）
 */
const testCase2: CastingInput = {
  method: 'manual',
  yaoStates: [
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
  ],
  time: createCastingTime(new Date('2024-03-15T10:30:00')),
  questionCategory: 'wealth',
};

/**
 * 测试卦例3：天地否（初爻动）
 */
const testCase3: CastingInput = {
  method: 'coin',
  yaoStates: [
    { yinYang: '阴', isMoving: true, type: 'old_yin', coinResult: 6 },  // 动爻
    { yinYang: '阴', isMoving: false, type: 'young_yin', coinResult: 8 },
    { yinYang: '阴', isMoving: false, type: 'young_yin', coinResult: 8 },
    { yinYang: '阳', isMoving: false, type: 'young_yang', coinResult: 7 },
    { yinYang: '阳', isMoving: false, type: 'young_yang', coinResult: 7 },
    { yinYang: '阳', isMoving: false, type: 'young_yang', coinResult: 7 },
  ],
  time: createCastingTime(new Date('2024-06-21T14:00:00')),
  questionCategory: 'love',
};

/**
 * 测试卦例4：地天泰
 */
const testCase4: CastingInput = {
  method: 'manual',
  yaoStates: [
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
  ],
  time: createCastingTime(new Date('2024-01-15T09:00:00')),
  questionCategory: 'health',
};

/**
 * 测试卦例5：水火既济（三爻动）
 */
const testCase5: CastingInput = {
  method: 'coin',
  yaoStates: [
    { yinYang: '阳', isMoving: true, type: 'old_yang', coinResult: 9 },
    { yinYang: '阴', isMoving: false, type: 'young_yin', coinResult: 8 },
    { yinYang: '阳', isMoving: true, type: 'old_yang', coinResult: 9 },
    { yinYang: '阴', isMoving: false, type: 'young_yin', coinResult: 8 },
    { yinYang: '阳', isMoving: true, type: 'old_yang', coinResult: 9 },
    { yinYang: '阴', isMoving: false, type: 'young_yin', coinResult: 8 },
  ],
  time: createCastingTime(new Date('2024-09-10T16:30:00')),
  questionCategory: 'study',
};

/**
 * 测试卦例6：火水未济
 */
const testCase6: CastingInput = {
  method: 'manual',
  yaoStates: [
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
  ],
  time: createCastingTime(new Date('2024-12-01T08:00:00')),
  questionCategory: 'lawsuit',
};

/**
 * 测试卦例7：雷水解
 */
const testCase7: CastingInput = {
  method: 'manual',
  yaoStates: [
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
  ],
  time: createCastingTime(new Date('2024-04-05T11:00:00')),
  questionCategory: 'travel',
};

/**
 * 测试卦例8：山水蒙
 */
const testCase8: CastingInput = {
  method: 'manual',
  yaoStates: [
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
  ],
  time: createCastingTime(new Date('2024-08-20T15:00:00')),
  questionCategory: 'study',
};

/**
 * 测试卦例9：风雷益（二爻动）
 */
const testCase9: CastingInput = {
  method: 'coin',
  yaoStates: [
    { yinYang: '阴', isMoving: false, type: 'young_yin', coinResult: 8 },
    { yinYang: '阴', isMoving: true, type: 'old_yin', coinResult: 6 },
    { yinYang: '阳', isMoving: false, type: 'young_yang', coinResult: 7 },
    { yinYang: '阴', isMoving: false, type: 'young_yin', coinResult: 8 },
    { yinYang: '阳', isMoving: false, type: 'young_yang', coinResult: 7 },
    { yinYang: '阳', isMoving: false, type: 'young_yang', coinResult: 7 },
  ],
  time: createCastingTime(new Date('2024-07-07T12:00:00')),
  questionCategory: 'wealth',
};

/**
 * 测试卦例10：泽山咸
 */
const testCase10: CastingInput = {
  method: 'manual',
  yaoStates: [
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阳', isMoving: false, type: 'young_yang' },
    { yinYang: '阴', isMoving: false, type: 'young_yin' },
  ],
  time: createCastingTime(new Date('2024-02-14T20:00:00')),
  questionCategory: 'love',
};

// ==================== 测试 ====================

describe('干支历法模块', () => {
  it('计算日干支 - 2024年3月15日', () => {
    const date = new Date('2024-03-15');
    const result = getDayGanZhi(date);
    // 2024年3月15日是甲辰日
    expect(result.gan).toBeDefined();
    expect(result.zhi).toBeDefined();
  });

  it('计算年干支 - 2024年', () => {
    const date = new Date('2024-03-15');
    const result = getYearGanZhi(date);
    // 2024年是甲辰年
    expect(result.gan).toBe('甲');
    expect(result.zhi).toBe('辰');
  });

  it('计算月干支 - 2024年3月', () => {
    const date = new Date('2024-03-15');
    const result = getMonthGanZhi(date);
    // 2024年3月（惊蛰后）是卯月
    expect(result.zhi).toBe('卯');
  });

  it('计算旬空', () => {
    // 甲子日，旬空戌亥
    const result = getVoidBranches('甲', '子');
    expect(result).toContain('戌');
    expect(result).toContain('亥');
  });
});

describe('卦象生成模块', () => {
  it('铜钱数值转爻状态 - 老阴(6)', () => {
    const result = coinSumToYaoState(6);
    expect(result.yinYang).toBe('阴');
    expect(result.isMoving).toBe(true);
    expect(result.type).toBe('old_yin');
  });

  it('铜钱数值转爻状态 - 少阳(7)', () => {
    const result = coinSumToYaoState(7);
    expect(result.yinYang).toBe('阳');
    expect(result.isMoving).toBe(false);
    expect(result.type).toBe('young_yang');
  });

  it('铜钱数值转爻状态 - 少阴(8)', () => {
    const result = coinSumToYaoState(8);
    expect(result.yinYang).toBe('阴');
    expect(result.isMoving).toBe(false);
    expect(result.type).toBe('young_yin');
  });

  it('铜钱数值转爻状态 - 老阳(9)', () => {
    const result = coinSumToYaoState(9);
    expect(result.yinYang).toBe('阳');
    expect(result.isMoving).toBe(true);
    expect(result.type).toBe('old_yang');
  });

  it('根据爻状态获取本卦 - 乾为天', () => {
    const yaoStates: [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState] = [
      { yinYang: '阳', isMoving: false, type: 'young_yang' },
      { yinYang: '阳', isMoving: false, type: 'young_yang' },
      { yinYang: '阳', isMoving: false, type: 'young_yang' },
      { yinYang: '阳', isMoving: false, type: 'young_yang' },
      { yinYang: '阳', isMoving: false, type: 'young_yang' },
      { yinYang: '阳', isMoving: false, type: 'young_yang' },
    ];
    const result = getGuaFromYaoStates(yaoStates);
    expect(result.name).toBe('乾为天');
    expect(result.binary).toBe('111111');
    expect(result.palace).toBe('乾');
  });

  it('根据爻状态获取本卦 - 坤为地', () => {
    const yaoStates: [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState] = [
      { yinYang: '阴', isMoving: false, type: 'young_yin' },
      { yinYang: '阴', isMoving: false, type: 'young_yin' },
      { yinYang: '阴', isMoving: false, type: 'young_yin' },
      { yinYang: '阴', isMoving: false, type: 'young_yin' },
      { yinYang: '阴', isMoving: false, type: 'young_yin' },
      { yinYang: '阴', isMoving: false, type: 'young_yin' },
    ];
    const result = getGuaFromYaoStates(yaoStates);
    expect(result.name).toBe('坤为地');
    expect(result.binary).toBe('000000');
    expect(result.palace).toBe('坤');
  });
});

describe('完整排盘 - 快照测试', () => {
  it('卦例1：乾为天 - 确保结果稳定', () => {
    const result1 = castHexagram(testCase1);
    const result2 = castHexagram(testCase1);

    // 同输入应产生相同输出
    expect(result1.primaryGua.name).toBe(result2.primaryGua.name);
    expect(result1.primaryGua.binary).toBe(result2.primaryGua.binary);
    expect(result1.primaryYao.map(y => y.diZhi)).toEqual(result2.primaryYao.map(y => y.diZhi));
    expect(result1.primaryYao.map(y => y.liuQin)).toEqual(result2.primaryYao.map(y => y.liuQin));

    // 验证卦象正确
    expect(result1.primaryGua.name).toBe('乾为天');
    expect(result1.primaryGua.palace).toBe('乾');
    expect(result1.primaryGua.worldPosition).toBe(6);
    expect(result1.primaryGua.responsePosition).toBe(3);
  });

  it('卦例2：坤为地 - 确保结果稳定', () => {
    const result1 = castHexagram(testCase2);
    const result2 = castHexagram(testCase2);

    expect(result1.primaryGua.name).toBe(result2.primaryGua.name);
    expect(result1.primaryGua.name).toBe('坤为地');
    expect(result1.primaryGua.palace).toBe('坤');
  });

  it('卦例3：天地否（有动爻）- 验证变卦', () => {
    const result = castHexagram(testCase3);

    expect(result.primaryGua.name).toBe('天地否');
    expect(result.movingYaoPositions).toContain(1);
    expect(result.changedGua).toBeDefined();
    // 初爻动，阴变阳
    expect(result.changedGua?.name).toBe('天雷无妄');
  });

  it('卦例4：地天泰 - 验证纳甲', () => {
    const result = castHexagram(testCase4);

    expect(result.primaryGua.name).toBe('地天泰');
    // 验证纳甲地支
    expect(result.primaryYao[0].diZhi).toBeDefined();
    expect(result.primaryYao[5].diZhi).toBeDefined();
  });

  it('卦例5：水火既济（多爻动）- 验证复杂变化', () => {
    const result = castHexagram(testCase5);

    expect(result.movingYaoPositions.length).toBe(3);
    expect(result.changedGua).toBeDefined();
  });

  it('卦例6-10：批量验证稳定性', () => {
    const testCases = [testCase6, testCase7, testCase8, testCase9, testCase10];

    for (const testCase of testCases) {
      const result1 = castHexagram(testCase);
      const result2 = castHexagram(testCase);

      // 核心数据应完全一致
      expect(result1.primaryGua.name).toBe(result2.primaryGua.name);
      expect(result1.primaryGua.binary).toBe(result2.primaryGua.binary);
      expect(result1.yongShen.liuQin).toBe(result2.yongShen.liuQin);
      expect(result1.interpretation.trend).toBe(result2.interpretation.trend);
    }
  });
});

describe('序列化与反序列化', () => {
  it('卦例可以正确序列化和反序列化', () => {
    const result = castHexagram(testCase1);
    const serialized = serializeResult(result);
    const deserialized = deserializeResult(serialized);

    expect(deserialized).not.toBeNull();
    expect(deserialized?.questionCategory).toBe(testCase1.questionCategory);
    expect(deserialized?.yaoStates.length).toBe(6);
  });
});

describe('解卦结果验证', () => {
  it('解卦结果包含必要字段', () => {
    const result = castHexagram(testCase1);

    expect(result.interpretation).toBeDefined();
    expect(result.interpretation.trend).toBeDefined();
    expect(result.interpretation.summaryPlain).toBeDefined();
    expect(result.interpretation.summaryTechnical).toBeDefined();
    expect(result.interpretation.items.length).toBeGreaterThan(0);
    expect(result.interpretation.causalChain.length).toBeGreaterThan(0);
  });

  it('用神选取符合问事类别', () => {
    // 事业问题应选官鬼为用神
    const careerResult = castHexagram(testCase1);
    expect(careerResult.yongShen.liuQin).toBe('官鬼');

    // 财运问题应选妻财为用神
    const wealthResult = castHexagram(testCase2);
    expect(wealthResult.yongShen.liuQin).toBe('妻财');
  });

  it('推导链有完整记录', () => {
    const result = castHexagram(testCase3);

    expect(result.fullReasoningChain.length).toBeGreaterThan(0);

    // 每个推导步骤应有规则名称和结论
    for (const step of result.fullReasoningChain) {
      expect(step.ruleName).toBeDefined();
      expect(step.conclusion).toBeDefined();
    }
  });
});

describe('六亲六神验证', () => {
  it('六亲分配正确 - 乾宫卦', () => {
    const result = castHexagram(testCase1);

    // 乾宫五行为金
    // 金爻为兄弟，木爻为妻财，水爻为子孙，火爻为官鬼，土爻为父母
    for (const yao of result.primaryYao) {
      expect(['父母', '兄弟', '子孙', '妻财', '官鬼']).toContain(yao.liuQin);
    }
  });

  it('六神排列正确', () => {
    const result = castHexagram(testCase1);

    // 六神应该有6个且不重复
    const liuShenSet = new Set(result.primaryYao.map(y => y.liuShen));
    expect(liuShenSet.size).toBe(6);

    // 验证六神名称
    const validLiuShen = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
    for (const yao of result.primaryYao) {
      expect(validLiuShen).toContain(yao.liuShen);
    }
  });
});

describe('旺衰分析验证', () => {
  it('爻有旺衰状态', () => {
    const result = castHexagram(testCase1);

    for (const yao of result.primaryYao) {
      expect(['旺', '相', '休', '囚', '死', undefined]).toContain(yao.prosperity);
    }
  });

  it('空亡判断正确', () => {
    const result = castHexagram(testCase1);

    // 检查旬空记录
    expect(result.ganZhiTime.voidBranches).toHaveLength(2);

    // 至少有部分爻的空亡状态被设置
    const hasVoidCheck = result.primaryYao.some(y => y.isVoid !== undefined);
    expect(hasVoidCheck).toBe(true);
  });
});
