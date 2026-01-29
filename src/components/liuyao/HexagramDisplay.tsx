'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { YaoInfo, GuaInfo, GanZhiTime } from '@/lib/liuyao/types';
import { TERM_DICTIONARY } from '@/lib/liuyao/types';

interface HexagramDisplayProps {
  guaInfo: GuaInfo;
  yaoInfos: YaoInfo[];
  ganZhiTime: GanZhiTime;
  changedGuaInfo?: GuaInfo;
  changedYaoInfos?: YaoInfo[];
  isExpertMode?: boolean;
  className?: string;
}

/**
 * 爻的显示组件
 */
const YaoLine: React.FC<{
  yao: YaoInfo;
  changedYao?: YaoInfo;
  isExpertMode: boolean;
}> = ({ yao, changedYao, isExpertMode }) => {
  const isYang = yao.yinYang === '阳';

  return (
    <div className="flex items-center gap-4 py-1">
      {/* 爻位和六神 */}
      <div className="w-16 text-right text-sm text-muted-foreground">
        <span className="font-medium">{yao.position}爻</span>
        {isExpertMode && (
          <span className="ml-1 text-xs opacity-70">{yao.liuShen[0]}</span>
        )}
      </div>

      {/* 爻象 */}
      <div className="relative flex-1 max-w-32">
        <div
          className={cn(
            'h-4 rounded transition-all',
            isYang ? 'bg-yang' : 'flex gap-3',
            yao.isMoving && 'ring-2 ring-moving ring-offset-2'
          )}
        >
          {!isYang && (
            <>
              <div className="flex-1 bg-yin rounded" />
              <div className="flex-1 bg-yin rounded" />
            </>
          )}
        </div>
        {/* 动爻标记 */}
        {yao.isMoving && (
          <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-moving text-xs font-bold">
            ○
          </span>
        )}
      </div>

      {/* 纳甲信息 */}
      <div className="flex items-center gap-2 min-w-48">
        <span
          className={cn(
            'px-2 py-0.5 rounded text-sm font-medium',
            yao.isWorld && 'bg-world/10 text-world',
            yao.isResponse && 'bg-response/10 text-response',
            !yao.isWorld && !yao.isResponse && 'bg-muted'
          )}
        >
          {yao.diZhi}{yao.wuXing}
        </span>
        <span className="text-sm">{yao.liuQin}</span>
        {yao.isWorld && <span className="text-xs text-world font-medium">世</span>}
        {yao.isResponse && <span className="text-xs text-response font-medium">应</span>}
      </div>

      {/* 旺衰和特殊状态 */}
      {isExpertMode && (
        <div className="flex items-center gap-1 text-xs">
          {yao.prosperity && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded',
                yao.prosperity === '旺' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                yao.prosperity === '相' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                yao.prosperity === '休' && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                yao.prosperity === '囚' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                yao.prosperity === '死' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {yao.prosperity}
            </span>
          )}
          {yao.isVoid && (
            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              空
            </span>
          )}
          {(yao.isDayBroken || yao.isMonthBroken) && (
            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              破
            </span>
          )}
        </div>
      )}

      {/* 变爻信息 */}
      {yao.isMoving && yao.changedYao && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>→</span>
          <span>{yao.changedYao.diZhi}{yao.changedYao.wuXing}</span>
          {yao.changedYao.changeType && yao.changedYao.changeType !== 'normal' && (
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                yao.changedYao.changeType === 'return_birth' && 'bg-green-100 text-green-700',
                yao.changedYao.changeType === 'return_clash' && 'bg-red-100 text-red-700',
                yao.changedYao.changeType === 'advance' && 'bg-blue-100 text-blue-700',
                yao.changedYao.changeType === 'retreat' && 'bg-orange-100 text-orange-700'
              )}
            >
              {getChangeTypeName(yao.changedYao.changeType)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

function getChangeTypeName(type: string): string {
  const names: Record<string, string> = {
    'advance': '进神',
    'retreat': '退神',
    'return_birth': '回头生',
    'return_clash': '回头克',
    'to_void': '化空',
    'to_tomb': '化墓',
    'to_bindingend': '化绝',
  };
  return names[type] || '';
}

/**
 * 卦象显示主组件
 */
export const HexagramDisplay: React.FC<HexagramDisplayProps> = ({
  guaInfo,
  yaoInfos,
  ganZhiTime,
  changedGuaInfo,
  changedYaoInfos,
  isExpertMode = false,
  className,
}) => {
  // 从下到上显示（6爻→1爻）
  const reversedYaoInfos = [...yaoInfos].reverse();
  const reversedChangedYaoInfos = changedYaoInfos ? [...changedYaoInfos].reverse() : undefined;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 卦名和基本信息 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{guaInfo.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{guaInfo.lowerGua}下{guaInfo.upperGua}上</span>
            <span>·</span>
            <span>{guaInfo.palace}宫</span>
            <span>·</span>
            <span>{guaInfo.wuXing}</span>
          </div>
        </div>
        {changedGuaInfo && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">变</div>
            <div className="font-medium">{changedGuaInfo.name}</div>
          </div>
        )}
      </div>

      {/* 时间信息 */}
      {isExpertMode && (
        <div className="flex flex-wrap gap-3 text-sm py-2 px-3 bg-muted/50 rounded-lg">
          <span>
            <span className="text-muted-foreground">年：</span>
            {ganZhiTime.year.gan}{ganZhiTime.year.zhi}
          </span>
          <span>
            <span className="text-muted-foreground">月：</span>
            {ganZhiTime.month.gan}{ganZhiTime.month.zhi}
          </span>
          <span>
            <span className="text-muted-foreground">日：</span>
            {ganZhiTime.day.gan}{ganZhiTime.day.zhi}
          </span>
          <span>
            <span className="text-muted-foreground">时：</span>
            {ganZhiTime.hour.gan}{ganZhiTime.hour.zhi}
          </span>
          <span className="text-muted-foreground">
            旬空：{ganZhiTime.voidBranches.join('')}
          </span>
        </div>
      )}

      {/* 六爻显示 */}
      <div className="space-y-1 py-4">
        {reversedYaoInfos.map((yao, index) => (
          <YaoLine
            key={yao.position}
            yao={yao}
            changedYao={reversedChangedYaoInfos?.[index]}
            isExpertMode={isExpertMode}
          />
        ))}
      </div>

      {/* 图例说明（简版，非专家模式） */}
      {!isExpertMode && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 bg-yang rounded" /> 阳爻
          </span>
          <span className="flex items-center gap-1">
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-yin rounded" />
              <span className="w-1 h-1 bg-yin rounded" />
            </span>
            阴爻
          </span>
          <span className="flex items-center gap-1">
            <span className="text-moving font-bold">○</span> 动爻（正在变化）
          </span>
          <span className="flex items-center gap-1">
            <span className="text-world font-medium">世</span> 代表你
          </span>
          <span className="flex items-center gap-1">
            <span className="text-response font-medium">应</span> 代表对方/外部
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * 术语提示组件
 */
export const TermTooltip: React.FC<{
  term: string;
  children: React.ReactNode;
}> = ({ term, children }) => {
  const meaning = TERM_DICTIONARY[term];

  if (!meaning) {
    return <>{children}</>;
  }

  return (
    <span className="group relative term-tooltip">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm bg-popover text-popover-foreground rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
        {meaning}
      </span>
    </span>
  );
};

export default HexagramDisplay;
