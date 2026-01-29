/**
 * 旺衰分析模块
 *
 * 分析爻的旺衰状态，包括：
 * - 月令旺衰（旺相休囚死）
 * - 日辰生扶克泄
 * - 十二长生状态
 *
 * 规则来源：《增删卜易》《卜筮正宗》
 */

import type {
  WuXing, DiZhi, YaoInfo, ProsperityState, TwelveStage,
  ProsperityAnalysis, ReasonItem, GanZhiTime,
} from './types';
import {
  DI_ZHI_WU_XING, getProsperityByMonth, DI_ZHI,
  WU_XING_SHENG, WU_XING_KE, WU_XING_CHANG_SHENG_START,
  TWELVE_STAGES, DI_ZHI_CHONG,
} from './constants';
import { isVoid, isDayBroken, isMonthBroken } from './ganzhi';

/**
 * 分析爻的旺衰
 */
export function analyzeProsperity(
  yaoInfo: YaoInfo,
  ganZhiTime: GanZhiTime,
): ProsperityAnalysis {
  const reasons: ReasonItem[] = [];
  let score = 0;

  const yaoWuXing = yaoInfo.wuXing;
  const monthWuXing = ganZhiTime.monthWuXing;
  const dayWuXing = ganZhiTime.dayWuXing;
  const monthZhi = ganZhiTime.month.zhi;
  const dayZhi = ganZhiTime.day.zhi;

  // 1. 月令旺衰（最重要）
  const monthProsperity = getProsperityByMonth(yaoWuXing, monthWuXing);
  const monthScore = getMonthProsperityScore(monthProsperity);
  score += monthScore;

  reasons.push({
    ruleName: '月令旺衰',
    ruleDescription: '以月令（月支五行）判断爻的基础强弱',
    data: {
      yaoWuXing,
      monthWuXing,
      monthZhi,
      monthProsperity,
    },
    conclusion: `${yaoWuXing}爻在${monthZhi}月（${monthWuXing}月）为${monthProsperity}`,
    strength: 'strong',
    source: '《增删卜易》：月令乃提纲也',
  });

  // 2. 日辰生扶克泄
  const dayStatus = getDayStatus(yaoWuXing, dayWuXing);
  const dayScore = getDayStatusScore(dayStatus);
  score += dayScore;

  const dayStatusText = dayStatus === 'support' ? '生扶' : dayStatus === 'restrain' ? '克制' : '无特殊作用';

  reasons.push({
    ruleName: '日辰作用',
    ruleDescription: '日辰对爻的生扶或克制作用',
    data: {
      yaoWuXing,
      dayWuXing,
      dayZhi,
      dayStatus,
    },
    conclusion: `日辰${dayZhi}（${dayWuXing}）对${yaoWuXing}爻${dayStatusText}`,
    strength: 'medium',
    source: '《增删卜易》：日辰为六爻之主宰',
  });

  // 3. 检查旬空
  const isYaoVoid = isVoid(yaoInfo.diZhi, ganZhiTime.voidBranches);
  if (isYaoVoid) {
    score -= 3;
    reasons.push({
      ruleName: '旬空',
      ruleDescription: '爻临空亡，力量暂时不能发挥',
      data: {
        yaoDiZhi: yaoInfo.diZhi,
        voidBranches: ganZhiTime.voidBranches,
      },
      conclusion: `${yaoInfo.diZhi}爻落入旬空（${ganZhiTime.voidBranches.join('、')}空）`,
      strength: 'medium',
      source: '《增删卜易》：空者，无也',
    });
  }

  // 4. 检查日破
  const isYaoDayBroken = isDayBroken(yaoInfo.diZhi, dayZhi);
  if (isYaoDayBroken) {
    score -= 4;
    reasons.push({
      ruleName: '日破',
      ruleDescription: '爻被日辰冲克，力量大减',
      data: {
        yaoDiZhi: yaoInfo.diZhi,
        dayZhi,
      },
      conclusion: `${yaoInfo.diZhi}爻被日辰${dayZhi}冲破`,
      strength: 'strong',
      source: '《增删卜易》：日破者，散也',
    });
  }

  // 5. 检查月破
  const isYaoMonthBroken = isMonthBroken(yaoInfo.diZhi, monthZhi);
  if (isYaoMonthBroken) {
    score -= 5;
    reasons.push({
      ruleName: '月破',
      ruleDescription: '爻被月令冲克，力量极弱',
      data: {
        yaoDiZhi: yaoInfo.diZhi,
        monthZhi,
      },
      conclusion: `${yaoInfo.diZhi}爻被月令${monthZhi}冲破`,
      strength: 'strong',
      source: '《增删卜易》：月破最凶',
    });
  }

  // 6. 计算十二长生状态（可选，作为参考）
  const monthStage = getTwelveStage(yaoWuXing, monthZhi);
  const dayStage = getTwelveStage(yaoWuXing, dayZhi);

  if (monthStage) {
    const stageScore = getTwelveStageScore(monthStage);
    if (stageScore !== 0) {
      score += stageScore * 0.5; // 长生状态作为辅助参考，权重降低
      reasons.push({
        ruleName: '十二长生（月）',
        ruleDescription: '爻在月令的长生状态',
        data: { yaoWuXing, monthZhi, monthStage },
        conclusion: `${yaoWuXing}爻在${monthZhi}月处于${monthStage}位`,
        strength: 'weak',
      });
    }
  }

  // 确保分数在合理范围内
  score = Math.max(-10, Math.min(10, score));

  return {
    monthProsperity,
    dayStatus,
    monthStage,
    dayStage,
    score,
    reasons,
  };
}

/**
 * 获取月令旺衰评分
 */
function getMonthProsperityScore(prosperity: ProsperityState): number {
  switch (prosperity) {
    case '旺': return 5;
    case '相': return 3;
    case '休': return 0;
    case '囚': return -2;
    case '死': return -4;
    default: return 0;
  }
}

/**
 * 获取日辰状态
 */
function getDayStatus(yaoWuXing: WuXing, dayWuXing: WuXing): 'support' | 'restrain' | 'neutral' {
  // 日辰生爻或同五行为扶
  if (WU_XING_SHENG[dayWuXing] === yaoWuXing || dayWuXing === yaoWuXing) {
    return 'support';
  }
  // 日辰克爻为制
  if (WU_XING_KE[dayWuXing] === yaoWuXing) {
    return 'restrain';
  }
  return 'neutral';
}

/**
 * 获取日辰状态评分
 */
function getDayStatusScore(status: 'support' | 'restrain' | 'neutral'): number {
  switch (status) {
    case 'support': return 2;
    case 'restrain': return -2;
    case 'neutral': return 0;
  }
}

/**
 * 获取十二长生状态
 */
function getTwelveStage(wuXing: WuXing, diZhi: DiZhi): TwelveStage | undefined {
  const startData = WU_XING_CHANG_SHENG_START[wuXing];
  if (!startData) return undefined;

  // 简化处理：使用阳干顺序
  const startZhi = startData.yang;
  const startIdx = DI_ZHI.indexOf(startZhi);
  const currentIdx = DI_ZHI.indexOf(diZhi);

  // 阳干顺行
  const offset = (currentIdx - startIdx + 12) % 12;
  return TWELVE_STAGES[offset] as TwelveStage;
}

/**
 * 获取十二长生评分
 */
function getTwelveStageScore(stage: TwelveStage): number {
  const scores: Record<TwelveStage, number> = {
    '长生': 3,
    '沐浴': 1,
    '冠带': 2,
    '临官': 3,
    '帝旺': 4,
    '衰': -1,
    '病': -2,
    '死': -3,
    '墓': -2,
    '绝': -4,
    '胎': 0,
    '养': 1,
  };
  return scores[stage] ?? 0;
}

/**
 * 批量分析六爻旺衰
 */
export function analyzeAllProsperity(
  yaoInfos: YaoInfo[],
  ganZhiTime: GanZhiTime,
): YaoInfo[] {
  return yaoInfos.map(yao => {
    const prosperity = analyzeProsperity(yao, ganZhiTime);
    return {
      ...yao,
      prosperity: prosperity.monthProsperity,
      isVoid: isVoid(yao.diZhi, ganZhiTime.voidBranches),
      isDayBroken: isDayBroken(yao.diZhi, ganZhiTime.day.zhi),
      isMonthBroken: isMonthBroken(yao.diZhi, ganZhiTime.month.zhi),
    };
  });
}

/**
 * 获取旺衰的白话解释
 */
export function getProsperityPlainText(prosperity: ProsperityState): string {
  const plainTexts: Record<ProsperityState, string> = {
    '旺': '当前环境对这件事非常有利，力量最强',
    '相': '当前环境比较支持，力量较强',
    '休': '当前环境一般，力量平平',
    '囚': '当前环境有所限制，力量受阻',
    '死': '当前环境非常不利，力量很弱',
  };
  return plainTexts[prosperity];
}

/**
 * 综合评估旺衰等级
 */
export function getProsperityLevel(score: number): 'strong' | 'medium' | 'weak' | 'very_weak' {
  if (score >= 5) return 'strong';
  if (score >= 2) return 'medium';
  if (score >= -2) return 'weak';
  return 'very_weak';
}
