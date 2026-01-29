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
          conclusion: `${y.position}爻动化${getChangeTypeText(y.changedYao?.changeType)}`,
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
 * 根据问事类别生成具体的行动建议
 */
function getActionAdvice(
  trend: TrendJudgment,
  questionCategory: QuestionCategory,
  yongShenStrong: boolean,
): string {
  const adviceMap: Record<QuestionCategory, Record<TrendJudgment, string>> = {
    'career': {
      'very_favorable': '【行动建议】现在是行动的好时机。可以主动争取机会、提交申请、与上级沟通想法。把握这段有利时期，积极推进工作计划。',
      'favorable': '【行动建议】可以稳步推进计划。建议先做好充分准备，然后逐步执行。适合发展人脉、提升能力、积累资源。',
      'neutral': '【行动建议】保持现状，等待更好的时机。这段时间适合学习充电、完善方案、观察形势变化。不宜冒进。',
      'unfavorable': '【行动建议】谨慎行事，避免重大决策。如果必须行动，要做好备选方案。可以先试探性地推进一小步，根据反馈调整。',
      'very_unfavorable': '【行动建议】建议暂缓行动，等待时机转变。这段时间适合韬光养晦、修炼内功。避免与人正面冲突，保护好现有成果。',
      'uncertain': '【行动建议】情况尚不明朗，建议再观察一段时间。可以多方收集信息、咨询他人意见后再做决定。',
    },
    'love': {
      'very_favorable': '【行动建议】感情发展顺利，是表白、约会、深入交往的好时机。对方对你印象不错，可以主动一些。已有对象的可以考虑进一步发展。',
      'favorable': '【行动建议】感情有希望，但需要耐心经营。多制造相处机会，展现真诚和关心。不要急于求成，让感情自然升温。',
      'neutral': '【行动建议】感情平稳，没有大的变化。保持正常交往即可。如果想有进展，需要创造契机或改变相处模式。',
      'unfavorable': '【行动建议】感情遇到阻碍，可能是时机不对或有竞争者。建议先审视自己是否有需要改进的地方，不要强求，给彼此一些空间。',
      'very_unfavorable': '【行动建议】目前不适合推进感情。可能对方无意或有其他考虑。建议调整期望，把重心放在提升自己上，缘分到了自然会有。',
      'uncertain': '【行动建议】对方的态度还不明确。建议通过日常互动观察对方反应，不要贸然表白。先建立信任和友谊再说。',
    },
    'wealth': {
      'very_favorable': '【行动建议】财运旺盛，适合投资、谈生意、争取加薪。但也要保持理性，不要因为顺利就盲目加大投入。',
      'favorable': '【行动建议】有赚钱的机会，但要稳扎稳打。建议选择熟悉的领域，控制风险。正财运比偏财运更好。',
      'neutral': '【行动建议】财运平平，守成为主。不适合大的投资决策。可以做一些小额理财，或者把精力放在提升收入能力上。',
      'unfavorable': '【行动建议】财运不佳，要特别小心亏损。避免借贷、担保、大额投资。管好现金流，减少不必要开支。',
      'very_unfavorable': '【行动建议】有破财风险，务必谨慎。不要听信他人推荐的投资项目，不要贪图高收益。保守理财，保护本金为重。',
      'uncertain': '【行动建议】收益不确定性大。如果必须投资，要控制仓位、设好止损。建议等情况明朗后再做大的决定。',
    },
    'health': {
      'very_favorable': '【行动建议】身体状况良好，康复顺利。保持良好的作息和心态。如有手术安排，时机合适。',
      'favorable': '【行动建议】健康状况稳定向好。坚持治疗方案，注意休息和营养。可以适当增加运动量。',
      'neutral': '【行动建议】身体无大碍，但要注意保养。定期体检，不要忽视小毛病。保持规律作息。',
      'unfavorable': '【行动建议】健康需要关注，可能有反复。建议及时就医，遵医嘱，不要讳疾忌医。避免过度劳累和情绪波动。',
      'very_unfavorable': '【行动建议】健康状况需要重视。建议做全面检查，听从医生建议。保持乐观心态，但也要积极配合治疗。',
      'uncertain': '【行动建议】病情可能有变化，需要持续观察。建议多咨询专业医生意见，不要自行判断或停药。',
    },
    'study': {
      'very_favorable': '【行动建议】学业运势很好，考试有望取得好成绩。保持现在的学习状态，考前适当放松，正常发挥即可。',
      'favorable': '【行动建议】学习效果不错，继续努力会有回报。重点复习薄弱环节，做好时间管理。考试时保持平常心。',
      'neutral': '【行动建议】学业平稳，成绩中等。需要更加努力才能突破。建议调整学习方法，向成绩好的同学请教。',
      'unfavorable': '【行动建议】学业有压力，可能达不到预期。建议降低目标、调整心态，先打好基础再图进步。考试不要抱侥幸心理。',
      'very_unfavorable': '【行动建议】学业困难较大。建议认真分析原因：是方法不对、基础不牢还是状态不好？对症下药才能改善。',
      'uncertain': '【行动建议】考试结果不确定性大。建议做好两手准备，既要认真复习，也要想好备选方案。',
    },
    'lawsuit': {
      'very_favorable': '【行动建议】诉讼形势有利，可以积极应对。准备充分的证据材料，选择有经验的律师。',
      'favorable': '【行动建议】官司有赢面，但要细致准备。注意程序合规，不要留下漏洞。能调解的话调解也可以考虑。',
      'neutral': '【行动建议】诉讼结果不确定，双方势均力敌。建议权衡诉讼成本，考虑是否庭外和解更划算。',
      'unfavorable': '【行动建议】诉讼形势不利，要有心理准备。建议咨询专业意见，看是否有和解可能。如果坚持诉讼，要做好持久战准备。',
      'very_unfavorable': '【行动建议】官司难赢，建议慎重考虑是否继续。可能付出很多却得不到理想结果。止损也是一种智慧。',
      'uncertain': '【行动建议】诉讼走向不明朗。建议多了解类似案例，咨询多位律师意见。保存好所有证据，随机应变。',
    },
    'travel': {
      'very_favorable': '【行动建议】出行顺利，是旅游、出差的好时机。计划可以照常进行，有望达成目的。',
      'favorable': '【行动建议】可以出行，但要做好准备工作。提前安排行程，买好保险，注意天气变化。',
      'neutral': '【行动建议】出行无大碍，但也没什么特别收获。如果不是必须，可以择日再行。',
      'unfavorable': '【行动建议】出行有阻碍，可能延误或有小波折。建议延期出行，或者做好备选方案。重要行程要留有余地。',
      'very_unfavorable': '【行动建议】不宜出行，有安全隐患或变数。建议取消或推迟行程。如果必须出行，要格外小心。',
      'uncertain': '【行动建议】出行情况不确定。建议灵活安排，准备好应变方案。重要的行程最好多给几天缓冲时间。',
    },
    'lost': {
      'very_favorable': '【行动建议】有希望找回。建议仔细回忆丢失前的场景，去常去的地方找找。可能在意想不到的地方出现。',
      'favorable': '【行动建议】找回的可能性较大。不要着急，一步步排查可能的地点。也可以发动熟人帮忙留意。',
      'neutral': '【行动建议】能否找回不确定。建议尽力寻找的同时，也要做好找不到的心理准备。',
      'unfavorable': '【行动建议】找回难度较大。可能已经离原地较远，或者被人拿走了。建议考虑报警或发布寻找启事。',
      'very_unfavorable': '【行动建议】找回希望渺茫。建议接受现实，吸取教训。如果是重要物品，考虑补办或重新购买。',
      'uncertain': '【行动建议】情况不明，需要进一步调查。建议系统性地排查可能的地点和人员，不要遗漏任何线索。',
    },
    'other': {
      'very_favorable': '【行动建议】形势有利，可以积极行动。把握当前的好时机，推进你想做的事情。',
      'favorable': '【行动建议】条件基本具备，可以稳步推进。遇到小困难不要轻易放弃，坚持会有收获。',
      'neutral': '【行动建议】形势平稳，可进可退。根据实际情况灵活决定，不必急于一时。',
      'unfavorable': '【行动建议】条件不太成熟，建议谨慎行事。可以做些准备工作，等待更好的时机。',
      'very_unfavorable': '【行动建议】目前不宜行动，阻力较大。建议暂缓计划，保护好现有成果，静待时机转变。',
      'uncertain': '【行动建议】情况还不明朗，建议多观察多了解再做决定。不要凭冲动行事。',
    },
  };

  return adviceMap[questionCategory]?.[trend] || adviceMap['other'][trend];
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

  // 判断用神是否有力
  const yongShenItem = items[0];
  const yongShenStrong = yongShenItem?.type === 'support';

  // 生成命理层总断
  let summaryTechnical = `${primaryGua.name}`;
  if (changedGua) {
    summaryTechnical += `之${changedGua.name}`;
  }
  summaryTechnical += `，${trendTechnical}。`;
  summaryTechnical += `用神${yongShen.liuQin}`;
  if (yongShenItem) {
    summaryTechnical += `，${yongShenItem.technicalText}。`;
  }

  // 生成白话层总断 - 更具体、更有行动指导
  let summaryPlain = `${trendPlain}。`;

  // 添加原因分析
  if (trend === 'favorable' || trend === 'very_favorable') {
    summaryPlain += '关键因素（用神）力量充足，外部环境也比较配合，整体条件有利于你。';
  } else if (trend === 'unfavorable' || trend === 'very_unfavorable') {
    summaryPlain += '关键因素（用神）力量不足或受到压制，可能会遇到阻碍和困难。';
  } else if (trend === 'uncertain') {
    summaryPlain += '关键信息还不确定（可能用神空亡或不现），现在下结论为时过早。';
  } else {
    summaryPlain += '有利和不利因素并存，需要根据具体情况灵活应对。';
  }

  // 添加具体的行动建议
  summaryPlain += '\n\n' + getActionAdvice(trend, questionCategory, yongShenStrong);

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

/**
 * 变化类型文字
 */
function getChangeTypeText(changeType?: string): string {
  const texts: Record<string, string> = {
    'advance': '进神',
    'retreat': '退神',
    'return_birth': '回头生',
    'return_clash': '回头克',
    'to_void': '空',
    'to_tomb': '墓',
    'to_bindingend': '绝',
    'normal': '变',
  };
  return texts[changeType || 'normal'] || '变';
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
