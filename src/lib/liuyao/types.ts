/**
 * 六爻占卜系统 - 类型定义
 *
 * 基于文王卦（京房易）体系
 * 规则来源：《增删卜易》《卜筮正宗》等传统典籍
 */

// ==================== 基础类型 ====================

/** 天干 */
export type TianGan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

/** 地支 */
export type DiZhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

/** 五行 */
export type WuXing = '金' | '木' | '水' | '火' | '土';

/** 阴阳 */
export type YinYang = '阴' | '阳';

/** 八卦（单卦/经卦） */
export type BaGua = '乾' | '兑' | '离' | '震' | '巽' | '坎' | '艮' | '坤';

// ==================== 爻相关类型 ====================

/** 爻的四象类型（老阴、少阴、少阳、老阳） */
export type YaoType = 'old_yin' | 'young_yin' | 'young_yang' | 'old_yang';

/** 爻的阴阳与动静状态 */
export interface YaoState {
  /** 阴阳属性 */
  yinYang: YinYang;
  /** 是否为动爻（老阴或老阳） */
  isMoving: boolean;
  /** 四象类型 */
  type: YaoType;
  /** 三枚铜钱的结果（仅铜钱法使用） */
  coinResult?: number; // 6=老阴, 7=少阳, 8=少阴, 9=老阳
}

/** 完整的爻信息（包含纳甲、六亲等） */
export interface YaoInfo extends YaoState {
  /** 爻位（1-6，从下往上） */
  position: 1 | 2 | 3 | 4 | 5 | 6;
  /** 纳甲地支 */
  diZhi: DiZhi;
  /** 纳甲天干（世爻用） */
  tianGan?: TianGan;
  /** 五行属性 */
  wuXing: WuXing;
  /** 六亲 */
  liuQin: LiuQin;
  /** 六神 */
  liuShen: LiuShen;
  /** 是否为世爻 */
  isWorld: boolean;
  /** 是否为应爻 */
  isResponse: boolean;
  /** 变爻信息（若为动爻） */
  changedYao?: ChangedYaoInfo;
  /** 旺衰状态 */
  prosperity?: ProsperityState;
  /** 是否旬空 */
  isVoid: boolean;
  /** 是否日破 */
  isDayBroken: boolean;
  /** 是否月破 */
  isMonthBroken: boolean;
}

/** 变爻信息 */
export interface ChangedYaoInfo {
  /** 变后的阴阳 */
  yinYang: YinYang;
  /** 变后的纳甲地支 */
  diZhi: DiZhi;
  /** 变后的五行 */
  wuXing: WuXing;
  /** 变后的六亲 */
  liuQin: LiuQin;
  /** 化进/化退/化绝等状态 */
  changeType?: ChangeType;
}

/** 变爻的变化类型 */
export type ChangeType =
  | 'advance'       // 化进神（地支进一位）
  | 'retreat'       // 化退神（地支退一位）
  | 'return_birth'  // 回头生
  | 'return_clash'  // 回头克
  | 'to_void'       // 化空
  | 'to_tomb'       // 化墓
  | 'to_bindingend' // 化绝
  | 'normal';       // 普通变化

// ==================== 六亲与六神 ====================

/** 六亲 */
export type LiuQin = '父母' | '兄弟' | '子孙' | '妻财' | '官鬼';

/** 用神取法类型（六亲 + 特殊位置） */
export type YongShenTarget = LiuQin | '世爻' | '应爻' | '用神';

/** 六神 */
export type LiuShen = '青龙' | '朱雀' | '勾陈' | '螣蛇' | '白虎' | '玄武';

// ==================== 卦象类型 ====================

/** 六十四卦名称 */
export type Gua64Name = string; // 完整列表见常量定义

/** 卦的完整信息 */
export interface GuaInfo {
  /** 卦名 */
  name: Gua64Name;
  /** 卦序（京房卦序） */
  sequence: number;
  /** 上卦（外卦） */
  upperGua: BaGua;
  /** 下卦（内卦） */
  lowerGua: BaGua;
  /** 卦象二进制表示（从下到上，阳=1，阴=0） */
  binary: string;
  /** 卦宫 */
  palace: BaGua;
  /** 世爻位置（1-6） */
  worldPosition: 1 | 2 | 3 | 4 | 5 | 6;
  /** 应爻位置（1-6） */
  responsePosition: 1 | 2 | 3 | 4 | 5 | 6;
  /** 卦五行 */
  wuXing: WuXing;
}

/** 卦的爻列表（6爻从下到上） */
export type YaoList = [YaoInfo, YaoInfo, YaoInfo, YaoInfo, YaoInfo, YaoInfo];

// ==================== 旺衰相关 ====================

/** 旺衰状态 */
export type ProsperityState = '旺' | '相' | '休' | '囚' | '死';

/** 十二长生状态 */
export type TwelveStage =
  | '长生' | '沐浴' | '冠带' | '临官' | '帝旺'
  | '衰' | '病' | '死' | '墓' | '绝' | '胎' | '养';

/** 旺衰分析结果 */
export interface ProsperityAnalysis {
  /** 基于月令的旺衰 */
  monthProsperity: ProsperityState;
  /** 基于日辰的状态 */
  dayStatus: 'support' | 'restrain' | 'neutral';
  /** 十二长生状态（月令） */
  monthStage?: TwelveStage;
  /** 十二长生状态（日辰） */
  dayStage?: TwelveStage;
  /** 综合旺衰评分（-10到+10） */
  score: number;
  /** 分析依据 */
  reasons: ReasonItem[];
}

// ==================== 关系类型 ====================

/** 五行生克关系 */
export type WuXingRelation =
  | 'birth'    // 生
  | 'restrain' // 克
  | 'same'     // 同
  | 'drain'    // 泄
  | 'consume'; // 耗

/** 地支关系 */
export type DiZhiRelation =
  | 'six_clash'   // 六冲
  | 'six_harmony' // 六合
  | 'three_harmony' // 三合
  | 'three_penalty' // 三刑
  | 'six_harm'    // 六害
  | 'destruction' // 破
  | 'none';       // 无特殊关系

/** 关系分析结果 */
export interface RelationAnalysis {
  /** 关系类型 */
  type: DiZhiRelation;
  /** 涉及的爻位或时间 */
  parties: string[];
  /** 对解卦的影响 */
  impact: 'positive' | 'negative' | 'neutral';
  /** 影响描述 */
  description: string;
}

// ==================== 用神相关 ====================

/** 问事类别 */
export type QuestionCategory =
  | 'career'    // 事业工作
  | 'love'      // 感情婚姻
  | 'wealth'    // 财运投资
  | 'health'    // 健康疾病
  | 'study'     // 学业考试
  | 'lawsuit'   // 诉讼官司
  | 'travel'    // 出行
  | 'lost'      // 失物寻找
  | 'other';    // 其他杂项

/** 用神信息 */
export interface YongShenInfo {
  /** 用神类型（六亲） */
  liuQin: LiuQin;
  /** 用神所在爻位（可能多个） */
  positions: number[];
  /** 选取依据 */
  reason: string;
  /** 是否为自动选取 */
  isAutoSelected: boolean;
  /** 备选用神 */
  alternatives?: {
    liuQin: LiuQin;
    reason: string;
  }[];
}

// ==================== 时间信息 ====================

/** 干支时间 */
export interface GanZhiTime {
  /** 年干支 */
  year: { gan: TianGan; zhi: DiZhi };
  /** 月干支 */
  month: { gan: TianGan; zhi: DiZhi };
  /** 日干支 */
  day: { gan: TianGan; zhi: DiZhi };
  /** 时干支 */
  hour: { gan: TianGan; zhi: DiZhi };
  /** 旬空（基于日干支） */
  voidBranches: [DiZhi, DiZhi];
  /** 月令五行 */
  monthWuXing: WuXing;
  /** 日辰五行 */
  dayWuXing: WuXing;
}

/** 起卦时间信息 */
export interface CastingTime {
  /** 公历时间 */
  gregorian: Date;
  /** 时区 */
  timezone: string;
  /** 干支时间 */
  ganZhi: GanZhiTime;
}

// ==================== 推导链（可追溯性） ====================

/** 推导理由项 */
export interface ReasonItem {
  /** 规则名称 */
  ruleName: string;
  /** 规则描述 */
  ruleDescription: string;
  /** 涉及的数据 */
  data: Record<string, unknown>;
  /** 结论 */
  conclusion: string;
  /** 证据强度 */
  strength: 'strong' | 'medium' | 'weak';
  /** 规则来源（典籍） */
  source?: string;
}

/** 推导链 */
export interface ReasoningChain {
  /** 推导步骤 */
  steps: ReasonItem[];
  /** 最终结论 */
  conclusion: string;
  /** 置信度 */
  confidence: 'high' | 'medium' | 'low';
}

// ==================== 解卦结果 ====================

/** 趋势判断 */
export type TrendJudgment = 'very_favorable' | 'favorable' | 'neutral' | 'unfavorable' | 'very_unfavorable' | 'uncertain';

/** 解卦结论项 */
export interface InterpretationItem {
  /** 结论类型 */
  type: 'trend' | 'obstacle' | 'support' | 'timing' | 'advice' | 'risk';
  /** 命理层表述 */
  technicalText: string;
  /** 白话层表述 */
  plainText: string;
  /** 推导链 */
  reasoning: ReasoningChain;
  /** 相关爻位 */
  relatedYao?: number[];
}

/** 应期预测 */
export interface TimingPrediction {
  /** 预测时间窗口 */
  timeWindow: string;
  /** 预测依据 */
  basis: string;
  /** 置信度 */
  confidence: 'high' | 'medium' | 'low';
  /** 推导链 */
  reasoning: ReasoningChain;
}

/** 完整的解卦结果 */
export interface InterpretationResult {
  /** 总体趋势 */
  trend: TrendJudgment;
  /** 总断（白话） */
  summaryPlain: string;
  /** 总断（命理） */
  summaryTechnical: string;
  /** 详细分析项 */
  items: InterpretationItem[];
  /** 应期预测 */
  timingPredictions: TimingPrediction[];
  /** 风险与不确定性 */
  uncertainties: {
    description: string;
    plainDescription: string;
    suggestions: string[];
  }[];
  /** 因果链（用于可视化） */
  causalChain: CausalNode[];
}

/** 因果链节点（用于白话可视化） */
export interface CausalNode {
  id: string;
  /** 节点类型 */
  type: 'self' | 'target' | 'factor' | 'result' | 'advice';
  /** 命理层标签 */
  technicalLabel: string;
  /** 白话层标签 */
  plainLabel: string;
  /** 子节点 */
  children?: CausalNode[];
  /** 连接描述 */
  connectionText?: string;
}

// ==================== 完整卦例 ====================

/** 起卦方法 */
export type CastingMethod = 'coin' | 'time' | 'manual';

/** 性别选项（用于感情类问题） */
export type GenderOption = 'male' | 'female' | 'same_sex';

/** 起卦输入 */
export interface CastingInput {
  /** 起卦方法 */
  method: CastingMethod;
  /** 六爻状态（从下到上） */
  yaoStates: [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState];
  /** 起卦时间 */
  time: CastingTime;
  /** 问事类别 */
  questionCategory: QuestionCategory;
  /** 问事内容（可选，不存储） */
  questionText?: string;
  /** 性别（用于感情类问题） */
  gender?: GenderOption;
}

/** 完整的卦例结果 */
export interface DivinationResult {
  /** 唯一ID */
  id: string;
  /** 创建时间 */
  createdAt: Date;
  /** 起卦输入 */
  input: CastingInput;

  // ===== 排盘结果 =====
  /** 本卦信息 */
  primaryGua: GuaInfo;
  /** 本卦六爻 */
  primaryYao: YaoList;
  /** 变卦信息（如有动爻） */
  changedGua?: GuaInfo;
  /** 变卦六爻（如有动爻） */
  changedYao?: YaoList;
  /** 互卦 */
  mutualGua?: GuaInfo;
  /** 错卦 */
  oppositeGua?: GuaInfo;
  /** 综卦 */
  reverseGua?: GuaInfo;
  /** 动爻列表（爻位） */
  movingYaoPositions: number[];

  // ===== 时间信息 =====
  /** 干支时间 */
  ganZhiTime: GanZhiTime;

  // ===== 用神信息 =====
  /** 用神 */
  yongShen: YongShenInfo;

  // ===== 关系分析 =====
  /** 关系分析结果 */
  relations: RelationAnalysis[];

  // ===== 解卦结果 =====
  /** 解卦结果 */
  interpretation: InterpretationResult;

  // ===== 推导过程（完整） =====
  /** 完整推导过程 */
  fullReasoningChain: ReasonItem[];
}

// ==================== 术语翻译映射 ====================

/** 术语白话翻译 */
export interface TermTranslation {
  /** 术语 */
  term: string;
  /** 白话翻译（1-2句） */
  plainMeaning: string;
  /** 在此卦中的具体含义 */
  contextualMeaning?: string;
}

/** 术语字典 */
export const TERM_DICTIONARY: Record<string, string> = {
  '用神': '这件事里最关键的那一条线索',
  '世爻': '代表"你"的位置',
  '应爻': '代表"对方/外部世界"的位置',
  '旺': '当前环境对这件事是有帮助的',
  '衰': '当前环境不太配合',
  '相': '虽然不是最强，但环境还是支持的',
  '休': '暂时休息状态，力量不太够',
  '囚': '被限制住了，难以发挥',
  '死': '力量非常弱，难以起作用',
  '动爻': '事情正在变化，不是静态',
  '空亡': '现在看起来有，但暂时用不上/落不到实处',
  '冲': '两个因素在互相拉扯',
  '合': '两个因素在互相靠拢',
  '刑': '内部矛盾或自我消耗',
  '害': '暗中有不利因素干扰',
  '破': '原有结构被打破',
  '月建': '当月的大环境',
  '日辰': '当日的具体环境',
  '父母': '文书、长辈、保护、庇护相关',
  '兄弟': '竞争者、同辈、消耗、阻力相关',
  '子孙': '晚辈、快乐、福气、解决问题的力量',
  '妻财': '财物、妻子、收益、可控资源',
  '官鬼': '压力、责任、权威、不可控因素',
  '回头生': '变化后反而带来帮助',
  '回头克': '变化后反而带来阻力',
  '化进神': '往好的方向发展',
  '化退神': '往后退或减弱的方向发展',
  '伏神': '隐藏的因素，还没有显现出来',
  '飞神': '表面上的因素',
  '日破': '被当天环境严重削弱',
  '月破': '被当月环境严重削弱',
};
