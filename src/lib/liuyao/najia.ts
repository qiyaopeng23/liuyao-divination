/**
 * 纳甲装卦模块
 *
 * 纳甲：将天干地支纳入卦中
 * 六亲：根据卦宫五行与爻五行的生克关系确定
 *
 * 规则来源：京房纳甲法《京氏易传》
 */

import type {
  YaoState, YaoInfo, BaGua, DiZhi, WuXing, LiuQin, GuaInfo,
  YinYang, TianGan, ChangedYaoInfo,
} from './types';
import {
  BA_GUA_DATA, NA_JIA_DI_ZHI, DI_ZHI_WU_XING,
  getLiuQin, DI_ZHI, TIAN_GAN,
} from './constants';

// ==================== 纳甲规则 ====================

/**
 * 获取单卦（经卦）的纳甲地支
 *
 * 规则：
 * - 乾卦内卦纳子寅辰，外卦纳午申戌
 * - 坤卦内卦纳未巳卯，外卦纳丑亥酉
 * - 其他各卦按《京氏易传》规则
 *
 * @param gua 单卦名
 * @param position 爻位（1-6）
 * @param isUpper 是否为外卦（上卦）
 */
export function getNaJiaDiZhi(gua: BaGua, position: 1 | 2 | 3 | 4 | 5 | 6): DiZhi {
  const diZhiArray = NA_JIA_DI_ZHI[gua];
  return diZhiArray[position - 1];
}

/**
 * 获取整卦的纳甲地支（六爻）
 *
 * @param lowerGua 下卦（内卦）
 * @param upperGua 上卦（外卦）
 */
export function getFullNaJiaDiZhi(lowerGua: BaGua, upperGua: BaGua): DiZhi[] {
  const lower = NA_JIA_DI_ZHI[lowerGua].slice(0, 3);
  const upper = NA_JIA_DI_ZHI[upperGua].slice(3, 6);
  return [...lower, ...upper];
}

/**
 * 获取纳甲天干
 *
 * 规则：
 * - 乾纳甲壬（内甲外壬）
 * - 坤纳乙癸（内乙外癸）
 * - 其他卦的天干较少使用，但完整规则：
 *   - 震纳庚
 *   - 巽纳辛
 *   - 坎纳戊
 *   - 离纳己
 *   - 艮纳丙
 *   - 兑纳丁
 */
export function getNaJiaTianGan(gua: BaGua, isUpper: boolean): TianGan {
  const guaData = BA_GUA_DATA[gua];

  if (gua === '乾') {
    return isUpper ? '壬' : '甲';
  }
  if (gua === '坤') {
    return isUpper ? '癸' : '乙';
  }

  // 其他卦内外卦天干相同
  return guaData.naJiaTianGan.yang;
}

// ==================== 六亲计算 ====================

/**
 * 计算六亲
 *
 * 规则（以卦宫五行为"我"）：
 * - 生我者父母（如我木，水生木，水为父母）
 * - 我生者子孙（如我木，木生火，火为子孙）
 * - 克我者官鬼（如我木，金克木，金为官鬼）
 * - 我克者妻财（如我木，木克土，土为妻财）
 * - 同我者兄弟（如我木，木为兄弟）
 *
 * @param palaceWuXing 卦宫五行
 * @param yaoWuXing 爻的五行（通过纳甲地支确定）
 */
export function calculateLiuQin(palaceWuXing: WuXing, yaoWuXing: WuXing): LiuQin {
  return getLiuQin(palaceWuXing, yaoWuXing);
}

// ==================== 完整装卦 ====================

/**
 * 完整装卦：为六爻添加纳甲、六亲等信息
 *
 * @param yaoStates 六爻状态（从下到上）
 * @param guaInfo 卦的基本信息
 * @param dayGan 日干（用于六神）- 可选
 */
export function installHexagram(
  yaoStates: [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState],
  guaInfo: GuaInfo,
): YaoInfo[] {
  const { lowerGua, upperGua, palace, worldPosition, responsePosition, wuXing: palaceWuXing } = guaInfo;

  // 获取完整纳甲地支
  const naJiaDiZhi = getFullNaJiaDiZhi(lowerGua, upperGua);

  // 装卦
  const yaoInfos: YaoInfo[] = yaoStates.map((yaoState, index) => {
    const position = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    const diZhi = naJiaDiZhi[index];
    const yaoWuXing = DI_ZHI_WU_XING[diZhi];

    // 计算六亲
    const liuQin = calculateLiuQin(palaceWuXing, yaoWuXing);

    // 确定世应
    const isWorld = position === worldPosition;
    const isResponse = position === responsePosition;

    // 获取天干（主要用于世爻）
    const isUpper = position > 3;
    const currentGua = isUpper ? upperGua : lowerGua;
    const tianGan = getNaJiaTianGan(currentGua, isUpper);

    // 变爻信息（如果是动爻）
    let changedYao: ChangedYaoInfo | undefined;
    if (yaoState.isMoving) {
      changedYao = calculateChangedYao(yaoState, position, guaInfo);
    }

    return {
      ...yaoState,
      position,
      diZhi,
      tianGan,
      wuXing: yaoWuXing,
      liuQin,
      liuShen: '青龙', // 六神后续由专门模块设置
      isWorld,
      isResponse,
      changedYao,
      isVoid: false, // 空亡后续设置
      isDayBroken: false, // 日破后续设置
      isMonthBroken: false, // 月破后续设置
    };
  });

  return yaoInfos;
}

/**
 * 计算变爻信息
 */
function calculateChangedYao(
  yaoState: YaoState,
  position: 1 | 2 | 3 | 4 | 5 | 6,
  guaInfo: GuaInfo,
): ChangedYaoInfo {
  // 动爻变化后的阴阳
  const changedYinYang: YinYang = yaoState.yinYang === '阳' ? '阴' : '阳';

  // 获取变卦后该爻的纳甲地支
  // 需要重新计算变卦的上下卦
  const binary = guaInfo.binary;
  const changedBinary = binary
    .split('')
    .map((char, idx) => {
      if (idx === position - 1) {
        return char === '1' ? '0' : '1';
      }
      return char;
    })
    .join('');

  // 从变卦获取纳甲地支
  const changedLowerBinary = changedBinary.slice(0, 3);
  const changedUpperBinary = changedBinary.slice(3, 6);
  const changedLowerGua = binaryToGua(changedLowerBinary);
  const changedUpperGua = binaryToGua(changedUpperBinary);

  const isUpper = position > 3;
  const changedGua = isUpper ? changedUpperGua : changedLowerGua;
  const changedDiZhi = getNaJiaDiZhi(changedGua, position);
  const changedWuXing = DI_ZHI_WU_XING[changedDiZhi];
  const changedLiuQin = calculateLiuQin(guaInfo.wuXing, changedWuXing);

  // 判断变化类型
  const originalDiZhi = getFullNaJiaDiZhi(guaInfo.lowerGua, guaInfo.upperGua)[position - 1];
  const changeType = determineChangeType(originalDiZhi, changedDiZhi, guaInfo.wuXing);

  return {
    yinYang: changedYinYang,
    diZhi: changedDiZhi,
    wuXing: changedWuXing,
    liuQin: changedLiuQin,
    changeType,
  };
}

/**
 * 二进制转八卦
 */
function binaryToGua(binary: string): BaGua {
  const guaMap: Record<string, BaGua> = {
    '111': '乾', '011': '兑', '101': '离', '001': '震',
    '110': '巽', '010': '坎', '100': '艮', '000': '坤',
  };
  return guaMap[binary];
}

/**
 * 判断变化类型
 */
function determineChangeType(
  originalDiZhi: DiZhi,
  changedDiZhi: DiZhi,
  palaceWuXing: WuXing,
): ChangedYaoInfo['changeType'] {
  const originalIdx = DI_ZHI.indexOf(originalDiZhi);
  const changedIdx = DI_ZHI.indexOf(changedDiZhi);

  // 化进神：地支进一位
  if ((changedIdx - originalIdx + 12) % 12 === 1) {
    return 'advance';
  }

  // 化退神：地支退一位
  if ((originalIdx - changedIdx + 12) % 12 === 1) {
    return 'retreat';
  }

  // 判断回头生克
  const originalWuXing = DI_ZHI_WU_XING[originalDiZhi];
  const changedWuXing = DI_ZHI_WU_XING[changedDiZhi];

  // 检查变爻对原爻的生克
  const originalLiuQin = getLiuQin(originalWuXing, changedWuXing);
  if (originalLiuQin === '父母') {
    return 'return_birth'; // 变爻生原爻
  }
  if (originalLiuQin === '官鬼') {
    return 'return_clash'; // 变爻克原爻
  }

  return 'normal';
}

/**
 * 获取变卦的完整六爻信息
 */
export function getChangedYaoInfos(
  originalYaoInfos: YaoInfo[],
  changedGuaInfo: GuaInfo,
): YaoInfo[] {
  const { lowerGua, upperGua, palace, worldPosition, responsePosition, wuXing: palaceWuXing } = changedGuaInfo;
  const naJiaDiZhi = getFullNaJiaDiZhi(lowerGua, upperGua);

  return originalYaoInfos.map((originalYao, index) => {
    const position = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;

    // 如果是动爻，使用变化后的状态
    const yinYang = originalYao.isMoving
      ? (originalYao.yinYang === '阳' ? '阴' : '阳')
      : originalYao.yinYang;

    const diZhi = naJiaDiZhi[index];
    const yaoWuXing = DI_ZHI_WU_XING[diZhi];
    const liuQin = calculateLiuQin(palaceWuXing, yaoWuXing);

    const isUpper = position > 3;
    const currentGua = isUpper ? upperGua : lowerGua;
    const tianGan = getNaJiaTianGan(currentGua, isUpper);

    return {
      ...originalYao,
      yinYang: yinYang as YinYang,
      position,
      diZhi,
      tianGan,
      wuXing: yaoWuXing,
      liuQin,
      isWorld: position === worldPosition,
      isResponse: position === responsePosition,
      changedYao: undefined, // 变卦没有再变
    };
  });
}

/**
 * 查找特定六亲所在的爻位
 */
export function findYaoByLiuQin(yaoInfos: YaoInfo[], liuQin: LiuQin): YaoInfo[] {
  return yaoInfos.filter(yao => yao.liuQin === liuQin);
}

/**
 * 获取世爻
 */
export function getWorldYao(yaoInfos: YaoInfo[]): YaoInfo {
  const worldYao = yaoInfos.find(yao => yao.isWorld);
  if (!worldYao) {
    throw new Error('未找到世爻');
  }
  return worldYao;
}

/**
 * 获取应爻
 */
export function getResponseYao(yaoInfos: YaoInfo[]): YaoInfo {
  const responseYao = yaoInfos.find(yao => yao.isResponse);
  if (!responseYao) {
    throw new Error('未找到应爻');
  }
  return responseYao;
}
