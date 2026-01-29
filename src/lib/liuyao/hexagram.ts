/**
 * 卦象生成模块
 *
 * 支持三种起卦方式：
 * 1. 三枚铜钱法（最推荐）
 * 2. 时间起卦
 * 3. 手动输入
 *
 * 规则来源：《周易》《增删卜易》
 */

import type {
  YaoState, YaoType, YinYang, BaGua, GuaInfo,
  CastingInput, CastingMethod,
} from './types';
import { BA_GUA_DATA, GUA_64_DATA } from './constants';
import { getGanZhiTime, getDiZhiIndex } from './ganzhi';

// ==================== 铜钱法 ====================

/**
 * 模拟一枚铜钱的投掷
 * 字（有字的一面）= 2分
 * 背（无字的一面）= 3分
 *
 * 注意：这是确定性的模拟，实际应用时使用 window.crypto 获取真随机数
 */
export function flipCoin(): 2 | 3 {
  // 使用crypto获取安全随机数
  const randomValue = typeof crypto !== 'undefined'
    ? crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1)
    : Math.random();

  return randomValue < 0.5 ? 2 : 3;
}

/**
 * 投掷三枚铜钱，计算爻象
 *
 * 规则：
 * 6 = 3+3+0 = 老阴（变爻）
 * 7 = 2+3+2 = 少阳（不变）
 * 8 = 2+2+4 = 少阴（不变）
 * 9 = 2+2+5 = 老阳（变爻）
 *
 * 实际是三枚铜钱的点数之和：
 * 6 = 2+2+2（三字）= 老阴
 * 7 = 2+2+3（二字一背）= 少阳
 * 8 = 2+3+3（一字二背）= 少阴
 * 9 = 3+3+3（三背）= 老阳
 */
export function throwCoins(): { sum: number; yaoState: YaoState } {
  const coins = [flipCoin(), flipCoin(), flipCoin()];
  const sum = coins.reduce<number>((a, b) => a + b, 0) as 6 | 7 | 8 | 9;

  return {
    sum,
    yaoState: coinSumToYaoState(sum),
  };
}

/**
 * 铜钱点数转换为爻状态
 */
export function coinSumToYaoState(sum: 6 | 7 | 8 | 9): YaoState {
  switch (sum) {
    case 6:
      return {
        yinYang: '阴',
        isMoving: true,
        type: 'old_yin',
        coinResult: 6,
      };
    case 7:
      return {
        yinYang: '阳',
        isMoving: false,
        type: 'young_yang',
        coinResult: 7,
      };
    case 8:
      return {
        yinYang: '阴',
        isMoving: false,
        type: 'young_yin',
        coinResult: 8,
      };
    case 9:
      return {
        yinYang: '阳',
        isMoving: true,
        type: 'old_yang',
        coinResult: 9,
      };
  }
}

/**
 * 完整的六次投币，生成六爻
 */
export function castByCoin(): [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState] {
  return [
    throwCoins().yaoState,
    throwCoins().yaoState,
    throwCoins().yaoState,
    throwCoins().yaoState,
    throwCoins().yaoState,
    throwCoins().yaoState,
  ];
}

// ==================== 时间起卦 ====================

/**
 * 时间起卦算法
 *
 * 这里采用一种改良的时间起卦法，映射到六爻体系：
 *
 * 算法说明：
 * 1. 上卦：年数 + 月数 + 日数，除8取余（1-8对应八卦）
 * 2. 下卦：年数 + 月数 + 日数 + 时数，除8取余
 * 3. 动爻：上述总数除6取余（1-6对应六爻位置）
 *
 * 年数：地支数（子=1, 丑=2, ...亥=12）
 * 月数：农历月份
 * 日数：农历日期
 * 时数：地支数
 *
 * 注意：这是一种映射方法，不同典籍可能有不同算法
 * 用户可以选择是否采用此方法
 */
export function castByTime(date: Date): [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState] {
  const ganZhi = getGanZhiTime(date);

  // 使用地支数代替农历
  const yearNum = getDiZhiIndex(ganZhi.year.zhi) + 1; // 1-12
  const monthNum = getDiZhiIndex(ganZhi.month.zhi) + 1; // 1-12
  const dayNum = date.getDate(); // 1-31
  const hourNum = getDiZhiIndex(ganZhi.hour.zhi) + 1; // 1-12

  // 计算上下卦
  const upperSum = yearNum + monthNum + dayNum;
  const lowerSum = upperSum + hourNum;

  // 取余得卦数（1-8）
  const upperGuaNum = ((upperSum - 1) % 8) + 1;
  const lowerGuaNum = ((lowerSum - 1) % 8) + 1;

  // 动爻位置（1-6）
  const movingPosition = ((lowerSum - 1) % 6) + 1;

  // 数字转八卦（先天八卦数）
  const numToBaGua: Record<number, BaGua> = {
    1: '乾', 2: '兑', 3: '离', 4: '震',
    5: '巽', 6: '坎', 7: '艮', 8: '坤',
  };

  const upperGua = numToBaGua[upperGuaNum];
  const lowerGua = numToBaGua[lowerGuaNum];

  // 根据卦象生成六爻
  const upperBinary = BA_GUA_DATA[upperGua].binary;
  const lowerBinary = BA_GUA_DATA[lowerGua].binary;
  const fullBinary = lowerBinary + upperBinary; // 从下到上

  // 转换为爻状态
  const yaoStates: YaoState[] = [];
  for (let i = 0; i < 6; i++) {
    const isYang = fullBinary[i] === '1';
    const isMoving = (i + 1) === movingPosition;

    let type: YaoType;
    if (isYang && isMoving) {
      type = 'old_yang';
    } else if (isYang && !isMoving) {
      type = 'young_yang';
    } else if (!isYang && isMoving) {
      type = 'old_yin';
    } else {
      type = 'young_yin';
    }

    yaoStates.push({
      yinYang: isYang ? '阳' : '阴',
      isMoving,
      type,
    });
  }

  return yaoStates as [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState];
}

// ==================== 手动输入 ====================

/**
 * 手动创建爻状态
 */
export function createManualYaoState(yinYang: YinYang, isMoving: boolean): YaoState {
  let type: YaoType;
  if (yinYang === '阳' && isMoving) {
    type = 'old_yang';
  } else if (yinYang === '阳' && !isMoving) {
    type = 'young_yang';
  } else if (yinYang === '阴' && isMoving) {
    type = 'old_yin';
  } else {
    type = 'young_yin';
  }

  return {
    yinYang,
    isMoving,
    type,
  };
}

// ==================== 卦象解析 ====================

/**
 * 从六爻状态获取本卦
 */
export function getGuaFromYaoStates(
  yaoStates: [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState]
): GuaInfo {
  // 转换为二进制字符串（从下到上）
  const binary = yaoStates
    .map(y => y.yinYang === '阳' ? '1' : '0')
    .join('');

  const guaData = GUA_64_DATA[binary];
  if (!guaData) {
    throw new Error(`未找到对应卦象: ${binary}`);
  }

  return {
    ...guaData,
    binary,
  };
}

/**
 * 获取变卦
 * 动爻阴阳互变
 */
export function getChangedGua(
  yaoStates: [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState]
): GuaInfo | null {
  // 检查是否有动爻
  const hasMoving = yaoStates.some(y => y.isMoving);
  if (!hasMoving) {
    return null;
  }

  // 动爻变化
  const changedBinary = yaoStates
    .map(y => {
      if (y.isMoving) {
        // 动爻阴阳互换
        return y.yinYang === '阳' ? '0' : '1';
      }
      return y.yinYang === '阳' ? '1' : '0';
    })
    .join('');

  const guaData = GUA_64_DATA[changedBinary];
  if (!guaData) {
    throw new Error(`未找到对应变卦: ${changedBinary}`);
  }

  return {
    ...guaData,
    binary: changedBinary,
  };
}

/**
 * 获取互卦
 * 取本卦2、3、4爻为下卦，3、4、5爻为上卦
 */
export function getMutualGua(
  yaoStates: [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState]
): GuaInfo {
  // 互卦下卦：2、3、4爻（索引1、2、3）
  // 互卦上卦：3、4、5爻（索引2、3、4）
  const lowerBinary = [
    yaoStates[1].yinYang === '阳' ? '1' : '0',
    yaoStates[2].yinYang === '阳' ? '1' : '0',
    yaoStates[3].yinYang === '阳' ? '1' : '0',
  ].join('');

  const upperBinary = [
    yaoStates[2].yinYang === '阳' ? '1' : '0',
    yaoStates[3].yinYang === '阳' ? '1' : '0',
    yaoStates[4].yinYang === '阳' ? '1' : '0',
  ].join('');

  const binary = lowerBinary + upperBinary;
  const guaData = GUA_64_DATA[binary];

  return {
    ...guaData,
    binary,
  };
}

/**
 * 获取错卦
 * 所有爻阴阳互换
 */
export function getOppositeGua(
  yaoStates: [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState]
): GuaInfo {
  const binary = yaoStates
    .map(y => y.yinYang === '阳' ? '0' : '1')
    .join('');

  const guaData = GUA_64_DATA[binary];

  return {
    ...guaData,
    binary,
  };
}

/**
 * 获取综卦
 * 上下颠倒（翻转）
 */
export function getReverseGua(
  yaoStates: [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState]
): GuaInfo {
  const binary = [...yaoStates]
    .reverse()
    .map(y => y.yinYang === '阳' ? '1' : '0')
    .join('');

  const guaData = GUA_64_DATA[binary];

  return {
    ...guaData,
    binary,
  };
}

/**
 * 获取动爻位置列表
 */
export function getMovingPositions(
  yaoStates: [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState]
): number[] {
  return yaoStates
    .map((y, i) => y.isMoving ? i + 1 : 0)
    .filter(pos => pos > 0);
}

/**
 * 根据八卦名获取二进制
 */
export function getBaGuaBinary(gua: BaGua): string {
  return BA_GUA_DATA[gua].binary;
}

/**
 * 根据二进制获取八卦名
 */
export function getBaGuaFromBinary(binary: string): BaGua {
  const entry = Object.entries(BA_GUA_DATA).find(([_, data]) => data.binary === binary);
  if (!entry) {
    throw new Error(`无效的八卦二进制: ${binary}`);
  }
  return entry[0] as BaGua;
}

/**
 * 获取上卦（外卦）
 */
export function getUpperGua(binary: string): BaGua {
  return getBaGuaFromBinary(binary.slice(3));
}

/**
 * 获取下卦（内卦）
 */
export function getLowerGua(binary: string): BaGua {
  return getBaGuaFromBinary(binary.slice(0, 3));
}
