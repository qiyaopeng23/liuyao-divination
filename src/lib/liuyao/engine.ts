/**
 * 六爻排盘引擎
 *
 * 主引擎模块，整合所有子模块完成完整排盘
 */

import type {
  CastingInput, DivinationResult, YaoState, YaoInfo, GuaInfo,
  GanZhiTime, YongShenInfo, RelationAnalysis, QuestionCategory,
  ReasonItem, CastingTime, YaoList,
} from './types';
import { getGanZhiTime } from './ganzhi';
import {
  getGuaFromYaoStates, getChangedGua, getMutualGua,
  getOppositeGua, getReverseGua, getMovingPositions,
} from './hexagram';
import { installHexagram, getChangedYaoInfos } from './najia';
import { installLiuShen } from './liushen';
import { analyzeAllProsperity } from './prosperity';
import { analyzeRelations } from './relations';
import { selectYongShen, QUESTION_SUBTYPES } from './yongshen';
import { generateInterpretation } from './interpretation';
import { nanoid } from 'nanoid';

/**
 * 完整排盘
 *
 * 输入六爻状态和时间，输出完整卦例结果
 */
export function castHexagram(input: CastingInput): DivinationResult {
  const reasoningChain: ReasonItem[] = [];

  // 1. 获取干支时间
  const ganZhiTime = getGanZhiTime(input.time.gregorian);

  reasoningChain.push({
    ruleName: '时间转换',
    ruleDescription: '将公历时间转换为干支历',
    data: {
      gregorian: input.time.gregorian.toISOString(),
      ganZhi: ganZhiTime,
    },
    conclusion: `${ganZhiTime.year.gan}${ganZhiTime.year.zhi}年 ${ganZhiTime.month.gan}${ganZhiTime.month.zhi}月 ${ganZhiTime.day.gan}${ganZhiTime.day.zhi}日 ${ganZhiTime.hour.gan}${ganZhiTime.hour.zhi}时`,
    strength: 'strong',
  });

  // 2. 获取本卦
  const primaryGua = getGuaFromYaoStates(input.yaoStates);

  reasoningChain.push({
    ruleName: '本卦确定',
    ruleDescription: '根据六爻阴阳确定本卦',
    data: {
      binary: primaryGua.binary,
      upperGua: primaryGua.upperGua,
      lowerGua: primaryGua.lowerGua,
    },
    conclusion: `本卦：${primaryGua.name}（${primaryGua.lowerGua}下${primaryGua.upperGua}上）`,
    strength: 'strong',
  });

  // 3. 纳甲装卦
  let primaryYaoInfos = installHexagram(input.yaoStates, primaryGua);

  reasoningChain.push({
    ruleName: '纳甲装卦',
    ruleDescription: '为六爻配置地支和六亲',
    data: {
      yaoInfos: primaryYaoInfos.map(y => ({
        position: y.position,
        diZhi: y.diZhi,
        wuXing: y.wuXing,
        liuQin: y.liuQin,
      })),
    },
    conclusion: `卦宫：${primaryGua.palace}（${primaryGua.wuXing}），世爻：${primaryGua.worldPosition}爻，应爻：${primaryGua.responsePosition}爻`,
    strength: 'strong',
    source: '京房纳甲法',
  });

  // 4. 安六神
  primaryYaoInfos = installLiuShen(primaryYaoInfos, ganZhiTime.day.gan);

  reasoningChain.push({
    ruleName: '安六神',
    ruleDescription: '根据日干确定六神排列',
    data: {
      dayGan: ganZhiTime.day.gan,
      liuShen: primaryYaoInfos.map(y => y.liuShen),
    },
    conclusion: `${ganZhiTime.day.gan}日起${primaryYaoInfos[0].liuShen}`,
    strength: 'medium',
  });

  // 5. 分析旺衰
  primaryYaoInfos = analyzeAllProsperity(primaryYaoInfos, ganZhiTime);

  reasoningChain.push({
    ruleName: '旺衰分析',
    ruleDescription: '根据月令日辰判断各爻旺衰',
    data: {
      monthWuXing: ganZhiTime.monthWuXing,
      dayWuXing: ganZhiTime.dayWuXing,
      voidBranches: ganZhiTime.voidBranches,
    },
    conclusion: `月令${ganZhiTime.month.zhi}（${ganZhiTime.monthWuXing}），旬空${ganZhiTime.voidBranches.join('')}`,
    strength: 'strong',
    source: '《增删卜易》',
  });

  // 6. 处理变卦
  const movingPositions = getMovingPositions(input.yaoStates);
  let changedGua: GuaInfo | undefined;
  let changedYaoInfos: YaoInfo[] | undefined;

  if (movingPositions.length > 0) {
    changedGua = getChangedGua(input.yaoStates) || undefined;
    if (changedGua) {
      changedYaoInfos = getChangedYaoInfos(primaryYaoInfos, changedGua);
      changedYaoInfos = analyzeAllProsperity(changedYaoInfos, ganZhiTime);

      reasoningChain.push({
        ruleName: '变卦确定',
        ruleDescription: '动爻阴阳互变得变卦',
        data: {
          movingPositions,
          changedBinary: changedGua.binary,
        },
        conclusion: `动爻：${movingPositions.join('、')}爻，变卦：${changedGua.name}`,
        strength: 'strong',
      });
    }
  }

  // 7. 获取互卦、错卦、综卦
  const mutualGua = getMutualGua(input.yaoStates);
  const oppositeGua = getOppositeGua(input.yaoStates);
  const reverseGua = getReverseGua(input.yaoStates);

  // 8. 分析关系
  const relations = analyzeRelations(primaryYaoInfos, ganZhiTime);

  if (relations.length > 0) {
    reasoningChain.push({
      ruleName: '关系分析',
      ruleDescription: '分析爻与爻、爻与日月的冲合刑害关系',
      data: { relationsCount: relations.length },
      conclusion: `发现${relations.length}组关系`,
      strength: 'medium',
    });
  }

  // 9. 选取用神
  const questionSubType = getQuestionSubType(input.questionCategory, input.subType, input.gender);
  const yongShen = selectYongShen(primaryYaoInfos, questionSubType, input.gender);

  reasoningChain.push({
    ruleName: '用神选取',
    ruleDescription: '根据问事类别确定用神',
    data: {
      questionCategory: input.questionCategory,
      subType: questionSubType,
      yongShen,
    },
    conclusion: `用神：${yongShen.liuQin}（${yongShen.reason}）`,
    strength: 'strong',
    source: '《增删卜易》',
  });

  // 10. 生成解卦
  const interpretation = generateInterpretation(
    primaryYaoInfos,
    changedYaoInfos,
    primaryGua,
    changedGua,
    ganZhiTime,
    yongShen,
    relations,
    input.questionCategory,
  );

  // 组装结果
  return {
    id: nanoid(12),
    createdAt: new Date(),
    input,
    primaryGua,
    primaryYao: primaryYaoInfos as YaoList,
    changedGua,
    changedYao: changedYaoInfos as YaoList | undefined,
    mutualGua,
    oppositeGua,
    reverseGua,
    movingYaoPositions: movingPositions,
    ganZhiTime,
    yongShen,
    relations,
    interpretation,
    fullReasoningChain: reasoningChain,
  };
}

/**
 * 根据用户选择确定问事细分类型
 */
function getQuestionSubType(
  category: QuestionCategory,
  userSubType?: string,
  gender?: 'male' | 'female' | 'same_sex'
): string {
  // 感情类 - 根据性别/类型选择
  if (category === 'love') {
    if (userSubType === 'same_sex' || gender === 'same_sex') {
      return 'love_samesex';
    }
    if (userSubType === 'female' || gender === 'female') {
      return 'love_female';
    }
    if (userSubType === 'male' || gender === 'male') {
      return 'love_male';
    }
    return 'love_male';
  }

  // 事业类 - 根据用户选择
  if (category === 'career') {
    if (userSubType === 'business') {
      return 'career_business';  // 经商以妻财为用神
    }
    return 'career_job';  // 求职以官鬼为用神
  }

  // 健康类 - 根据用户选择
  if (category === 'health') {
    if (userSubType === 'other') {
      return 'health_other';  // 代问他人以六亲用神
    }
    return 'health_self';  // 自己问病以世爻为用神
  }

  // 失物类 - 根据用户选择
  if (category === 'lost') {
    if (userSubType === 'person') {
      return 'lost_person';  // 寻人以六亲用神
    }
    return 'lost_item';  // 寻物以妻财为用神
  }

  // 其他类别使用默认
  const subtypes = QUESTION_SUBTYPES[category];
  if (subtypes && subtypes.length > 0) {
    return subtypes[0].subType;
  }
  return 'other_general';
}

/**
 * 创建起卦时间对象
 */
export function createCastingTime(
  date: Date = new Date(),
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): CastingTime {
  return {
    gregorian: date,
    timezone,
    ganZhi: getGanZhiTime(date),
  };
}

/**
 * 序列化卦例结果（用于URL分享）
 */
export function serializeResult(result: DivinationResult): string {
  const data = {
    y: result.input.yaoStates.map(y => {
      if (y.type === 'old_yang') return '9';
      if (y.type === 'young_yang') return '7';
      if (y.type === 'young_yin') return '8';
      return '6';
    }).join(''),
    t: result.input.time.gregorian.getTime(),
    q: result.input.questionCategory,
    m: result.input.method,
  };

  return btoa(JSON.stringify(data));
}

/**
 * 反序列化卦例数据
 */
export function deserializeResult(encoded: string): CastingInput | null {
  try {
    const data = JSON.parse(atob(encoded));

    const yaoStates: [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState] = data.y
      .split('')
      .map((char: string) => {
        const num = parseInt(char) as 6 | 7 | 8 | 9;
        return {
          yinYang: (num === 7 || num === 9) ? '阳' : '阴',
          isMoving: num === 6 || num === 9,
          type: num === 9 ? 'old_yang' : num === 7 ? 'young_yang' : num === 8 ? 'young_yin' : 'old_yin',
          coinResult: num,
        } as YaoState;
      });

    return {
      method: data.m || 'coin',
      yaoStates,
      time: createCastingTime(new Date(data.t)),
      questionCategory: data.q || 'other',
    };
  } catch {
    return null;
  }
}

/**
 * 验证卦例输入
 */
export function validateCastingInput(input: Partial<CastingInput>): string[] {
  const errors: string[] = [];

  if (!input.yaoStates || input.yaoStates.length !== 6) {
    errors.push('必须提供6个爻的状态');
  }

  if (!input.time) {
    errors.push('必须提供起卦时间');
  }

  if (!input.questionCategory) {
    errors.push('必须选择问事类别');
  }

  return errors;
}
