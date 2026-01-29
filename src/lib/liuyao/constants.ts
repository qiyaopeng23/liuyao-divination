/**
 * 六爻占卜系统 - 常量定义
 *
 * 包含：天干地支、五行、八卦、六十四卦、纳甲等基础数据
 * 规则来源：《增删卜易》《卜筮正宗》《周易》
 */

import type {
  TianGan, DiZhi, WuXing, BaGua, LiuQin, LiuShen,
  GuaInfo, YinYang, ProsperityState, YongShenTarget
} from './types';

// ==================== 天干地支 ====================

/** 十天干 */
export const TIAN_GAN: TianGan[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/** 十二地支 */
export const DI_ZHI: DiZhi[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 天干五行 */
export const TIAN_GAN_WU_XING: Record<TianGan, WuXing> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

/** 地支五行 */
export const DI_ZHI_WU_XING: Record<DiZhi, WuXing> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

/** 天干阴阳 */
export const TIAN_GAN_YIN_YANG: Record<TianGan, YinYang> = {
  '甲': '阳', '乙': '阴',
  '丙': '阳', '丁': '阴',
  '戊': '阳', '己': '阴',
  '庚': '阳', '辛': '阴',
  '壬': '阳', '癸': '阴',
};

/** 地支阴阳 */
export const DI_ZHI_YIN_YANG: Record<DiZhi, YinYang> = {
  '子': '阳', '丑': '阴', '寅': '阳', '卯': '阴',
  '辰': '阳', '巳': '阴', '午': '阳', '未': '阴',
  '申': '阳', '酉': '阴', '戌': '阳', '亥': '阴',
};

// ==================== 五行关系 ====================

/** 五行相生：木→火→土→金→水→木 */
export const WU_XING_SHENG: Record<WuXing, WuXing> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};

/** 五行相克：木→土→水→火→金→木 */
export const WU_XING_KE: Record<WuXing, WuXing> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

/** 五行被生 */
export const WU_XING_BEI_SHENG: Record<WuXing, WuXing> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
};

/** 五行被克 */
export const WU_XING_BEI_KE: Record<WuXing, WuXing> = {
  '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
};

// ==================== 地支关系 ====================

/** 六冲 */
export const DI_ZHI_CHONG: Record<DiZhi, DiZhi> = {
  '子': '午', '丑': '未', '寅': '申', '卯': '酉',
  '辰': '戌', '巳': '亥', '午': '子', '未': '丑',
  '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳',
};

/** 六合 */
export const DI_ZHI_HE: Record<DiZhi, DiZhi> = {
  '子': '丑', '丑': '子', '寅': '亥', '卯': '戌',
  '辰': '酉', '巳': '申', '午': '未', '未': '午',
  '申': '巳', '酉': '辰', '戌': '卯', '亥': '寅',
};

/** 三合局 - 返回合成的五行 */
export const DI_ZHI_SAN_HE: Record<string, WuXing> = {
  '申子辰': '水', '寅午戌': '火', '巳酉丑': '金', '亥卯未': '木',
};

/** 六害 */
export const DI_ZHI_HAI: Record<DiZhi, DiZhi> = {
  '子': '未', '丑': '午', '寅': '巳', '卯': '辰',
  '辰': '卯', '巳': '寅', '午': '丑', '未': '子',
  '申': '亥', '酉': '戌', '戌': '酉', '亥': '申',
};

/** 三刑 */
export const DI_ZHI_XING: Record<DiZhi, DiZhi[]> = {
  '子': ['卯'], '卯': ['子'],  // 子卯相刑（无礼之刑）
  '寅': ['巳', '申'], '巳': ['寅', '申'], '申': ['寅', '巳'],  // 寅巳申三刑（无恩之刑）
  '丑': ['戌', '未'], '戌': ['丑', '未'], '未': ['丑', '戌'],  // 丑戌未三刑（恃势之刑）
  '辰': ['辰'], '午': ['午'], '酉': ['酉'], '亥': ['亥'],  // 自刑
};

// ==================== 八卦基础数据 ====================

/** 八卦信息 */
export interface BaGuaInfo {
  /** 卦名 */
  name: BaGua;
  /** 卦象（从下到上，阳=1，阴=0） */
  binary: string;
  /** 五行 */
  wuXing: WuXing;
  /** 卦数（先天卦数） */
  number: number;
  /** 自然象征 */
  nature: string;
  /** 纳甲天干（阳卦/阴卦） */
  naJiaTianGan: { yang: TianGan; yin: TianGan };
}

/** 八卦数据 */
export const BA_GUA_DATA: Record<BaGua, BaGuaInfo> = {
  '乾': {
    name: '乾',
    binary: '111',
    wuXing: '金',
    number: 1,
    nature: '天',
    naJiaTianGan: { yang: '甲', yin: '壬' },
  },
  '兑': {
    name: '兑',
    binary: '011',
    wuXing: '金',
    number: 2,
    nature: '泽',
    naJiaTianGan: { yang: '丁', yin: '丁' },
  },
  '离': {
    name: '离',
    binary: '101',
    wuXing: '火',
    number: 3,
    nature: '火',
    naJiaTianGan: { yang: '己', yin: '己' },
  },
  '震': {
    name: '震',
    binary: '001',
    wuXing: '木',
    number: 4,
    nature: '雷',
    naJiaTianGan: { yang: '庚', yin: '庚' },
  },
  '巽': {
    name: '巽',
    binary: '110',
    wuXing: '木',
    number: 5,
    nature: '风',
    naJiaTianGan: { yang: '辛', yin: '辛' },
  },
  '坎': {
    name: '坎',
    binary: '010',
    wuXing: '水',
    number: 6,
    nature: '水',
    naJiaTianGan: { yang: '戊', yin: '戊' },
  },
  '艮': {
    name: '艮',
    binary: '100',
    wuXing: '土',
    number: 7,
    nature: '山',
    naJiaTianGan: { yang: '丙', yin: '丙' },
  },
  '坤': {
    name: '坤',
    binary: '000',
    wuXing: '土',
    number: 8,
    nature: '地',
    naJiaTianGan: { yang: '乙', yin: '癸' },
  },
};

// ==================== 纳甲地支规则 ====================

/**
 * 纳甲地支表
 * 规则来源：京房纳甲法
 *
 * 乾纳甲壬，坤纳乙癸
 * 乾：子寅辰（内卦），午申戌（外卦）- 阳顺
 * 坤：未巳卯（内卦），丑亥酉（外卦）- 阴逆
 *
 * 其他六卦：
 * 震：子寅辰（内），午申戌（外）- 同乾
 * 巽：丑亥酉（内），未巳卯（外）- 同坤反
 * 坎：寅辰午（内），申戌子（外）
 * 离：卯丑亥（内），酉未巳（外）
 * 艮：辰午申（内），戌子寅（外）
 * 兑：巳卯丑（内），亥酉未（外）
 */
export const NA_JIA_DI_ZHI: Record<BaGua, DiZhi[]> = {
  // 从初爻到六爻（位置1-6）
  '乾': ['子', '寅', '辰', '午', '申', '戌'],
  '坤': ['未', '巳', '卯', '丑', '亥', '酉'],
  '震': ['子', '寅', '辰', '午', '申', '戌'],
  '巽': ['丑', '亥', '酉', '未', '巳', '卯'],
  '坎': ['寅', '辰', '午', '申', '戌', '子'],
  '离': ['卯', '丑', '亥', '酉', '未', '巳'],
  '艮': ['辰', '午', '申', '戌', '子', '寅'],
  '兑': ['巳', '卯', '丑', '亥', '酉', '未'],
};

// ==================== 六神排列规则 ====================

/**
 * 六神起法（日干起青龙）
 * 甲乙日起青龙，丙丁日起朱雀，戊日起勾陈，己日起螣蛇，
 * 庚辛日起白虎，壬癸日起玄武
 */
export const LIU_SHEN_START: Record<TianGan, LiuShen> = {
  '甲': '青龙', '乙': '青龙',
  '丙': '朱雀', '丁': '朱雀',
  '戊': '勾陈',
  '己': '螣蛇',
  '庚': '白虎', '辛': '白虎',
  '壬': '玄武', '癸': '玄武',
};

/** 六神顺序（从初爻往上排） */
export const LIU_SHEN_ORDER: LiuShen[] = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];

// ==================== 六亲生克规则 ====================

/**
 * 六亲取法（以本卦宫五行为"我"）
 * 生我者父母，我生者子孙
 * 克我者官鬼，我克者妻财
 * 同我者兄弟
 */
export function getLiuQin(myWuXing: WuXing, targetWuXing: WuXing): LiuQin {
  if (WU_XING_BEI_SHENG[myWuXing] === targetWuXing) return '父母'; // 生我
  if (WU_XING_SHENG[myWuXing] === targetWuXing) return '子孙';     // 我生
  if (WU_XING_BEI_KE[myWuXing] === targetWuXing) return '官鬼';   // 克我
  if (WU_XING_KE[myWuXing] === targetWuXing) return '妻财';       // 我克
  return '兄弟'; // 同我
}

// ==================== 旺衰规则 ====================

/**
 * 五行旺相休囚死（按月令）
 * 当令者旺，令生者相，生令者休，克令者囚，令克者死
 */
export function getProsperityByMonth(targetWuXing: WuXing, monthWuXing: WuXing): ProsperityState {
  if (targetWuXing === monthWuXing) return '旺';
  if (WU_XING_BEI_SHENG[monthWuXing] === targetWuXing) return '相';
  if (WU_XING_SHENG[targetWuXing] === monthWuXing) return '休';
  if (WU_XING_KE[targetWuXing] === monthWuXing) return '囚';
  if (WU_XING_BEI_KE[targetWuXing] === monthWuXing) return '死';
  return '休'; // 默认
}

// ==================== 六十四卦数据 ====================

/**
 * 六十四卦完整数据
 * 按京房八宫卦序排列
 *
 * 每宫8卦：
 * 1. 本宫卦（八纯卦）
 * 2. 一世卦（初爻变）
 * 3. 二世卦（二爻变）
 * 4. 三世卦（三爻变）
 * 5. 四世卦（四爻变）
 * 6. 五世卦（五爻变）
 * 7. 游魂卦（四爻变回）
 * 8. 归魂卦（下卦全变回本宫）
 */

/** 世应位置规则（按宫内卦序） */
export const WORLD_RESPONSE_POSITIONS: Array<{ world: 1 | 2 | 3 | 4 | 5 | 6; response: 1 | 2 | 3 | 4 | 5 | 6 }> = [
  { world: 6, response: 3 },  // 本宫卦（八纯卦）
  { world: 1, response: 4 },  // 一世卦
  { world: 2, response: 5 },  // 二世卦
  { world: 3, response: 6 },  // 三世卦
  { world: 4, response: 1 },  // 四世卦
  { world: 5, response: 2 },  // 五世卦
  { world: 4, response: 1 },  // 游魂卦
  { world: 3, response: 6 },  // 归魂卦
];

/** 六十四卦数据（按二进制索引） */
export const GUA_64_DATA: Record<string, Omit<GuaInfo, 'binary'>> = {
  // ===== 乾宫 =====
  '111111': { name: '乾为天', sequence: 1, upperGua: '乾', lowerGua: '乾', palace: '乾', worldPosition: 6, responsePosition: 3, wuXing: '金' },
  '111110': { name: '天风姤', sequence: 2, upperGua: '乾', lowerGua: '巽', palace: '乾', worldPosition: 1, responsePosition: 4, wuXing: '金' },
  '111001': { name: '天山遁', sequence: 3, upperGua: '乾', lowerGua: '艮', palace: '乾', worldPosition: 2, responsePosition: 5, wuXing: '金' },
  '111000': { name: '天地否', sequence: 4, upperGua: '乾', lowerGua: '坤', palace: '乾', worldPosition: 3, responsePosition: 6, wuXing: '金' },
  '110000': { name: '风地观', sequence: 5, upperGua: '巽', lowerGua: '坤', palace: '乾', worldPosition: 4, responsePosition: 1, wuXing: '金' },
  '100000': { name: '山地剥', sequence: 6, upperGua: '艮', lowerGua: '坤', palace: '乾', worldPosition: 5, responsePosition: 2, wuXing: '金' },
  '101000': { name: '火地晋', sequence: 7, upperGua: '离', lowerGua: '坤', palace: '乾', worldPosition: 4, responsePosition: 1, wuXing: '金' },
  '101111': { name: '火天大有', sequence: 8, upperGua: '离', lowerGua: '乾', palace: '乾', worldPosition: 3, responsePosition: 6, wuXing: '金' },

  // ===== 兑宫 =====
  '011011': { name: '兑为泽', sequence: 9, upperGua: '兑', lowerGua: '兑', palace: '兑', worldPosition: 6, responsePosition: 3, wuXing: '金' },
  '011010': { name: '泽水困', sequence: 10, upperGua: '兑', lowerGua: '坎', palace: '兑', worldPosition: 1, responsePosition: 4, wuXing: '金' },
  '011000': { name: '泽地萃', sequence: 11, upperGua: '兑', lowerGua: '坤', palace: '兑', worldPosition: 2, responsePosition: 5, wuXing: '金' },
  '011100': { name: '泽山咸', sequence: 12, upperGua: '兑', lowerGua: '艮', palace: '兑', worldPosition: 3, responsePosition: 6, wuXing: '金' },
  '010100': { name: '水山蹇', sequence: 13, upperGua: '坎', lowerGua: '艮', palace: '兑', worldPosition: 4, responsePosition: 1, wuXing: '金' },
  '000100': { name: '地山谦', sequence: 14, upperGua: '坤', lowerGua: '艮', palace: '兑', worldPosition: 5, responsePosition: 2, wuXing: '金' },
  '001100': { name: '雷山小过', sequence: 15, upperGua: '震', lowerGua: '艮', palace: '兑', worldPosition: 4, responsePosition: 1, wuXing: '金' },
  '001011': { name: '雷泽归妹', sequence: 16, upperGua: '震', lowerGua: '兑', palace: '兑', worldPosition: 3, responsePosition: 6, wuXing: '金' },

  // ===== 离宫 =====
  '101101': { name: '离为火', sequence: 17, upperGua: '离', lowerGua: '离', palace: '离', worldPosition: 6, responsePosition: 3, wuXing: '火' },
  '101001': { name: '火山旅', sequence: 18, upperGua: '离', lowerGua: '艮', palace: '离', worldPosition: 1, responsePosition: 4, wuXing: '火' },
  '101110': { name: '火风鼎', sequence: 19, upperGua: '离', lowerGua: '巽', palace: '离', worldPosition: 2, responsePosition: 5, wuXing: '火' },
  '101011': { name: '火水未济', sequence: 20, upperGua: '离', lowerGua: '坎', palace: '离', worldPosition: 3, responsePosition: 6, wuXing: '火' },
  '100011': { name: '山水蒙', sequence: 21, upperGua: '艮', lowerGua: '坎', palace: '离', worldPosition: 4, responsePosition: 1, wuXing: '火' },
  '110011': { name: '风水涣', sequence: 22, upperGua: '巽', lowerGua: '坎', palace: '离', worldPosition: 5, responsePosition: 2, wuXing: '火' },
  '111011': { name: '天水讼', sequence: 23, upperGua: '乾', lowerGua: '坎', palace: '离', worldPosition: 4, responsePosition: 1, wuXing: '火' },
  '111101': { name: '天火同人', sequence: 24, upperGua: '乾', lowerGua: '离', palace: '离', worldPosition: 3, responsePosition: 6, wuXing: '火' },

  // ===== 震宫 =====
  '001001': { name: '震为雷', sequence: 25, upperGua: '震', lowerGua: '震', palace: '震', worldPosition: 6, responsePosition: 3, wuXing: '木' },
  '001000': { name: '雷地豫', sequence: 26, upperGua: '震', lowerGua: '坤', palace: '震', worldPosition: 1, responsePosition: 4, wuXing: '木' },
  '001010': { name: '雷水解', sequence: 27, upperGua: '震', lowerGua: '坎', palace: '震', worldPosition: 2, responsePosition: 5, wuXing: '木' },
  '001110': { name: '雷风恒', sequence: 28, upperGua: '震', lowerGua: '巽', palace: '震', worldPosition: 3, responsePosition: 6, wuXing: '木' },
  '000110': { name: '地风升', sequence: 29, upperGua: '坤', lowerGua: '巽', palace: '震', worldPosition: 4, responsePosition: 1, wuXing: '木' },
  '010110': { name: '水风井', sequence: 30, upperGua: '坎', lowerGua: '巽', palace: '震', worldPosition: 5, responsePosition: 2, wuXing: '木' },
  '011110': { name: '泽风大过', sequence: 31, upperGua: '兑', lowerGua: '巽', palace: '震', worldPosition: 4, responsePosition: 1, wuXing: '木' },
  '011001': { name: '泽雷随', sequence: 32, upperGua: '兑', lowerGua: '震', palace: '震', worldPosition: 3, responsePosition: 6, wuXing: '木' },

  // ===== 巽宫 =====
  '110110': { name: '巽为风', sequence: 33, upperGua: '巽', lowerGua: '巽', palace: '巽', worldPosition: 6, responsePosition: 3, wuXing: '木' },
  '110111': { name: '风天小畜', sequence: 34, upperGua: '巽', lowerGua: '乾', palace: '巽', worldPosition: 1, responsePosition: 4, wuXing: '木' },
  '110101': { name: '风火家人', sequence: 35, upperGua: '巽', lowerGua: '离', palace: '巽', worldPosition: 2, responsePosition: 5, wuXing: '木' },
  '110100': { name: '风雷益', sequence: 36, upperGua: '巽', lowerGua: '震', palace: '巽', worldPosition: 3, responsePosition: 6, wuXing: '木' },
  '111100': { name: '天雷无妄', sequence: 37, upperGua: '乾', lowerGua: '震', palace: '巽', worldPosition: 4, responsePosition: 1, wuXing: '木' },
  '101100': { name: '火雷噬嗑', sequence: 38, upperGua: '离', lowerGua: '震', palace: '巽', worldPosition: 5, responsePosition: 2, wuXing: '木' },
  '100001': { name: '山雷颐', sequence: 39, upperGua: '艮', lowerGua: '震', palace: '巽', worldPosition: 4, responsePosition: 1, wuXing: '木' },
  '100110': { name: '山风蛊', sequence: 40, upperGua: '艮', lowerGua: '巽', palace: '巽', worldPosition: 3, responsePosition: 6, wuXing: '木' },

  // ===== 坎宫 =====
  '010010': { name: '坎为水', sequence: 41, upperGua: '坎', lowerGua: '坎', palace: '坎', worldPosition: 6, responsePosition: 3, wuXing: '水' },
  '010011': { name: '水泽节', sequence: 42, upperGua: '坎', lowerGua: '兑', palace: '坎', worldPosition: 1, responsePosition: 4, wuXing: '水' },
  '010001': { name: '水雷屯', sequence: 43, upperGua: '坎', lowerGua: '震', palace: '坎', worldPosition: 2, responsePosition: 5, wuXing: '水' },
  '010101': { name: '水火既济', sequence: 44, upperGua: '坎', lowerGua: '离', palace: '坎', worldPosition: 3, responsePosition: 6, wuXing: '水' },
  '011101': { name: '泽火革', sequence: 45, upperGua: '兑', lowerGua: '离', palace: '坎', worldPosition: 4, responsePosition: 1, wuXing: '水' },
  '001101': { name: '雷火丰', sequence: 46, upperGua: '震', lowerGua: '离', palace: '坎', worldPosition: 5, responsePosition: 2, wuXing: '水' },
  '000101': { name: '地火明夷', sequence: 47, upperGua: '坤', lowerGua: '离', palace: '坎', worldPosition: 4, responsePosition: 1, wuXing: '水' },
  '000010': { name: '地水师', sequence: 48, upperGua: '坤', lowerGua: '坎', palace: '坎', worldPosition: 3, responsePosition: 6, wuXing: '水' },

  // ===== 艮宫 =====
  '100100': { name: '艮为山', sequence: 49, upperGua: '艮', lowerGua: '艮', palace: '艮', worldPosition: 6, responsePosition: 3, wuXing: '土' },
  '100101': { name: '山火贲', sequence: 50, upperGua: '艮', lowerGua: '离', palace: '艮', worldPosition: 1, responsePosition: 4, wuXing: '土' },
  '100111': { name: '山天大畜', sequence: 51, upperGua: '艮', lowerGua: '乾', palace: '艮', worldPosition: 2, responsePosition: 5, wuXing: '土' },
  '100010': { name: '山泽损', sequence: 52, upperGua: '艮', lowerGua: '兑', palace: '艮', worldPosition: 3, responsePosition: 6, wuXing: '土' },
  '101010': { name: '火泽睽', sequence: 53, upperGua: '离', lowerGua: '兑', palace: '艮', worldPosition: 4, responsePosition: 1, wuXing: '土' },
  '111010': { name: '天泽履', sequence: 54, upperGua: '乾', lowerGua: '兑', palace: '艮', worldPosition: 5, responsePosition: 2, wuXing: '土' },
  '110010': { name: '风泽中孚', sequence: 55, upperGua: '巽', lowerGua: '兑', palace: '艮', worldPosition: 4, responsePosition: 1, wuXing: '土' },
  '110001': { name: '风山渐', sequence: 56, upperGua: '巽', lowerGua: '艮', palace: '艮', worldPosition: 3, responsePosition: 6, wuXing: '土' },

  // ===== 坤宫 =====
  '000000': { name: '坤为地', sequence: 57, upperGua: '坤', lowerGua: '坤', palace: '坤', worldPosition: 6, responsePosition: 3, wuXing: '土' },
  '000001': { name: '地雷复', sequence: 58, upperGua: '坤', lowerGua: '震', palace: '坤', worldPosition: 1, responsePosition: 4, wuXing: '土' },
  '000011': { name: '地泽临', sequence: 59, upperGua: '坤', lowerGua: '兑', palace: '坤', worldPosition: 2, responsePosition: 5, wuXing: '土' },
  '000111': { name: '地天泰', sequence: 60, upperGua: '坤', lowerGua: '乾', palace: '坤', worldPosition: 3, responsePosition: 6, wuXing: '土' },
  '001111': { name: '雷天大壮', sequence: 61, upperGua: '震', lowerGua: '乾', palace: '坤', worldPosition: 4, responsePosition: 1, wuXing: '土' },
  '011111': { name: '泽天夬', sequence: 62, upperGua: '兑', lowerGua: '乾', palace: '坤', worldPosition: 5, responsePosition: 2, wuXing: '土' },
  '010111': { name: '水天需', sequence: 63, upperGua: '坎', lowerGua: '乾', palace: '坤', worldPosition: 4, responsePosition: 1, wuXing: '土' },
  '010000': { name: '水地比', sequence: 64, upperGua: '坎', lowerGua: '坤', palace: '坤', worldPosition: 3, responsePosition: 6, wuXing: '土' },
};
// ==================== 用神取法规则 ====================

/**
 * 用神取法表（按问事类别）
 * 来源：《增删卜易》
 */
export const YONG_SHEN_RULES: Record<string, { primary: YongShenTarget; secondary?: YongShenTarget; description: string }> = {
  // 事业工作
  'career_job': { primary: '官鬼', description: '求官、求职以官鬼为用神' },
  'career_business': { primary: '妻财', description: '经商求财以妻财为用神' },
  'career_promotion': { primary: '官鬼', description: '升迁以官鬼为用神' },
  'career_interview': { primary: '官鬼', description: '面试以官鬼为用神' },

  // 感情婚姻
  'love_male': { primary: '妻财', description: '男问婚姻以妻财为用神' },
  'love_female': { primary: '官鬼', description: '女问婚姻以官鬼为用神' },
  'love_relationship': { primary: '应爻', secondary: '世爻', description: '问感情发展以应爻为对方' },

  // 财运
  'wealth_general': { primary: '妻财', description: '求财以妻财为用神' },
  'wealth_investment': { primary: '妻财', description: '投资以妻财为用神' },
  'wealth_business': { primary: '妻财', description: '生意以妻财为用神' },

  // 健康
  'health_self': { primary: '世爻', secondary: '官鬼', description: '自己问病以世爻为主，官鬼为病' },
  'health_other': { primary: '用神', secondary: '官鬼', description: '代问病以六亲用神为主，官鬼为病' },

  // 学业
  'study_exam': { primary: '父母', secondary: '官鬼', description: '考试以父母为用神（文书），官鬼次之' },
  'study_learning': { primary: '父母', description: '学习以父母为用神' },

  // 诉讼
  'lawsuit_plaintiff': { primary: '世爻', secondary: '官鬼', description: '原告以世爻为自己，官鬼为官司' },
  'lawsuit_defendant': { primary: '世爻', secondary: '子孙', description: '被告以世爻为自己，子孙制官为吉' },

  // 出行
  'travel_self': { primary: '世爻', description: '自己出行以世爻为用神' },
  'travel_safety': { primary: '世爻', secondary: '官鬼', description: '问出行安全以世爻为主，官鬼为险' },

  // 失物
  'lost_item': { primary: '妻财', description: '寻物以妻财为用神' },
  'lost_person': { primary: '用神', description: '寻人以六亲用神（如子孙、父母等）' },

  // 其他
  'other_general': { primary: '世爻', description: '杂占以世爻为主' },
};

// ==================== 月令对应 ====================

/** 月支对应（正月寅、二月卯...） */
export const MONTH_ZHI: DiZhi[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

/** 时辰对应（子时 23:00-01:00...） */
export const HOUR_ZHI: DiZhi[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// ==================== 十二长生 ====================

/** 十二长生顺序 */
export const TWELVE_STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'] as const;

/**
 * 五行十二长生起点（阳干顺行，阴干逆行）
 * 甲木长生在亥，乙木长生在午
 * 丙火长生在寅，丁火长生在酉
 * 戊土长生在寅，己土长生在酉
 * 庚金长生在巳，辛金长生在子
 * 壬水长生在申，癸水长生在卯
 */
export const WU_XING_CHANG_SHENG_START: Record<WuXing, { yang: DiZhi; yin: DiZhi }> = {
  '木': { yang: '亥', yin: '午' },
  '火': { yang: '寅', yin: '酉' },
  '土': { yang: '寅', yin: '酉' }, // 土寄火
  '金': { yang: '巳', yin: '子' },
  '水': { yang: '申', yin: '卯' },
};
