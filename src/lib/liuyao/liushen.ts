/**
 * 六神模块
 *
 * 六神：青龙、朱雀、勾陈、螣蛇、白虎、玄武
 * 按日干起六神，从初爻往上排
 *
 * 规则来源：《卜筮正宗》
 */

import type { TianGan, LiuShen, YaoInfo } from './types';
import { LIU_SHEN_START, LIU_SHEN_ORDER } from './constants';

/**
 * 根据日干获取初爻六神
 *
 * 规则：
 * - 甲乙日起青龙
 * - 丙丁日起朱雀
 * - 戊日起勾陈
 * - 己日起螣蛇
 * - 庚辛日起白虎
 * - 壬癸日起玄武
 */
export function getStartLiuShen(dayGan: TianGan): LiuShen {
  return LIU_SHEN_START[dayGan];
}

/**
 * 获取六爻的六神排列
 *
 * 从初爻开始，按青龙→朱雀→勾陈→螣蛇→白虎→玄武的顺序
 * 起始六神由日干决定
 */
export function getLiuShenArray(dayGan: TianGan): LiuShen[] {
  const startShen = getStartLiuShen(dayGan);
  const startIndex = LIU_SHEN_ORDER.indexOf(startShen);

  return Array.from({ length: 6 }, (_, i) => {
    const index = (startIndex + i) % 6;
    return LIU_SHEN_ORDER[index];
  });
}

/**
 * 为六爻设置六神
 */
export function installLiuShen(yaoInfos: YaoInfo[], dayGan: TianGan): YaoInfo[] {
  const liuShenArray = getLiuShenArray(dayGan);

  return yaoInfos.map((yao, index) => ({
    ...yao,
    liuShen: liuShenArray[index],
  }));
}

/**
 * 六神含义（用于解卦）
 */
export const LIU_SHEN_MEANINGS: Record<LiuShen, {
  name: string;
  nature: string;
  goodAspects: string[];
  badAspects: string[];
  plainMeaning: string;
}> = {
  '青龙': {
    name: '青龙',
    nature: '吉神',
    goodAspects: ['喜庆', '升迁', '婚姻', '财喜', '文书'],
    badAspects: ['过于乐观', '酒色之事'],
    plainMeaning: '代表好消息、喜事、顺利的因素',
  },
  '朱雀': {
    name: '朱雀',
    nature: '凶神',
    goodAspects: ['文书', '口才', '考试'],
    badAspects: ['口舌', '是非', '官司', '火灾'],
    plainMeaning: '代表沟通、言语，但也可能带来口舌是非',
  },
  '勾陈': {
    name: '勾陈',
    nature: '凶神',
    goodAspects: ['田土', '房产', '稳定'],
    badAspects: ['拖延', '阻滞', '牵连'],
    plainMeaning: '代表稳定但也有拖延、停滞的意味',
  },
  '螣蛇': {
    name: '螣蛇',
    nature: '凶神',
    goodAspects: ['变通', '灵活'],
    badAspects: ['虚惊', '怪异', '梦魇', '欺骗'],
    plainMeaning: '代表变化、意外，可能有虚惊或不确定因素',
  },
  '白虎': {
    name: '白虎',
    nature: '凶神',
    goodAspects: ['武职', '权威', '决断'],
    badAspects: ['伤病', '丧事', '血光', '官非'],
    plainMeaning: '代表果断但也有风险、压力的因素',
  },
  '玄武': {
    name: '玄武',
    nature: '凶神',
    goodAspects: ['智谋', '机密'],
    badAspects: ['小人', '盗窃', '暧昧', '欺骗'],
    plainMeaning: '代表隐秘因素，可能有小人或不明朗的情况',
  },
};

/**
 * 判断六神吉凶
 */
export function isLiuShenAuspicious(liuShen: LiuShen): boolean {
  return liuShen === '青龙';
}

/**
 * 获取六神的五行属性
 */
export const LIU_SHEN_WU_XING: Record<LiuShen, string> = {
  '青龙': '木',
  '朱雀': '火',
  '勾陈': '土',
  '螣蛇': '土',
  '白虎': '金',
  '玄武': '水',
};
