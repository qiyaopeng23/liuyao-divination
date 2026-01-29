'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HexagramDisplay, TermTooltip } from './HexagramDisplay';
import type { DivinationResult, InterpretationItem, CausalNode, TrendJudgment } from '@/lib/liuyao/types';
import { TERM_DICTIONARY } from '@/lib/liuyao/types';
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Share2,
  Download,
  Eye,
  EyeOff,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Check,
  Copy,
} from 'lucide-react';

interface ResultDisplayProps {
  result: DivinationResult;
  className?: string;
}

/**
 * 趋势图标
 */
const TrendIcon: React.FC<{ trend: TrendJudgment }> = ({ trend }) => {
  const config: Record<TrendJudgment, { icon: React.ReactNode; className: string }> = {
    'very_favorable': { icon: <CheckCircle className="w-5 h-5" />, className: 'text-green-600' },
    'favorable': { icon: <CheckCircle className="w-5 h-5" />, className: 'text-green-500' },
    'neutral': { icon: <Info className="w-5 h-5" />, className: 'text-gray-500' },
    'unfavorable': { icon: <AlertCircle className="w-5 h-5" />, className: 'text-orange-500' },
    'very_unfavorable': { icon: <AlertCircle className="w-5 h-5" />, className: 'text-red-500' },
    'uncertain': { icon: <HelpCircle className="w-5 h-5" />, className: 'text-purple-500' },
  };

  const { icon, className } = config[trend];
  return <span className={className}>{icon}</span>;
};

/**
 * 趋势文本
 */
const getTrendText = (trend: TrendJudgment): { plain: string; color: string } => {
  const texts: Record<TrendJudgment, { plain: string; color: string }> = {
    'very_favorable': { plain: '非常顺利', color: 'text-green-600 dark:text-green-400' },
    'favorable': { plain: '比较顺利', color: 'text-green-500 dark:text-green-400' },
    'neutral': { plain: '平稳', color: 'text-gray-600 dark:text-gray-400' },
    'unfavorable': { plain: '有阻碍', color: 'text-orange-500 dark:text-orange-400' },
    'very_unfavorable': { plain: '阻碍较多', color: 'text-red-500 dark:text-red-400' },
    'uncertain': { plain: '不明朗', color: 'text-purple-500 dark:text-purple-400' },
  };
  return texts[trend];
};

/**
 * 因果链可视化组件
 */
const CausalChainView: React.FC<{ chain: CausalNode[] }> = ({ chain }) => {
  const renderNode = (node: CausalNode, depth: number = 0) => (
    <div key={node.id} className={cn('relative', depth > 0 && 'ml-6')}>
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border -ml-3" />
      )}
      <div className="flex items-start gap-3 py-2">
        <div
          className={cn(
            'w-3 h-3 rounded-full mt-1.5 shrink-0 border-2',
            node.type === 'self' && 'border-blue-500 bg-blue-100',
            node.type === 'factor' && 'border-amber-500 bg-amber-100',
            node.type === 'result' && 'border-green-500 bg-green-100',
            node.type === 'advice' && 'border-purple-500 bg-purple-100'
          )}
        />
        <div className="space-y-1">
          <div className="font-medium text-sm">{node.plainLabel}</div>
          {node.connectionText && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {node.connectionText}
            </div>
          )}
        </div>
      </div>
      {node.children?.map((child) => renderNode(child, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-1">
      {chain.map((node) => renderNode(node))}
    </div>
  );
};

/**
 * 分析项组件
 */
const AnalysisItem: React.FC<{
  item: InterpretationItem;
  isExpertMode: boolean;
}> = ({ item, isExpertMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeIcon = {
    'trend': <ArrowRight className="w-4 h-4 text-blue-500" />,
    'obstacle': <AlertCircle className="w-4 h-4 text-orange-500" />,
    'support': <CheckCircle className="w-4 h-4 text-green-500" />,
    'timing': <Clock className="w-4 h-4 text-purple-500" />,
    'advice': <Info className="w-4 h-4 text-blue-500" />,
    'risk': <AlertCircle className="w-4 h-4 text-red-500" />,
  }[item.type];

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="mt-0.5">{typeIcon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            {isExpertMode ? item.technicalText : item.plainText}
          </p>
        </div>
        <div className="text-muted-foreground">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t bg-muted/30"
          >
            <div className="p-3 space-y-3">
              {/* 显示另一层的解释 */}
              <div className="text-sm">
                <span className="text-muted-foreground text-xs">
                  {isExpertMode ? '白话解释：' : '专业解释：'}
                </span>
                <p className="mt-1">
                  {isExpertMode ? item.plainText : item.technicalText}
                </p>
              </div>

              {/* 推导依据 */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium">推导依据：</div>
                {item.reasoning.steps.map((step, index) => (
                  <div
                    key={index}
                    className="text-xs p-2 bg-background rounded border space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.ruleName}</span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px]',
                          step.strength === 'strong' && 'bg-green-100 text-green-700',
                          step.strength === 'medium' && 'bg-blue-100 text-blue-700',
                          step.strength === 'weak' && 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {step.strength === 'strong' ? '强' :
                         step.strength === 'medium' ? '中' : '弱'}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{step.ruleDescription}</p>
                    <p className="font-medium">{step.conclusion}</p>
                    {step.source && (
                      <p className="text-muted-foreground italic">出处：{step.source}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* 相关爻位 */}
              {item.relatedYao && item.relatedYao.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  相关爻位：{item.relatedYao.join('、')}爻
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * 完整结果显示组件
 */
export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, className }) => {
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [showHexagram, setShowHexagram] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'done'>('idle');
  const resultRef = useRef<HTMLDivElement>(null);

  const trendInfo = getTrendText(result.interpretation.trend);

  // 分享功能
  const handleShare = async () => {
    const url = window.location.href;
    const title = `六爻占卜结果 - ${result.primaryGua.name}`;
    const text = `我的占卜结果是「${result.primaryGua.name}」，整体趋势：${trendInfo.plain}`;

    // 尝试使用原生分享 API（移动端）
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // 用户取消或不支持，回退到复制链接
      }
    }

    // 复制链接到剪贴板
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      alert('复制失败，请手动复制网址');
    }
  };

  // 导出为图片
  const handleExport = async () => {
    if (!resultRef.current) return;

    setExportStatus('exporting');
    try {
      const dataUrl = await toPng(resultRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      // 下载图片
      const link = document.createElement('a');
      link.download = `六爻占卜-${result.primaryGua.name}-${new Date().toLocaleDateString('zh-CN')}.png`;
      link.href = dataUrl;
      link.click();

      setExportStatus('done');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (err) {
      alert('导出失败，请重试');
      setExportStatus('idle');
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* 模式切换 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={isExpertMode ? 'outline' : 'default'}
            size="sm"
            onClick={() => setIsExpertMode(false)}
          >
            <Eye className="w-4 h-4 mr-1" />
            简明模式
          </Button>
          <Button
            variant={isExpertMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsExpertMode(true)}
          >
            <EyeOff className="w-4 h-4 mr-1" />
            专业模式
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleShare}>
            {shareStatus === 'copied' ? (
              <>
                <Check className="w-4 h-4 mr-1 text-green-500" />
                已复制
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-1" />
                分享
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={exportStatus === 'exporting'}
          >
            {exportStatus === 'exporting' ? (
              <>正在导出...</>
            ) : exportStatus === 'done' ? (
              <>
                <Check className="w-4 h-4 mr-1 text-green-500" />
                已保存
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-1" />
                导出图片
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 可导出区域 */}
      <div ref={resultRef} className="space-y-6 bg-background p-1">

      {/* 总断卡片 */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <TrendIcon trend={result.interpretation.trend} />
            <div>
              <CardTitle className={cn('text-xl', trendInfo.color)}>
                整体趋势：{trendInfo.plain}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">
            {isExpertMode
              ? result.interpretation.summaryTechnical
              : result.interpretation.summaryPlain}
          </p>
        </CardContent>
      </Card>

      {/* 因果链可视化（简明模式显示） */}
      {!isExpertMode && result.interpretation.causalChain.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              推理过程
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              以下展示了得出结论的关键步骤
            </p>
          </CardHeader>
          <CardContent>
            <CausalChainView chain={result.interpretation.causalChain} />
          </CardContent>
        </Card>
      )}

      {/* 卦象显示 */}
      <Card>
        <CardHeader className="pb-3">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowHexagram(!showHexagram)}
          >
            <CardTitle className="text-lg">卦象</CardTitle>
            {showHexagram ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </CardHeader>
        <AnimatePresence>
          {showHexagram && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent>
                <HexagramDisplay
                  guaInfo={result.primaryGua}
                  yaoInfos={result.primaryYao}
                  ganZhiTime={result.ganZhiTime}
                  changedGuaInfo={result.changedGua}
                  changedYaoInfos={result.changedYao}
                  isExpertMode={isExpertMode}
                />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* 用神信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            关键因素
            <TermTooltip term="用神">
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
            </TermTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                {result.yongShen.liuQin}
              </span>
              {result.yongShen.positions.length > 0 ? (
                <span className="text-sm text-muted-foreground">
                  位于 {result.yongShen.positions.join('、')} 爻
                </span>
              ) : (
                <span className="text-sm text-orange-500">
                  不在卦中显现
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isExpertMode ? result.yongShen.reason : (
                `这是这次占卜中最需要关注的因素：${TERM_DICTIONARY[result.yongShen.liuQin] || result.yongShen.liuQin}`
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 详细分析 */}
      <Card>
        <CardHeader className="pb-3">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowAnalysis(!showAnalysis)}
          >
            <CardTitle className="text-lg">详细分析</CardTitle>
            {showAnalysis ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </CardHeader>
        <AnimatePresence>
          {showAnalysis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent>
                <div className="space-y-3">
                  {result.interpretation.items.map((item, index) => (
                    <AnalysisItem
                      key={index}
                      item={item}
                      isExpertMode={isExpertMode}
                    />
                  ))}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* 应期预测 */}
      {result.interpretation.timingPredictions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              时间预测
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              以下是可能出现结果的时间窗口（仅供参考）
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.interpretation.timingPredictions.map((timing, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg space-y-2 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary">{timing.timeWindow}</span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        timing.confidence === 'high' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                        timing.confidence === 'medium' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                        timing.confidence === 'low' && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {timing.confidence === 'high' ? '可能性较高' :
                       timing.confidence === 'medium' ? '参考' : '仅供参考'}
                    </span>
                  </div>
                  <p className="text-sm">{timing.basis}</p>
                  {!isExpertMode && timing.reasoning.steps[0]?.ruleDescription && (
                    <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                      💡 {timing.reasoning.steps[0].ruleDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
              ⚠️ 应期预测是六爻中最难的部分，以上日期仅作参考。实际应验时间可能有偏差，请结合具体情况判断。
            </p>
          </CardContent>
        </Card>
      )}

      {/* 不确定性提示 */}
      {result.interpretation.uncertainties.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertCircle className="w-5 h-5" />
              需要注意
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.interpretation.uncertainties.map((uncertainty, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm">
                    {isExpertMode ? uncertainty.description : uncertainty.plainDescription}
                  </p>
                  {uncertainty.suggestions.length > 0 && (
                    <div className="pl-4 border-l-2 border-orange-300">
                      <p className="text-xs text-muted-foreground mb-1">建议：</p>
                      <ul className="text-sm space-y-1">
                        {uncertainty.suggestions.map((suggestion, idx) => (
                          <li key={idx}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 声明 */}
      <div className="text-xs text-muted-foreground text-center p-4 border rounded-lg bg-muted/30">
        <p className="font-medium mb-1">重要声明</p>
        <p>本系统基于传统六爻规则进行分析，提供的是「结构化判断参考」，不是命令。</p>
        <p>您始终保有决策权。本系统不提供医疗、法律、投资等专业领域的确定性建议。</p>
      </div>
      </div>{/* 结束可导出区域 */}
    </div>
  );
};

export default ResultDisplay;
