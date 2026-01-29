'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CoinFlipProps {
  onResult: (result: 2 | 3) => void;
  coinIndex: number; // 0, 1, 2 表示第几枚铜钱
  disabled?: boolean;
}

/**
 * 单枚铜钱投掷组件
 */
const SingleCoin: React.FC<CoinFlipProps> = ({ onResult, coinIndex, disabled }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<2 | 3 | null>(null);

  const flipCoin = useCallback(() => {
    if (isFlipping || disabled) return;

    setIsFlipping(true);
    setResult(null);

    // 模拟投币
    setTimeout(() => {
      const randomValue = Math.random();
      const coinResult = randomValue < 0.5 ? 2 : 3;
      setResult(coinResult);
      setIsFlipping(false);
      onResult(coinResult);
    }, 800);
  }, [isFlipping, disabled, onResult]);

  return (
    <motion.button
      className={cn(
        'relative w-16 h-16 rounded-full cursor-pointer',
        'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500',
        'shadow-lg hover:shadow-xl transition-shadow',
        'border-4 border-amber-600/50',
        disabled && 'opacity-50 cursor-not-allowed',
        result !== null && 'ring-2 ring-offset-2',
        result === 2 && 'ring-blue-500',
        result === 3 && 'ring-red-500'
      )}
      onClick={flipCoin}
      disabled={disabled || isFlipping}
      animate={isFlipping ? {
        rotateY: [0, 1800],
        y: [0, -60, 0],
      } : {}}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* 铜钱中心方孔 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 bg-amber-800/80 rounded-sm" />
      </div>

      {/* 结果显示 */}
      <AnimatePresence>
        {result !== null && !isFlipping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-bold"
          >
            {result === 2 ? (
              <span className="text-blue-600">字</span>
            ) : (
              <span className="text-red-600">背</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

interface ThreeCoinsProps {
  onComplete: (sum: 6 | 7 | 8 | 9) => void;
  yaoIndex: number; // 当前是第几爻（1-6）
}

/**
 * 三枚铜钱投掷组件
 */
export const ThreeCoins: React.FC<ThreeCoinsProps> = ({ onComplete, yaoIndex }) => {
  const [results, setResults] = useState<(2 | 3)[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const handleCoinResult = useCallback((index: number, result: 2 | 3) => {
    const newResults = [...results];
    newResults[index] = result;
    setResults(newResults);

    // 检查是否三枚都投完
    if (newResults.filter(r => r !== undefined).length === 3) {
      const sum = newResults.reduce<number>((a, b) => a + b, 0) as 6 | 7 | 8 | 9;
      setIsComplete(true);

      // 延迟回调，让动画完成
      setTimeout(() => {
        onComplete(sum);
        setResults([]);
        setIsComplete(false);
      }, 500);
    }
  }, [results, onComplete]);

  const getYaoDescription = (sum: number): string => {
    switch (sum) {
      case 6: return '老阴 ⚋ (动爻)';
      case 7: return '少阳 ⚊';
      case 8: return '少阴 ⚋';
      case 9: return '老阳 ⚊ (动爻)';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* 当前爻提示 */}
      <div className="text-center">
        <div className="text-lg font-medium">
          第 {yaoIndex} 爻
        </div>
        <div className="text-sm text-muted-foreground">
          {yaoIndex === 1 ? '初爻（最下）' :
           yaoIndex === 6 ? '上爻（最上）' :
           `从下往上第${yaoIndex}爻`}
        </div>
      </div>

      {/* 三枚铜钱 */}
      <div className="flex justify-center gap-6">
        {[0, 1, 2].map((index) => (
          <SingleCoin
            key={index}
            coinIndex={index}
            onResult={(result) => handleCoinResult(index, result)}
            disabled={results[index] !== undefined}
          />
        ))}
      </div>

      {/* 投币说明 */}
      <div className="text-center text-sm text-muted-foreground">
        <p>点击铜钱投掷</p>
        <p className="mt-1">字=2分，背=3分</p>
        {results.length === 3 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 font-medium text-foreground"
          >
            {results.reduce((a, b) => a + b, 0)}分 = {getYaoDescription(results.reduce((a, b) => a + b, 0))}
          </motion.p>
        )}
      </div>

      {/* 重置按钮 */}
      {results.length > 0 && results.length < 3 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResults([])}
          >
            重新投这一爻
          </Button>
        </div>
      )}
    </div>
  );
};

interface CoinCastingProps {
  onComplete: (yaoStates: Array<{ sum: number }>) => void;
}

/**
 * 完整的铜钱起卦流程组件
 */
export const CoinCasting: React.FC<CoinCastingProps> = ({ onComplete }) => {
  const [currentYao, setCurrentYao] = useState(1);
  const [yaoResults, setYaoResults] = useState<number[]>([]);

  const handleYaoComplete = (sum: 6 | 7 | 8 | 9) => {
    const newResults = [...yaoResults, sum];
    setYaoResults(newResults);

    if (newResults.length < 6) {
      setCurrentYao(currentYao + 1);
    } else {
      onComplete(newResults.map(sum => ({ sum })));
    }
  };

  // 已完成的爻显示
  const YaoPreview = () => (
    <div className="flex flex-col-reverse gap-1 p-4 bg-muted/50 rounded-lg">
      {[1, 2, 3, 4, 5, 6].map((yaoIndex) => {
        const result = yaoResults[yaoIndex - 1];
        const isYang = result === 7 || result === 9;
        const isMoving = result === 6 || result === 9;
        const isCurrentOrFuture = yaoIndex >= currentYao;

        return (
          <div key={yaoIndex} className="flex items-center gap-2">
            <span className="w-6 text-xs text-muted-foreground text-right">
              {yaoIndex}
            </span>
            <div className="flex-1 h-3">
              {result !== undefined ? (
                <div
                  className={cn(
                    'h-full rounded',
                    isYang ? 'bg-yang' : 'flex gap-2'
                  )}
                >
                  {!isYang && (
                    <>
                      <div className="flex-1 bg-yin rounded" />
                      <div className="flex-1 bg-yin rounded" />
                    </>
                  )}
                </div>
              ) : (
                <div className={cn(
                  'h-full rounded border-2 border-dashed',
                  isCurrentOrFuture ? 'border-primary/50' : 'border-muted'
                )} />
              )}
            </div>
            {isMoving && (
              <span className="text-moving text-xs font-bold">○</span>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* 投币区域 */}
      <div className="space-y-4">
        <ThreeCoins
          yaoIndex={currentYao}
          onComplete={handleYaoComplete}
        />
      </div>

      {/* 预览区域 */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-center">卦象预览</div>
        <YaoPreview />
        <div className="text-center text-sm text-muted-foreground">
          已完成 {yaoResults.length}/6 爻
        </div>
      </div>
    </div>
  );
};

export default CoinCasting;
