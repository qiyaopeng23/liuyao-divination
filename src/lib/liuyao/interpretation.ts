/**
 * 解卦引擎模块
 *
 * 基于规则的专家系统，生成结构化解卦结论
 * 包含双层解读：命理层（专业）+ 白话层（易懂）
 *
 * 规则来源：《增删卜易》《卜筮正宗》
 */

import type {
  YaoInfo, GuaInfo, GanZhiTime, YongShenInfo, RelationAnalysis,
  InterpretationResult, InterpretationItem, TrendJudgment,
  ReasoningChain, ReasonItem, TimingPrediction, CausalNode,
  QuestionCategory, LiuQin, ProsperityState,
} from './types';
import { TERM_DICTIONARY } from './types';
import { getWorldYao, getResponseYao, findYaoByLiuQin } from './najia';
import { analyzeProsperity, getProsperityLevel } from './prosperity';
import { LIU_SHEN_MEANINGS } from './liushen';
import { DI_ZHI_CHONG, DI_ZHI } from './constants';

/**
 * 生成完整解卦结果
 */
export function generateInterpretation(
  primaryYaoInfos: YaoInfo[],
  changedYaoInfos: YaoInfo[] | undefined,
  primaryGua: GuaInfo,
  changedGua: GuaInfo | undefined,
  ganZhiTime: GanZhiTime,
  yongShen: YongShenInfo,
  relations: RelationAnalysis[],
  questionCategory: QuestionCategory,
): InterpretationResult {
  const items: InterpretationItem[] = [];
  const uncertainties: InterpretationResult['uncertainties'] = [];
  const timingPredictions: TimingPrediction[] = [];

  // 1. 分析用神状态
  const yongShenAnalysis = analyzeYongShenStatus(primaryYaoInfos, yongShen, ganZhiTime);
  items.push(yongShenAnalysis.item);
  if (yongShenAnalysis.uncertainty) {
    uncertainties.push(yongShenAnalysis.uncertainty);
  }

  // 2. 分析世应关系
  const worldResponseAnalysis = analyzeWorldResponse(primaryYaoInfos, ganZhiTime, questionCategory);
  items.push(worldResponseAnalysis);

  // 3. 分析动爻影响
  const movingYaoAnalysis = analyzeMovingYao(primaryYaoInfos, changedYaoInfos, yongShen);
  if (movingYaoAnalysis) {
    items.push(movingYaoAnalysis.item);
    if (movingYaoAnalysis.uncertainty) {
      uncertainties.push(movingYaoAnalysis.uncertainty);
    }
  }

  // 4. 分析冲合刑害
  const relationAnalysis = analyzeRelationsImpact(relations, yongShen, primaryYaoInfos);
  items.push(...relationAnalysis);

  // 5. 分析空亡破散
  const voidAnalysis = analyzeVoidAndBroken(primaryYaoInfos, yongShen, ganZhiTime);
  if (voidAnalysis) {
    items.push(voidAnalysis);
  }

  // 6. 推断应期
  const timings = predictTiming(primaryYaoInfos, yongShen, ganZhiTime, changedYaoInfos);
  timingPredictions.push(...timings);

  // 7. 综合判断趋势
  const trend = judgeTrend(items, yongShenAnalysis, uncertainties.length);

  // 8. 生成总断
  const { summaryPlain, summaryTechnical } = generateSummary(
    trend, items, yongShen, primaryGua, changedGua, questionCategory
  );

  // 9. 生成因果链（用于白话可视化）
  const causalChain = generateCausalChain(
    primaryYaoInfos, yongShen, trend, items
  );

  return {
    trend,
    summaryPlain,
    summaryTechnical,
    items,
    timingPredictions,
    uncertainties,
    causalChain,
  };
}

/**
 * 分析用神状态
 */
function analyzeYongShenStatus(
  yaoInfos: YaoInfo[],
  yongShen: YongShenInfo,
  ganZhiTime: GanZhiTime,
): { item: InterpretationItem; uncertainty?: InterpretationResult['uncertainties'][0] } {
  // 用神不现的情况
  if (yongShen.positions.length === 0) {
    return {
      item: {
        type: 'obstacle',
        technicalText: `用神${yongShen.liuQin}不在卦中显现，需查伏神`,
        plainText: '关键因素目前没有直接显现出来，情况还不明朗，需要等待更多信息',
        reasoning: {
          steps: [{
            ruleName: '用神不现',
            ruleDescription: '用神不在六爻中出现',
            data: { yongShenLiuQin: yongShen.liuQin },
            conclusion: '用神伏藏，力量难以直接发挥',
            strength: 'strong',
            source: '《增删卜易》：用神不现，事难成也',
          }],
          conclusion: '用神不现，需查伏神',
          confidence: 'low',
        },
        relatedYao: [],
      },
      uncertainty: {
        description: '用神不在卦中显现',
        plainDescription: '最关键的因素目前看不到，这增加了判断的难度',
        suggestions: ['可以考虑重新起卦', '或者等待时机变化后再看'],
      },
    };
  }

  // 获取用神爻
  const yongShenYao = yaoInfos.find(y => yongShen.positions.includes(y.position))!;
  const prosperity = analyzeProsperity(yongShenYao, ganZhiTime);

  const isStrong = prosperity.monthProsperity === '旺' || prosperity.monthProsperity === '相';
  const isVoid = yongShenYao.isVoid;
  const isBroken = yongShenYao.isDayBroken || yongShenYao.isMonthBroken;

  // 生成结论
  const technicalParts: string[] = [];
  const plainParts: string[] = [];

  technicalParts.push(`用神${yongShen.liuQin}在${yongShenYao.position}爻，${yongShenYao.diZhi}${yongShenYao.wuXing}`);
  plainParts.push('关键因素');

  if (isStrong) {
    technicalParts.push(`得月令${prosperity.monthProsperity}`);
    plainParts.push('目前力量较强');
  } else {
    technicalParts.push(`月令${prosperity.monthProsperity}`);
    plainParts.push('目前力量不够强');
  }

  if (prosperity.dayStatus === 'support') {
    technicalParts.push('得日辰生扶');
    plainParts.push('，且有当前环境的支持');
  } else if (prosperity.dayStatus === 'restrain') {
    technicalParts.push('被日辰克制');
    plainParts.push('，但受到当前环境的一些限制');
  }

  let uncertainty: InterpretationResult['uncertainties'][0] | undefined;

  if (isVoid) {
    technicalParts.push('临空亡');
    plainParts.push('不过暂时还无法完全发挥作用');
    uncertainty = {
      description: '用神临空亡',
      plainDescription: '关键因素虽然存在，但目前还没有真正落地，结论需要等待确认',
      suggestions: ['等待出空之时（空亡被填实或被冲）', '不宜急于行动'],
    };
  }

  if (isBroken) {
    technicalParts.push(yongShenYao.isDayBroken ? '日破' : '月破');
    plainParts.push('，而且受到较大的阻力和消耗');
  }

  return {
    item: {
      type: isStrong && !isVoid && !isBroken ? 'support' : 'obstacle',
      technicalText: technicalParts.join('，'),
      plainText: plainParts.join(''),
      reasoning: {
        steps: prosperity.reasons,
        conclusion: `用神${isStrong ? '有力' : '力弱'}`,
        confidence: isVoid ? 'medium' : 'high',
      },
      relatedYao: [yongShenYao.position],
    },
    uncertainty,
  };
}

/**
 * 分析世应关系
 */
function analyzeWorldResponse(
  yaoInfos: YaoInfo[],
  ganZhiTime: GanZhiTime,
  questionCategory: QuestionCategory,
): InterpretationItem {
  const worldYao = getWorldYao(yaoInfos);
  const responseYao = getResponseYao(yaoInfos);

  const worldProsperity = analyzeProsperity(worldYao, ganZhiTime);
  const responseProsperity = analyzeProsperity(responseYao, ganZhiTime);

  const worldStrong = worldProsperity.score > 0;
  const responseStrong = responseProsperity.score > 0;

  // 判断世应生克关系
  const worldToResponse = getWuXingRelation(worldYao.wuXing, responseYao.wuXing);

  let technicalText = `世爻${worldYao.diZhi}${worldYao.wuXing}${worldProsperity.monthProsperity}`;
  technicalText += `，应爻${responseYao.diZhi}${responseYao.wuXing}${responseProsperity.monthProsperity}`;
  technicalText += `，${worldToResponse.description}`;

  let plainText = '你的位置';
  if (worldStrong) {
    plainText += '目前比较有利';
  } else {
    plainText += '目前力量一般';
  }

  plainText += '；外部环境';
  if (responseStrong) {
    plainText += '比较强势';
  } else {
    plainText += '力量有限';
  }

  // 判断主客关系
  if (worldStrong && !responseStrong) {
    plainText += '。整体来说，你占据主动';
  } else if (!worldStrong && responseStrong) {
    plainText += '。整体来说，外部因素影响更大';
  } else {
    plainText += '。双方力量相当，需要看其他因素';
  }

  return {
    type: worldStrong ? 'support' : 'obstacle',
    technicalText,
    plainText,
    reasoning: {
      steps: [
        {
          ruleName: '世应分析',
          ruleDescription: '世爻代表自己，应爻代表对方或外部',
          data: {
            world: { position: worldYao.position, prosperity: worldProsperity.monthProsperity },
            response: { position: responseYao.position, prosperity: responseProsperity.monthProsperity },
          },
          conclusion: `世${worldProsperity.monthProsperity}应${responseProsperity.monthProsperity}`,
          strength: 'strong',
        },
      ],
      conclusion: worldStrong ? '世爻有力，自身条件不错' : '世爻力弱，需借助外力',
      confidence: 'high',
    },
    relatedYao: [worldYao.position, responseYao.position],
  };
}

/**
 * 获取五行生克关系描述
 */
function getWuXingRelation(wuXing1: string, wuXing2: string): { type: string; description: string } {
  const sheng: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const ke: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  if (sheng[wuXing1] === wuXing2) {
    return { type: 'birth', description: '世生应，主动付出' };
  }
  if (sheng[wuXing2] === wuXing1) {
    return { type: 'supported', description: '应生世，得到帮助' };
  }
  if (ke[wuXing1] === wuXing2) {
    return { type: 'restrain', description: '世克应，可以掌控' };
  }
  if (ke[wuXing2] === wuXing1) {
    return { type: 'restrained', description: '应克世，受到制约' };
  }
  if (wuXing1 === wuXing2) {
    return { type: 'same', description: '世应比和，势均力敌' };
  }
  return { type: 'other', description: '世应关系一般' };
}

/**
 * 分析动爻影响
 */
function analyzeMovingYao(
  yaoInfos: YaoInfo[],
  changedYaoInfos: YaoInfo[] | undefined,
  yongShen: YongShenInfo,
): { item: InterpretationItem; uncertainty?: InterpretationResult['uncertainties'][0] } | null {
  const movingYaos = yaoInfos.filter(y => y.isMoving);

  if (movingYaos.length === 0) {
    return null;
  }

  if (movingYaos.length >= 4) {
    return {
      item: {
        type: 'risk',
        technicalText: `动爻过多（${movingYaos.length}爻动），局面混乱`,
        plainText: '变化因素太多，情况比较复杂，暂时看不清楚明确的方向',
        reasoning: {
          steps: [{
            ruleName: '多爻齐动',
            ruleDescription: '动爻超过三爻，局面不稳',
            data: { movingCount: movingYaos.length },
            conclusion: '多爻乱动，难以判断',
            strength: 'strong',
            source: '《增删卜易》：爻动过多，难以定论',
          }],
          conclusion: '局面复杂，需观望',
          confidence: 'low',
        },
        relatedYao: movingYaos.map(y => y.position),
      },
      uncertainty: {
        description: '动爻过多',
        plainDescription: '变化因素太多，情况还在发展中，很难给出确定的结论',
        suggestions: ['建议等待情况稳定后再做判断', '或者重新起卦'],
      },
    };
  }

  // 分析每个动爻的影响
  const analyses: string[] = [];
  const plainAnalyses: string[] = [];

  for (const movingYao of movingYaos) {
    const changedYao = movingYao.changedYao;
    if (!changedYao) continue;

    let analysis = `${movingYao.position}爻${movingYao.liuQin}${movingYao.diZhi}动`;
    let plainAnalysis = '';

    // 判断变化类型
    if (changedYao.changeType === 'return_birth') {
      analysis += '，化回头生';
      plainAnalysis = '变化带来帮助';
    } else if (changedYao.changeType === 'return_clash') {
      analysis += '，化回头克';
      plainAnalysis = '变化带来阻力';
    } else if (changedYao.changeType === 'advance') {
      analysis += '，化进神';
      plainAnalysis = '往好的方向发展';
    } else if (changedYao.changeType === 'retreat') {
      analysis += '，化退神';
      plainAnalysis = '力量在减弱';
    } else {
      analysis += `，化${changedYao.liuQin}${changedYao.diZhi}`;
      plainAnalysis = '正在发生变化';
    }

    // 判断是否影响用神
    if (yongShen.positions.includes(movingYao.position)) {
      analysis += '（用神发动）';
      plainAnalysis = '关键因素' + plainAnalysis;
    }

    analyses.push(analysis);
    plainAnalyses.push(plainAnalysis);
  }

  return {
    item: {
      type: 'trend',
      technicalText: analyses.join('；'),
      plainText: plainAnalyses.join('；'),
      reasoning: {
        steps: movingYaos.map(y => ({
          ruleName: '动爻分析',
          ruleDescription: '分析动爻的变化方向',
          data: {
            position: y.position,
            original: y.diZhi,
            changed: y.changedYao?.diZhi,
            changeType: y.changedYao?.changeType,
          },
          conclusion: `${y.position}爻动化${y.changedYao?.changeType || '变'}`,
          strength: 'medium' as const,
        })),
        conclusion: `共${movingYaos.length}爻发动`,
        confidence: 'medium',
      },
      relatedYao: movingYaos.map(y => y.position),
    },
  };
}

/**
 * 分析关系影响
 */
function analyzeRelationsImpact(
  relations: RelationAnalysis[],
  yongShen: YongShenInfo,
  yaoInfos: YaoInfo[],
): InterpretationItem[] {
  const items: InterpretationItem[] = [];

  // 筛选重要关系
  const importantRelations = relations.filter(r =>
    r.type === 'six_clash' || r.type === 'six_harmony'
  );

  for (const relation of importantRelations.slice(0, 3)) { // 最多显示3条
    let plainText = '';

    if (relation.type === 'six_clash') {
      plainText = `${relation.parties.join('和')}在互相拉扯，可能造成变动或阻碍`;
    } else if (relation.type === 'six_harmony') {
      plainText = `${relation.parties.join('和')}在互相配合，有利于稳定和推进`;
    }

    items.push({
      type: relation.impact === 'positive' ? 'support' : relation.impact === 'negative' ? 'obstacle' : 'trend',
      technicalText: relation.description,
      plainText,
      reasoning: {
        steps: [{
          ruleName: relation.type === 'six_clash' ? '六冲' : '六合',
          ruleDescription: relation.type === 'six_clash'
            ? '相冲则动、散'
            : '相合则聚、绊',
          data: { parties: relation.parties },
          conclusion: relation.description,
          strength: 'medium',
        }],
        conclusion: relation.description,
        confidence: 'medium',
      },
    });
  }

  return items;
}

/**
 * 分析空亡和破
 */
function analyzeVoidAndBroken(
  yaoInfos: YaoInfo[],
  yongShen: YongShenInfo,
  ganZhiTime: GanZhiTime,
): InterpretationItem | null {
  const yongShenYao = yaoInfos.find(y => yongShen.positions.includes(y.position));

  if (!yongShenYao) return null;

  if (yongShenYao.isVoid) {
    return {
      type: 'obstacle',
      technicalText: `用神${yongShenYao.diZhi}落入旬空（${ganZhiTime.voidBranches.join('')}空）`,
      plainText: '关键因素目前还没有真正落地，暂时发挥不了作用。需要等待时机成熟',
      reasoning: {
        steps: [{
          ruleName: '用神空亡',
          ruleDescription: '用神临空，力量暂时不能发挥',
          data: {
            yaoDiZhi: yongShenYao.diZhi,
            voidBranches: ganZhiTime.voidBranches,
          },
          conclusion: '用神空亡待实',
          strength: 'strong',
          source: '《增删卜易》：空者，无也',
        }],
        conclusion: '需等出空之时',
        confidence: 'medium',
      },
      relatedYao: [yongShenYao.position],
    };
  }

  if (yongShenYao.isDayBroken || yongShenYao.isMonthBroken) {
    const breakType = yongShenYao.isMonthBroken ? '月破' : '日破';
    return {
      type: 'obstacle',
      technicalText: `用神${yongShenYao.diZhi}${breakType}`,
      plainText: '关键因素受到较大的冲击和消耗，目前难以发挥正常作用',
      reasoning: {
        steps: [{
          ruleName: breakType,
          ruleDescription: '被日月冲克，力量大损',
          data: {
            yaoDiZhi: yongShenYao.diZhi,
            breakType,
          },
          conclusion: `用神${breakType}，力弱`,
          strength: 'strong',
        }],
        conclusion: '用神受破，不利',
        confidence: 'high',
      },
      relatedYao: [yongShenYao.position],
    };
  }

  return null;
}

/**
 * 预测应期
 */
function predictTiming(
  yaoInfos: YaoInfo[],
  yongShen: YongShenInfo,
  ganZhiTime: GanZhiTime,
  changedYaoInfos?: YaoInfo[],
): TimingPrediction[] {
  const predictions: TimingPrediction[] = [];
  const yongShenYao = yaoInfos.find(y => yongShen.positions.includes(y.position));

  if (!yongShenYao) return predictions;

  // 1. 空亡出空之时
  if (yongShenYao.isVoid) {
    const voidZhi = yongShenYao.diZhi;
    const clashZhi = DI_ZHI_CHONG[voidZhi];

    predictions.push({
      timeWindow: `逢${voidZhi}日/月（填实）或逢${clashZhi}日/月（冲空）`,
      basis: '用神空亡，待填实或冲空而出',
      confidence: 'medium',
      reasoning: {
        steps: [{
          ruleName: '空亡应期',
          ruleDescription: '空亡之爻逢本支填实或被冲而出空',
          data: { voidZhi, clashZhi },
          conclusion: `${voidZhi}或${clashZhi}时应验`,
          strength: 'medium',
        }],
        conclusion: '待出空之时',
        confidence: 'medium',
      },
    });
  }

  // 2. 用神地支对应之时
  if (!yongShenYao.isVoid && !yongShenYao.isDayBroken) {
    predictions.push({
      timeWindow: `逢${yongShenYao.diZhi}日/月`,
      basis: '用神地支值日值月之时',
      confidence: 'medium',
      reasoning: {
        steps: [{
          ruleName: '地支应期',
          ruleDescription: '用神地支当值之时',
          data: { yaoDiZhi: yongShenYao.diZhi },
          conclusion: `${yongShenYao.diZhi}时应验`,
          strength: 'medium',
        }],
        conclusion: '逢本支之时',
        confidence: 'medium',
      },
    });
  }

  // 3. 动爻变化之时
  if (yongShenYao.isMoving && yongShenYao.changedYao) {
    predictions.push({
      timeWindow: `逢${yongShenYao.changedYao.diZhi}日/月`,
      basis: '动爻变化后地支当值之时',
      confidence: 'low',
      reasoning: {
        steps: [{
          ruleName: '变爻应期',
          ruleDescription: '动爻化出之支当值',
          data: { changedDiZhi: yongShenYao.changedYao.diZhi },
          conclusion: `${yongShenYao.changedYao.diZhi}时应验`,
          strength: 'weak',
        }],
        conclusion: '待变化完成',
        confidence: 'low',
      },
    });
  }

  return predictions;
}

/**
 * 综合判断趋势
 */
function judgeTrend(
  items: InterpretationItem[],
  yongShenAnalysis: { item: InterpretationItem },
  uncertaintyCount: number,
): TrendJudgment {
  if (uncertaintyCount >= 2) {
    return 'uncertain';
  }

  let supportCount = 0;
  let obstacleCount = 0;

  for (const item of items) {
    if (item.type === 'support') supportCount++;
    if (item.type === 'obstacle') obstacleCount++;
    if (item.type === 'risk') obstacleCount += 2;
  }

  // 用神状态权重更高
  if (yongShenAnalysis.item.type === 'support') {
    supportCount += 2;
  } else if (yongShenAnalysis.item.type === 'obstacle') {
    obstacleCount += 2;
  }

  const diff = supportCount - obstacleCount;

  if (diff >= 4) return 'very_favorable';
  if (diff >= 2) return 'favorable';
  if (diff <= -4) return 'very_unfavorable';
  if (diff <= -2) return 'unfavorable';
  return 'neutral';
}

/**
 * 生成总断
 */
function generateSummary(
  trend: TrendJudgment,
  items: InterpretationItem[],
  yongShen: YongShenInfo,
  primaryGua: GuaInfo,
  changedGua: GuaInfo | undefined,
  questionCategory: QuestionCategory,
): { summaryPlain: string; summaryTechnical: string } {
  const trendTexts: Record<TrendJudgment, { plain: string; technical: string }> = {
    'very_favorable': {
      plain: '整体趋势非常顺利',
      technical: '卦象大吉',
    },
    'favorable': {
      plain: '整体趋势偏顺',
      technical: '卦象偏吉',
    },
    'neutral': {
      plain: '整体趋势平稳',
      technical: '卦象平和',
    },
    'unfavorable': {
      plain: '整体趋势有阻碍',
      technical: '卦象偏凶',
    },
    'very_unfavorable': {
      plain: '整体趋势不太顺利',
      technical: '卦象不利',
    },
    'uncertain': {
      plain: '情况还不明朗，存在较多不确定因素',
      technical: '卦象待定',
    },
  };

  const { plain: trendPlain, technical: trendTechnical } = trendTexts[trend];

  // 生成命理层总断
  let summaryTechnical = `${primaryGua.name}`;
  if (changedGua) {
    summaryTechnical += `之${changedGua.name}`;
  }
  summaryTechnical += `，${trendTechnical}。`;
  summaryTechnical += `用神${yongShen.liuQin}`;
  const yongShenItem = items[0]; // 第一项是用神分析
  if (yongShenItem) {
    summaryTechnical += `，${yongShenItem.technicalText}。`;
  }

  // 生成白话层总断
  let summaryPlain = `${trendPlain}。`;

  if (trend === 'favorable' || trend === 'very_favorable') {
    summaryPlain += '主要是因为关键因素比较有力，环境也比较配合。';
  } else if (trend === 'unfavorable' || trend === 'very_unfavorable') {
    summaryPlain += '主要是因为关键因素力量不足，或者受到了阻碍。';
  } else if (trend === 'uncertain') {
    summaryPlain += '主要是因为有些重要信息还不确定，建议先观察再做决定。';
  } else {
    summaryPlain += '好坏因素都有，需要具体分析各方面的影响。';
  }

  return { summaryPlain, summaryTechnical };
}

/**
 * 生成因果链（用于白话可视化）
 */
function generateCausalChain(
  yaoInfos: YaoInfo[],
  yongShen: YongShenInfo,
  trend: TrendJudgment,
  items: InterpretationItem[],
): CausalNode[] {
  const worldYao = getWorldYao(yaoInfos);
  const yongShenYao = yaoInfos.find(y => yongShen.positions.includes(y.position));

  const chain: CausalNode[] = [
    {
      id: 'self',
      type: 'self',
      technicalLabel: `世爻（${worldYao.position}爻${worldYao.diZhi}）`,
      plainLabel: '你的位置',
      connectionText: '关注',
      children: [
        {
          id: 'yongshen',
          type: 'factor',
          technicalLabel: `用神${yongShen.liuQin}`,
          plainLabel: '关键因素',
          connectionText: yongShenYao?.prosperity === '旺' || yongShenYao?.prosperity === '相'
            ? '力量较强'
            : '力量不足',
          children: [
            {
              id: 'result',
              type: 'result',
              technicalLabel: getTrendTechnical(trend),
              plainLabel: getTrendPlain(trend),
              connectionText: '因此',
              children: [
                {
                  id: 'advice',
                  type: 'advice',
                  technicalLabel: getAdviceTechnical(trend),
                  plainLabel: getAdvicePlain(trend),
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  return chain;
}

function getTrendTechnical(trend: TrendJudgment): string {
  const map: Record<TrendJudgment, string> = {
    'very_favorable': '大吉',
    'favorable': '偏吉',
    'neutral': '平和',
    'unfavorable': '偏凶',
    'very_unfavorable': '不利',
    'uncertain': '待定',
  };
  return map[trend];
}

function getTrendPlain(trend: TrendJudgment): string {
  const map: Record<TrendJudgment, string> = {
    'very_favorable': '情况非常有利',
    'favorable': '情况比较顺利',
    'neutral': '情况平稳',
    'unfavorable': '有一些阻碍',
    'very_unfavorable': '阻碍较多',
    'uncertain': '情况还不明朗',
  };
  return map[trend];
}

function getAdviceTechnical(trend: TrendJudgment): string {
  const map: Record<TrendJudgment, string> = {
    'very_favorable': '可积极行动',
    'favorable': '可稳步推进',
    'neutral': '宜观望等待',
    'unfavorable': '宜谨慎行事',
    'very_unfavorable': '宜暂缓行动',
    'uncertain': '宜再占或等待',
  };
  return map[trend];
}

function getAdvicePlain(trend: TrendJudgment): string {
  const map: Record<TrendJudgment, string> = {
    'very_favorable': '可以积极行动',
    'favorable': '可以稳步推进',
    'neutral': '建议观察等待',
    'unfavorable': '建议谨慎行事',
    'very_unfavorable': '建议暂缓行动',
    'uncertain': '建议等待更多信息',
  };
  return map[trend];
}
