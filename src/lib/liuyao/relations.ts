/**
 * 关系分析模块
 *
 * 分析地支之间的关系：
 * - 六冲
 * - 六合
 * - 三合
 * - 三刑
 * - 六害
 * - 破
 *
 * 规则来源：《增删卜易》《卜筮正宗》
 */

import type {
  DiZhi, YaoInfo, RelationAnalysis, DiZhiRelation, GanZhiTime, WuXing,
} from './types';
import {
  DI_ZHI_CHONG, DI_ZHI_HE, DI_ZHI_HAI, DI_ZHI_XING,
  DI_ZHI_SAN_HE, DI_ZHI, DI_ZHI_WU_XING,
} from './constants';

// ==================== 基础关系判断 ====================

/**
 * 检查六冲关系
 * 子午冲、丑未冲、寅申冲、卯酉冲、辰戌冲、巳亥冲
 */
export function checkSixClash(zhi1: DiZhi, zhi2: DiZhi): boolean {
  return DI_ZHI_CHONG[zhi1] === zhi2;
}

/**
 * 检查六合关系
 * 子丑合、寅亥合、卯戌合、辰酉合、巳申合、午未合
 */
export function checkSixHarmony(zhi1: DiZhi, zhi2: DiZhi): boolean {
  return DI_ZHI_HE[zhi1] === zhi2;
}

/**
 * 检查六害关系
 * 子未害、丑午害、寅巳害、卯辰害、申亥害、酉戌害
 */
export function checkSixHarm(zhi1: DiZhi, zhi2: DiZhi): boolean {
  return DI_ZHI_HAI[zhi1] === zhi2;
}

/**
 * 检查三刑关系
 */
export function checkThreePenalty(zhi1: DiZhi, zhi2: DiZhi): boolean {
  const penalties = DI_ZHI_XING[zhi1] || [];
  return penalties.includes(zhi2);
}

/**
 * 检查三合关系
 * 申子辰合水、寅午戌合火、巳酉丑合金、亥卯未合木
 */
export function checkThreeHarmony(zhis: DiZhi[]): { isComplete: boolean; wuXing?: WuXing } {
  const sorted = [...zhis].sort();
  const key = sorted.join('');

  for (const [sanHeKey, wuXing] of Object.entries(DI_ZHI_SAN_HE)) {
    const sanHeSet = new Set(sanHeKey.split(''));
    const inputSet = new Set(zhis);

    // 检查是否完全匹配
    if (zhis.length === 3) {
      const isMatch = zhis.every(z => sanHeSet.has(z)) && sanHeSet.size === inputSet.size;
      if (isMatch) {
        return { isComplete: true, wuXing: wuXing as WuXing };
      }
    }

    // 检查是否有两个匹配（半合）
    const matchCount = zhis.filter(z => sanHeSet.has(z)).length;
    if (matchCount >= 2) {
      return { isComplete: false, wuXing: wuXing as WuXing };
    }
  }

  return { isComplete: false };
}

// ==================== 卦中关系分析 ====================

/**
 * 分析卦中所有关系
 */
export function analyzeRelations(
  yaoInfos: YaoInfo[],
  ganZhiTime: GanZhiTime,
): RelationAnalysis[] {
  const relations: RelationAnalysis[] = [];
  const monthZhi = ganZhiTime.month.zhi;
  const dayZhi = ganZhiTime.day.zhi;

  // 1. 分析爻与爻之间的关系
  for (let i = 0; i < yaoInfos.length; i++) {
    for (let j = i + 1; j < yaoInfos.length; j++) {
      const yao1 = yaoInfos[i];
      const yao2 = yaoInfos[j];

      // 六冲
      if (checkSixClash(yao1.diZhi, yao2.diZhi)) {
        relations.push({
          type: 'six_clash',
          parties: [`${yao1.position}爻${yao1.diZhi}`, `${yao2.position}爻${yao2.diZhi}`],
          impact: 'negative',
          description: `${yao1.position}爻${yao1.diZhi}与${yao2.position}爻${yao2.diZhi}相冲，力量相互抵消或产生变化`,
        });
      }

      // 六合
      if (checkSixHarmony(yao1.diZhi, yao2.diZhi)) {
        relations.push({
          type: 'six_harmony',
          parties: [`${yao1.position}爻${yao1.diZhi}`, `${yao2.position}爻${yao2.diZhi}`],
          impact: 'positive',
          description: `${yao1.position}爻${yao1.diZhi}与${yao2.position}爻${yao2.diZhi}相合，力量互相吸引或结合`,
        });
      }

      // 六害
      if (checkSixHarm(yao1.diZhi, yao2.diZhi)) {
        relations.push({
          type: 'six_harm',
          parties: [`${yao1.position}爻${yao1.diZhi}`, `${yao2.position}爻${yao2.diZhi}`],
          impact: 'negative',
          description: `${yao1.position}爻${yao1.diZhi}与${yao2.position}爻${yao2.diZhi}相害，暗中有不利因素`,
        });
      }

      // 三刑
      if (checkThreePenalty(yao1.diZhi, yao2.diZhi)) {
        relations.push({
          type: 'three_penalty',
          parties: [`${yao1.position}爻${yao1.diZhi}`, `${yao2.position}爻${yao2.diZhi}`],
          impact: 'negative',
          description: `${yao1.position}爻${yao1.diZhi}与${yao2.position}爻${yao2.diZhi}相刑，有内部矛盾或自我消耗`,
        });
      }
    }
  }

  // 2. 分析爻与日辰的关系
  for (const yao of yaoInfos) {
    // 日冲
    if (checkSixClash(yao.diZhi, dayZhi)) {
      // 日冲如果爻旺相则为"暗动"，如果爻休囚则为"日破"
      const isWangXiang = yao.prosperity === '旺' || yao.prosperity === '相';
      if (isWangXiang && !yao.isMoving) {
        relations.push({
          type: 'six_clash',
          parties: [`${yao.position}爻${yao.diZhi}`, `日辰${dayZhi}`],
          impact: 'neutral',
          description: `${yao.position}爻${yao.diZhi}被日辰${dayZhi}冲动（暗动），旺相之爻逢冲而动`,
        });
      }
    }

    // 日合
    if (checkSixHarmony(yao.diZhi, dayZhi)) {
      relations.push({
        type: 'six_harmony',
        parties: [`${yao.position}爻${yao.diZhi}`, `日辰${dayZhi}`],
        impact: 'positive',
        description: `${yao.position}爻${yao.diZhi}与日辰${dayZhi}相合，得日辰合扶`,
      });
    }
  }

  // 3. 分析爻与月建的关系
  for (const yao of yaoInfos) {
    // 月冲（月破）
    if (checkSixClash(yao.diZhi, monthZhi)) {
      relations.push({
        type: 'six_clash',
        parties: [`${yao.position}爻${yao.diZhi}`, `月建${monthZhi}`],
        impact: 'negative',
        description: `${yao.position}爻${yao.diZhi}被月建${monthZhi}冲破，为月破`,
      });
    }

    // 月合
    if (checkSixHarmony(yao.diZhi, monthZhi)) {
      relations.push({
        type: 'six_harmony',
        parties: [`${yao.position}爻${yao.diZhi}`, `月建${monthZhi}`],
        impact: 'positive',
        description: `${yao.position}爻${yao.diZhi}与月建${monthZhi}相合，得月令合扶`,
      });
    }
  }

  // 4. 分析动爻与变爻的关系
  for (const yao of yaoInfos) {
    if (yao.isMoving && yao.changedYao) {
      const originalZhi = yao.diZhi;
      const changedZhi = yao.changedYao.diZhi;

      // 动变相冲
      if (checkSixClash(originalZhi, changedZhi)) {
        relations.push({
          type: 'six_clash',
          parties: [`${yao.position}爻${originalZhi}`, `变爻${changedZhi}`],
          impact: 'negative',
          description: `${yao.position}爻动化冲，原爻${originalZhi}与变爻${changedZhi}相冲`,
        });
      }

      // 动变相合（化合）
      if (checkSixHarmony(originalZhi, changedZhi)) {
        relations.push({
          type: 'six_harmony',
          parties: [`${yao.position}爻${originalZhi}`, `变爻${changedZhi}`],
          impact: 'neutral',
          description: `${yao.position}爻动化合，原爻${originalZhi}与变爻${changedZhi}相合，合而不动`,
        });
      }
    }
  }

  // 5. 检查三合局
  const allZhis = yaoInfos.map(y => y.diZhi);
  const threeHarmonyResult = checkThreeHarmony(allZhis);
  if (threeHarmonyResult.isComplete && threeHarmonyResult.wuXing) {
    relations.push({
      type: 'three_harmony',
      parties: allZhis,
      impact: 'positive',
      description: `卦中形成${threeHarmonyResult.wuXing}局三合，力量增强`,
    });
  }

  return relations;
}

/**
 * 获取关系的白话解释
 */
export function getRelationPlainText(relation: RelationAnalysis): string {
  const typeTexts: Record<DiZhiRelation, string> = {
    'six_clash': '相冲 - 两个因素在互相拉扯、对抗',
    'six_harmony': '相合 - 两个因素在互相吸引、配合',
    'three_harmony': '三合 - 多个因素形成稳定的组合',
    'three_penalty': '相刑 - 内部有矛盾或消耗',
    'six_harm': '相害 - 暗中有干扰或损害',
    'destruction': '相破 - 原有状态被打破',
    'none': '无特殊关系',
  };

  return typeTexts[relation.type] || relation.description;
}

/**
 * 分析冲合对解卦的影响
 */
export function analyzeRelationImpact(
  relation: RelationAnalysis,
  yaoInfos: YaoInfo[],
): string {
  switch (relation.type) {
    case 'six_clash':
      return '冲则散、动。如果被冲的爻本身旺相，则冲而动；如果休囚，则冲而散。';
    case 'six_harmony':
      return '合则聚、绊。相合的双方力量趋向结合，但也可能因合而受到牵制。';
    case 'three_penalty':
      return '刑则伤。相刑代表内部矛盾、自我消耗，不利于事情顺利发展。';
    case 'six_harm':
      return '害则损。相害代表暗中有不利因素，需要注意防范。';
    default:
      return '';
  }
}

/**
 * 检查是否有冲空填实
 * 空亡之爻被日月冲，为冲空；逢本支出现为填实
 */
export function checkVoidFilled(
  yaoInfo: YaoInfo,
  ganZhiTime: GanZhiTime,
): { isFilled: boolean; filledBy?: string } {
  if (!yaoInfo.isVoid) {
    return { isFilled: false };
  }

  const dayZhi = ganZhiTime.day.zhi;
  const monthZhi = ganZhiTime.month.zhi;

  // 日辰填实
  if (yaoInfo.diZhi === dayZhi) {
    return { isFilled: true, filledBy: `日辰${dayZhi}` };
  }

  // 月建填实
  if (yaoInfo.diZhi === monthZhi) {
    return { isFilled: true, filledBy: `月建${monthZhi}` };
  }

  // 日辰冲空
  if (checkSixClash(yaoInfo.diZhi, dayZhi)) {
    return { isFilled: true, filledBy: `日辰${dayZhi}冲空` };
  }

  return { isFilled: false };
}
