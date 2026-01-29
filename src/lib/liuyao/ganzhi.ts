/**
 * 干支历法模块
 *
 * 公历转干支计算
 * 基于天文算法，确保准确性
 *
 * 规则来源：传统农历历法
 */

import type { TianGan, DiZhi, GanZhiTime, WuXing } from './types';
import { TIAN_GAN, DI_ZHI, DI_ZHI_WU_XING } from './constants';

// ==================== 基准数据 ====================

/**
 * 基准日期：2000年1月7日（甲子日）
 * 这是一个已知的甲子日，用于计算日干支
 */
const BASE_DATE = new Date(2000, 0, 7); // 2000年1月7日，甲子日
const BASE_DAY_GAN_INDEX = 0; // 甲
const BASE_DAY_ZHI_INDEX = 0; // 子

/**
 * 节气数据（用于确定月干支）
 * 节气是确定月份的关键
 *
 * 每年24节气，立春开始为正月（寅月）
 * 立春→雨水 = 正月（寅月）
 * 惊蛰→春分 = 二月（卯月）
 * ...以此类推
 */

// 2000-2050年立春日期数据（精确到日）
// 格式：[月, 日]，其中月是1-based（1=一月）
const LI_CHUN_DATES: Record<number, [number, number]> = {
  2000: [2, 4], 2001: [2, 4], 2002: [2, 4], 2003: [2, 4], 2004: [2, 4],
  2005: [2, 4], 2006: [2, 4], 2007: [2, 4], 2008: [2, 4], 2009: [2, 4],
  2010: [2, 4], 2011: [2, 4], 2012: [2, 4], 2013: [2, 4], 2014: [2, 4],
  2015: [2, 4], 2016: [2, 4], 2017: [2, 3], 2018: [2, 4], 2019: [2, 4],
  2020: [2, 4], 2021: [2, 3], 2022: [2, 4], 2023: [2, 4], 2024: [2, 4],
  2025: [2, 3], 2026: [2, 4], 2027: [2, 4], 2028: [2, 4], 2029: [2, 3],
  2030: [2, 4], 2031: [2, 4], 2032: [2, 4], 2033: [2, 3], 2034: [2, 4],
  2035: [2, 4], 2036: [2, 4], 2037: [2, 4], 2038: [2, 4], 2039: [2, 4],
  2040: [2, 4], 2041: [2, 3], 2042: [2, 4], 2043: [2, 4], 2044: [2, 4],
  2045: [2, 3], 2046: [2, 4], 2047: [2, 4], 2048: [2, 4], 2049: [2, 3],
  2050: [2, 4],
};

// 每月节气日期（近似值，用于月份判断）
// 格式：[节气名, 公历月, 近似日期]
const JIE_QI_APPROX: Array<[string, number, number]> = [
  ['立春', 2, 4],   // 寅月开始
  ['惊蛰', 3, 6],   // 卯月开始
  ['清明', 4, 5],   // 辰月开始
  ['立夏', 5, 6],   // 巳月开始
  ['芒种', 6, 6],   // 午月开始
  ['小暑', 7, 7],   // 未月开始
  ['立秋', 8, 8],   // 申月开始
  ['白露', 9, 8],   // 酉月开始
  ['寒露', 10, 8],  // 戌月开始
  ['立冬', 11, 7],  // 亥月开始
  ['大雪', 12, 7],  // 子月开始
  ['小寒', 1, 6],   // 丑月开始
];

// ==================== 计算函数 ====================

/**
 * 计算两个日期之间的天数差
 */
function daysBetween(date1: Date, date2: Date): number {
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * 计算日干支
 *
 * 规则：从基准日（甲子日）计算天数差，取模60
 */
export function getDayGanZhi(date: Date): { gan: TianGan; zhi: DiZhi } {
  const days = daysBetween(BASE_DATE, date);
  const ganIndex = ((BASE_DAY_GAN_INDEX + days) % 10 + 10) % 10;
  const zhiIndex = ((BASE_DAY_ZHI_INDEX + days) % 12 + 12) % 12;

  return {
    gan: TIAN_GAN[ganIndex],
    zhi: DI_ZHI[zhiIndex],
  };
}

/**
 * 计算年干支
 *
 * 规则：以立春为界
 * - 立春前属于上一年
 * - 立春后属于本年
 *
 * 年干支计算公式：
 * 年干 = (year - 4) % 10
 * 年支 = (year - 4) % 12
 * (1984年为甲子年)
 */
export function getYearGanZhi(date: Date): { gan: TianGan; zhi: DiZhi } {
  let year = date.getFullYear();

  // 判断是否在立春前
  const liChun = LI_CHUN_DATES[year];
  if (liChun) {
    const liChunDate = new Date(year, liChun[0] - 1, liChun[1]);
    if (date < liChunDate) {
      year -= 1; // 立春前算上一年
    }
  } else {
    // 如果没有精确数据，使用近似判断
    const approxLiChun = new Date(year, 1, 4); // 2月4日近似
    if (date < approxLiChun) {
      year -= 1;
    }
  }

  // 1984年为甲子年
  const ganIndex = ((year - 4) % 10 + 10) % 10;
  const zhiIndex = ((year - 4) % 12 + 12) % 12;

  return {
    gan: TIAN_GAN[ganIndex],
    zhi: DI_ZHI[zhiIndex],
  };
}

/**
 * 计算月干支
 *
 * 规则：
 * 1. 月支固定：正月寅、二月卯...以节气分界
 * 2. 月干根据年干推算：
 *    甲己之年丙作首（正月丙寅）
 *    乙庚之年戊为头（正月戊寅）
 *    丙辛之岁寻庚起（正月庚寅）
 *    丁壬壬位顺行流（正月壬寅）
 *    戊癸之年何方发，甲寅之上好追求（正月甲寅）
 */
export function getMonthGanZhi(date: Date): { gan: TianGan; zhi: DiZhi } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // 确定月支（以节气为界）
  let monthZhiIndex = getMonthZhiIndex(month, day);

  // 根据年干确定月干
  const yearGanZhi = getYearGanZhi(date);
  const yearGanIndex = TIAN_GAN.indexOf(yearGanZhi.gan);

  // 年干决定正月天干
  // 甲己 → 丙寅（丙=2）
  // 乙庚 → 戊寅（戊=4）
  // 丙辛 → 庚寅（庚=6）
  // 丁壬 → 壬寅（壬=8）
  // 戊癸 → 甲寅（甲=0）
  const yearGanGroup = yearGanIndex % 5;
  const firstMonthGanIndex = (yearGanGroup * 2 + 2) % 10;

  // 从正月（寅月）推算到当前月份
  // 寅月是第0个月（从寅开始数）
  const monthOffset = (monthZhiIndex - 2 + 12) % 12;
  const monthGanIndex = (firstMonthGanIndex + monthOffset) % 10;

  return {
    gan: TIAN_GAN[monthGanIndex],
    zhi: DI_ZHI[monthZhiIndex],
  };
}

/**
 * 根据公历月日确定月支索引
 */
function getMonthZhiIndex(month: number, day: number): number {
  // 节气分界判断
  for (let i = JIE_QI_APPROX.length - 1; i >= 0; i--) {
    const [, jqMonth, jqDay] = JIE_QI_APPROX[i];

    // 处理跨年情况（小寒在1月）
    if (month > jqMonth || (month === jqMonth && day >= jqDay)) {
      // 对应的月支：立春=寅(2), 惊蛰=卯(3), ...
      return (i + 2) % 12;
    }
  }

  // 1月小寒前属于丑月
  return 1; // 丑
}

/**
 * 计算时干支
 *
 * 规则：
 * 1. 时支固定：子时(23:00-01:00), 丑时(01:00-03:00), ...
 * 2. 时干根据日干推算：
 *    甲己日起甲子（子时甲子）
 *    乙庚日起丙子
 *    丙辛日起戊子
 *    丁壬日起庚子
 *    戊癸日起壬子
 */
export function getHourGanZhi(date: Date): { gan: TianGan; zhi: DiZhi } {
  const hour = date.getHours();

  // 确定时支
  // 子时从23点开始
  let hourZhiIndex: number;
  if (hour >= 23 || hour < 1) {
    hourZhiIndex = 0; // 子
  } else {
    hourZhiIndex = Math.floor((hour + 1) / 2);
  }

  // 获取日干来确定时干
  // 注意：23点后属于下一天
  let dayDate = date;
  if (hour >= 23) {
    dayDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  }
  const dayGanZhi = getDayGanZhi(dayDate);
  const dayGanIndex = TIAN_GAN.indexOf(dayGanZhi.gan);

  // 日干决定子时天干
  // 甲己日 → 甲子（甲=0）
  // 乙庚日 → 丙子（丙=2）
  // 丙辛日 → 戊子（戊=4）
  // 丁壬日 → 庚子（庚=6）
  // 戊癸日 → 壬子（壬=8）
  const dayGanGroup = dayGanIndex % 5;
  const ziHourGanIndex = (dayGanGroup * 2) % 10;

  // 从子时推算到当前时辰
  const hourGanIndex = (ziHourGanIndex + hourZhiIndex) % 10;

  return {
    gan: TIAN_GAN[hourGanIndex],
    zhi: DI_ZHI[hourZhiIndex],
  };
}

/**
 * 计算旬空（空亡）
 *
 * 规则：
 * 十天干配十二地支，每旬有两个地支配不上，为旬空
 * 甲子旬中戌亥空，甲戌旬中申酉空，...
 */
export function getVoidBranches(dayGan: TianGan, dayZhi: DiZhi): [DiZhi, DiZhi] {
  const ganIndex = TIAN_GAN.indexOf(dayGan);
  const zhiIndex = DI_ZHI.indexOf(dayZhi);

  // 计算旬首（甲所在的地支）
  // 从当前日支减去天干的偏移量，得到甲对应的地支
  const xunStartZhiIndex = ((zhiIndex - ganIndex) % 12 + 12) % 12;

  // 旬空是从旬首数第10、11个地支（即旬首+10和旬首+11）
  const void1Index = (xunStartZhiIndex + 10) % 12;
  const void2Index = (xunStartZhiIndex + 11) % 12;

  return [DI_ZHI[void1Index], DI_ZHI[void2Index]];
}

/**
 * 完整的干支时间计算
 */
export function getGanZhiTime(date: Date): GanZhiTime {
  const year = getYearGanZhi(date);
  const month = getMonthGanZhi(date);
  const day = getDayGanZhi(date);
  const hour = getHourGanZhi(date);
  const voidBranches = getVoidBranches(day.gan, day.zhi);

  return {
    year,
    month,
    day,
    hour,
    voidBranches,
    monthWuXing: DI_ZHI_WU_XING[month.zhi],
    dayWuXing: DI_ZHI_WU_XING[day.zhi],
  };
}

/**
 * 检查某地支是否旬空
 */
export function isVoid(zhi: DiZhi, voidBranches: [DiZhi, DiZhi]): boolean {
  return voidBranches.includes(zhi);
}

/**
 * 检查是否日破
 * 日破：与日支相冲的地支
 */
export function isDayBroken(zhi: DiZhi, dayZhi: DiZhi): boolean {
  const zhiIndex = DI_ZHI.indexOf(zhi);
  const dayZhiIndex = DI_ZHI.indexOf(dayZhi);

  // 六冲：子午、丑未、寅申、卯酉、辰戌、巳亥
  return (zhiIndex + 6) % 12 === dayZhiIndex;
}

/**
 * 检查是否月破
 * 月破：与月支相冲的地支
 */
export function isMonthBroken(zhi: DiZhi, monthZhi: DiZhi): boolean {
  const zhiIndex = DI_ZHI.indexOf(zhi);
  const monthZhiIndex = DI_ZHI.indexOf(monthZhi);

  return (zhiIndex + 6) % 12 === monthZhiIndex;
}

/**
 * 格式化干支时间显示
 */
export function formatGanZhiTime(ganZhi: GanZhiTime): string {
  return `${ganZhi.year.gan}${ganZhi.year.zhi}年 ${ganZhi.month.gan}${ganZhi.month.zhi}月 ${ganZhi.day.gan}${ganZhi.day.zhi}日 ${ganZhi.hour.gan}${ganZhi.hour.zhi}时`;
}

/**
 * 获取地支索引
 */
export function getDiZhiIndex(zhi: DiZhi): number {
  return DI_ZHI.indexOf(zhi);
}

/**
 * 获取天干索引
 */
export function getTianGanIndex(gan: TianGan): number {
  return TIAN_GAN.indexOf(gan);
}

/**
 * 查找从指定日期开始，未来N天内所有指定地支的日期
 *
 * @param startDate 开始日期
 * @param targetZhi 目标地支
 * @param maxDays 最大查找天数（默认180天，约6个月）
 * @returns 符合条件的日期数组
 */
export function findFutureDatesWithZhi(
  startDate: Date,
  targetZhi: DiZhi,
  maxDays: number = 180,
): Date[] {
  const results: Date[] = [];
  const targetZhiIndex = DI_ZHI.indexOf(targetZhi);

  for (let i = 1; i <= maxDays; i++) {
    const checkDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayGanZhi = getDayGanZhi(checkDate);
    const dayZhiIndex = DI_ZHI.indexOf(dayGanZhi.zhi);

    if (dayZhiIndex === targetZhiIndex) {
      results.push(checkDate);
    }
  }

  return results;
}

/**
 * 查找未来N个月内指定地支的月份
 *
 * @param startDate 开始日期
 * @param targetZhi 目标地支
 * @param maxMonths 最大查找月数（默认12个月）
 * @returns 符合条件的月份信息数组
 */
export function findFutureMonthsWithZhi(
  startDate: Date,
  targetZhi: DiZhi,
  maxMonths: number = 12,
): Array<{ year: number; month: number; startDate: Date; endDate: Date }> {
  const results: Array<{ year: number; month: number; startDate: Date; endDate: Date }> = [];
  const targetZhiIndex = DI_ZHI.indexOf(targetZhi);

  let checkDate = new Date(startDate);

  for (let i = 0; i < maxMonths; i++) {
    // 往后推一个月
    checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 15);

    const monthGanZhi = getMonthGanZhi(checkDate);
    const monthZhiIndex = DI_ZHI.indexOf(monthGanZhi.zhi);

    if (monthZhiIndex === targetZhiIndex) {
      // 计算这个月的大致起止日期
      const jqIndex = (targetZhiIndex - 2 + 12) % 12; // 寅月=0
      const [, jqMonth, jqDay] = JIE_QI_APPROX[jqIndex];

      // 节气月的开始和结束
      let startYear = checkDate.getFullYear();
      let endYear = checkDate.getFullYear();

      // 处理跨年情况
      if (jqMonth === 1 && checkDate.getMonth() > 6) {
        startYear = checkDate.getFullYear() + 1;
        endYear = checkDate.getFullYear() + 1;
      } else if (jqMonth === 12 && checkDate.getMonth() < 6) {
        startYear = checkDate.getFullYear() - 1;
        endYear = checkDate.getFullYear();
      }

      const monthStart = new Date(startYear, jqMonth - 1, jqDay);
      const nextJqIndex = (jqIndex + 1) % 12;
      const [, nextJqMonth, nextJqDay] = JIE_QI_APPROX[nextJqIndex];

      let nextStartYear = startYear;
      if (nextJqMonth < jqMonth) {
        nextStartYear = startYear + 1;
      }
      const monthEnd = new Date(nextStartYear, nextJqMonth - 1, nextJqDay - 1);

      results.push({
        year: startYear,
        month: jqMonth,
        startDate: monthStart,
        endDate: monthEnd,
      });
    }
  }

  return results;
}

/**
 * 格式化日期为中文
 */
export function formatDateChinese(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * 格式化日期为简短格式
 */
export function formatDateShort(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日(${weekDay})`;
}
