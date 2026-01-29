/**
 * 用神选取模块
 *
 * 根据问事类别自动选取用神
 * 用神是解卦的核心，直接决定断卦的方向
 *
 * 规则来源：《增删卜易》《卜筮正宗》
 */

import type {
  QuestionCategory, LiuQin, YaoInfo, YongShenInfo, ReasonItem, YongShenTarget,
} from './types';
import { YONG_SHEN_RULES } from './constants';
import { findYaoByLiuQin, getWorldYao, getResponseYao } from './najia';

/**
 * 问事细分类型
 */
export interface QuestionSubType {
  category: QuestionCategory;
  subType: string;
  description: string;
}

/**
 * 问事类别的细分
 */
export const QUESTION_SUBTYPES: Record<QuestionCategory, QuestionSubType[]> = {
  'career': [
    { category: 'career', subType: 'career_job', description: '求职/找工作' },
    { category: 'career', subType: 'career_business', description: '经商/创业' },
    { category: 'career', subType: 'career_promotion', description: '升职/晋升' },
    { category: 'career', subType: 'career_interview', description: '面试' },
  ],
  'love': [
    { category: 'love', subType: 'love_male', description: '男问婚恋' },
    { category: 'love', subType: 'love_female', description: '女问婚恋' },
    { category: 'love', subType: 'love_samesex', description: '同性感情' },
    { category: 'love', subType: 'love_relationship', description: '感情发展' },
  ],
  'wealth': [
    { category: 'wealth', subType: 'wealth_general', description: '求财' },
    { category: 'wealth', subType: 'wealth_investment', description: '投资' },
    { category: 'wealth', subType: 'wealth_business', description: '生意买卖' },
  ],
  'health': [
    { category: 'health', subType: 'health_self', description: '自己问病' },
    { category: 'health', subType: 'health_other', description: '代问他人' },
  ],
  'study': [
    { category: 'study', subType: 'study_exam', description: '考试' },
    { category: 'study', subType: 'study_learning', description: '学习' },
  ],
  'lawsuit': [
    { category: 'lawsuit', subType: 'lawsuit_plaintiff', description: '原告/主动方' },
    { category: 'lawsuit', subType: 'lawsuit_defendant', description: '被告/被动方' },
  ],
  'travel': [
    { category: 'travel', subType: 'travel_self', description: '自己出行' },
    { category: 'travel', subType: 'travel_safety', description: '出行安全' },
  ],
  'lost': [
    { category: 'lost', subType: 'lost_item', description: '寻物' },
    { category: 'lost', subType: 'lost_person', description: '寻人' },
  ],
  'other': [
    { category: 'other', subType: 'other_general', description: '其他事项' },
  ],
};

/**
 * 选取用神
 *
 * @param yaoInfos 六爻信息
 * @param questionSubType 问事细分类型
 * @param gender 性别（用于婚恋问题）
 */
export function selectYongShen(
  yaoInfos: YaoInfo[],
  questionSubType: string,
  gender?: 'male' | 'female',
): YongShenInfo {
  const rule = YONG_SHEN_RULES[questionSubType];

  if (!rule) {
    // 默认以世爻为用神
    return createWorldYongShen(yaoInfos);
  }

  // 根据规则获取用神
  const primaryTarget = rule.primary;

  // 处理特殊情况
  if (primaryTarget === '世爻') {
    return createWorldYongShen(yaoInfos);
  }

  if (primaryTarget === '应爻') {
    const responseYao = getResponseYao(yaoInfos);
    if (responseYao) {
      return {
        liuQin: responseYao.liuQin,
        positions: [responseYao.position],
        reason: rule.description,
        isAutoSelected: true,
      };
    }
    return createWorldYongShen(yaoInfos);
  }

  if (primaryTarget === '用神') {
    // 代问他人时，需要根据关系确定用神
    // 这里简化处理，默认返回世爻
    return createWorldYongShen(yaoInfos);
  }

  // 普通六亲用神
  const primaryLiuQin = primaryTarget as LiuQin;
  const secondaryLiuQin = rule.secondary && !['世爻', '应爻', '用神'].includes(rule.secondary)
    ? rule.secondary as LiuQin
    : undefined;

  // 查找用神所在的爻位
  const yongShenYaos = findYaoByLiuQin(yaoInfos, primaryLiuQin);

  if (yongShenYaos.length === 0) {
    // 用神不在卦中显现（伏神情况）
    // TODO: 实现伏神查找
    return {
      liuQin: primaryLiuQin,
      positions: [],
      reason: `${rule.description}，但用神${primaryLiuQin}不在卦中显现，需查伏神`,
      isAutoSelected: true,
      alternatives: secondaryLiuQin ? [{
        liuQin: secondaryLiuQin,
        reason: `备选用神`,
      }] : undefined,
    };
  }

  return {
    liuQin: primaryLiuQin,
    positions: yongShenYaos.map(y => y.position),
    reason: rule.description,
    isAutoSelected: true,
    alternatives: secondaryLiuQin ? [{
      liuQin: secondaryLiuQin,
      reason: `备选用神`,
    }] : undefined,
  };
}

/**
 * 创建以世爻为用神的结果
 */
function createWorldYongShen(yaoInfos: YaoInfo[]): YongShenInfo {
  const worldYao = getWorldYao(yaoInfos);

  return {
    liuQin: worldYao.liuQin,
    positions: [worldYao.position],
    reason: '以世爻为用神，代表自己或事情的主体',
    isAutoSelected: true,
  };
}

/**
 * 手动覆盖用神选择
 */
export function overrideYongShen(
  yaoInfos: YaoInfo[],
  liuQin: LiuQin,
  reason: string,
): YongShenInfo {
  const yongShenYaos = findYaoByLiuQin(yaoInfos, liuQin);

  return {
    liuQin,
    positions: yongShenYaos.map(y => y.position),
    reason,
    isAutoSelected: false,
  };
}

/**
 * 获取用神选取的推导理由
 */
export function getYongShenReasoning(yongShen: YongShenInfo): ReasonItem {
  return {
    ruleName: '用神选取',
    ruleDescription: '根据问事类别确定最关键的爻位',
    data: {
      liuQin: yongShen.liuQin,
      positions: yongShen.positions,
      isAutoSelected: yongShen.isAutoSelected,
    },
    conclusion: yongShen.reason,
    strength: 'strong',
    source: '《增删卜易》：用神者，用事之神也',
  };
}

/**
 * 用神的白话解释
 */
export const YONG_SHEN_PLAIN_TEXT: Record<LiuQin, string> = {
  '父母': '代表文书、长辈、保护、学业、房屋等',
  '兄弟': '代表竞争者、同辈、朋友、阻力、消耗',
  '子孙': '代表晚辈、快乐、福气、投资收益、解决问题的力量',
  '妻财': '代表财物、妻子（男性）、可控的资源、收益',
  '官鬼': '代表压力、责任、丈夫（女性）、工作、不可控因素',
};

/**
 * 获取用神的状态分析
 */
export function analyzeYongShenStatus(
  yaoInfos: YaoInfo[],
  yongShen: YongShenInfo,
): {
  isStrong: boolean;
  isVoid: boolean;
  isBroken: boolean;
  isMoving: boolean;
  summary: string;
  plainSummary: string;
} {
  if (yongShen.positions.length === 0) {
    return {
      isStrong: false,
      isVoid: false,
      isBroken: false,
      isMoving: false,
      summary: '用神不现，需查伏神',
      plainSummary: '关键因素暂时看不到，需要深入分析',
    };
  }

  // 获取用神爻
  const yongShenYao = yaoInfos.find(y => yongShen.positions.includes(y.position));
  if (!yongShenYao) {
    return {
      isStrong: false,
      isVoid: false,
      isBroken: false,
      isMoving: false,
      summary: '用神信息异常',
      plainSummary: '分析出现异常',
    };
  }

  const isStrong = yongShenYao.prosperity === '旺' || yongShenYao.prosperity === '相';
  const isVoid = yongShenYao.isVoid;
  const isBroken = yongShenYao.isDayBroken || yongShenYao.isMonthBroken;
  const isMoving = yongShenYao.isMoving;

  // 生成总结
  const summaryParts: string[] = [];
  const plainParts: string[] = [];

  if (isStrong) {
    summaryParts.push(`用神${yongShenYao.prosperity}`);
    plainParts.push('关键因素目前力量较强');
  } else {
    summaryParts.push(`用神${yongShenYao.prosperity || '不旺'}`);
    plainParts.push('关键因素目前力量不够强');
  }

  if (isVoid) {
    summaryParts.push('临空亡');
    plainParts.push('但暂时无法发挥作用');
  }

  if (isBroken) {
    summaryParts.push('受破');
    plainParts.push('且受到较大阻力');
  }

  if (isMoving) {
    summaryParts.push('发动');
    plainParts.push('正在发生变化');
  }

  return {
    isStrong,
    isVoid,
    isBroken,
    isMoving,
    summary: summaryParts.join('，'),
    plainSummary: plainParts.join('，'),
  };
}

/**
 * 获取问事类别的显示名称
 */
export function getQuestionCategoryName(category: QuestionCategory): string {
  const names: Record<QuestionCategory, string> = {
    'career': '事业工作',
    'love': '感情婚姻',
    'wealth': '财运',
    'health': '健康',
    'study': '学业考试',
    'lawsuit': '诉讼官司',
    'travel': '出行',
    'lost': '失物寻人',
    'other': '其他',
  };
  return names[category];
}
