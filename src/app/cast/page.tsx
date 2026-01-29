'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CoinCasting } from '@/components/liuyao/CoinFlip';
import { ResultDisplay } from '@/components/liuyao/ResultDisplay';
import { cn } from '@/lib/utils';
import {
  castHexagram,
  createCastingTime,
  coinSumToYaoState,
  createManualYaoState,
  castByTime,
} from '@/lib/liuyao';
import type { YaoState, QuestionCategory, CastingMethod, DivinationResult } from '@/lib/liuyao/types';
import { QUESTION_SUBTYPES } from '@/lib/liuyao/yongshen';
import {
  ArrowLeft,
  ChevronRight,
  Coins,
  Clock,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

const QUESTION_CATEGORIES: { value: QuestionCategory; label: string; emoji: string }[] = [
  { value: 'career', label: '事业工作', emoji: '💼' },
  { value: 'love', label: '感情婚姻', emoji: '💕' },
  { value: 'wealth', label: '财运投资', emoji: '💰' },
  { value: 'health', label: '健康', emoji: '🏥' },
  { value: 'study', label: '学业考试', emoji: '📚' },
  { value: 'lawsuit', label: '诉讼官司', emoji: '⚖️' },
  { value: 'travel', label: '出行', emoji: '✈️' },
  { value: 'lost', label: '失物寻人', emoji: '🔍' },
  { value: 'other', label: '其他', emoji: '📋' },
];

function CastPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 状态
  const [step, setStep] = useState<'category' | 'cast' | 'result'>('category');
  const [method, setMethod] = useState<CastingMethod>('coin');
  const [category, setCategory] = useState<QuestionCategory>('other');
  const [yaoStates, setYaoStates] = useState<YaoState[]>([]);
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 从 URL 获取起卦方式
  useEffect(() => {
    const methodParam = searchParams.get('method') as CastingMethod | null;
    if (methodParam && ['coin', 'time', 'manual'].includes(methodParam)) {
      setMethod(methodParam);
    }
  }, [searchParams]);

  // 选择问事类别
  const handleCategorySelect = (cat: QuestionCategory) => {
    setCategory(cat);
    setStep('cast');
  };

  // 铜钱法完成
  const handleCoinComplete = (results: Array<{ sum: number }>) => {
    const states = results.map(r => coinSumToYaoState(r.sum as 6 | 7 | 8 | 9));
    setYaoStates(states);
    performDivination(states);
  };

  // 时间起卦
  const handleTimeCast = (date: Date) => {
    const states = castByTime(date);
    setYaoStates(states);
    performDivination(states);
  };

  // 手动输入
  const handleManualCast = (states: YaoState[]) => {
    setYaoStates(states);
    performDivination(states);
  };

  // 执行占卜
  const performDivination = (states: YaoState[]) => {
    setIsProcessing(true);

    // 模拟处理延迟，让用户感知到计算过程
    setTimeout(() => {
      const input = {
        method,
        yaoStates: states as [YaoState, YaoState, YaoState, YaoState, YaoState, YaoState],
        time: createCastingTime(new Date()),
        questionCategory: category,
      };

      const divinationResult = castHexagram(input);
      setResult(divinationResult);
      setStep('result');
      setIsProcessing(false);
    }, 500);
  };

  // 重新开始
  const handleReset = () => {
    setStep('category');
    setYaoStates([]);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回首页
            </Button>
          </Link>

          {step !== 'category' && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-1" />
              重新起卦
            </Button>
          )}
        </div>

        {/* 进度指示 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['选择问题', '起卦', '查看结果'].map((label, index) => {
            const stepIndex = ['category', 'cast', 'result'].indexOf(step);
            const isActive = index === stepIndex;
            const isComplete = index < stepIndex;

            return (
              <React.Fragment key={label}>
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    isComplete && 'bg-primary/20 text-primary',
                    !isActive && !isComplete && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? '✓' : index + 1}
                </div>
                {index < 2 && (
                  <div
                    className={cn(
                      'w-12 h-0.5 transition-colors',
                      isComplete ? 'bg-primary/50' : 'bg-muted'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          {/* 步骤1：选择问事类别 */}
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">您想问什么？</h1>
                <p className="text-muted-foreground">
                  选择问事类别有助于系统更准确地分析
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {QUESTION_CATEGORIES.map((cat) => (
                  <Card
                    key={cat.value}
                    className={cn(
                      'cursor-pointer card-hover transition-all',
                      category === cat.value && 'border-primary ring-2 ring-primary/20'
                    )}
                    onClick={() => handleCategorySelect(cat.value)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{cat.emoji}</div>
                      <div className="font-medium">{cat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 起卦方式选择 */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-lg">起卦方式</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={method === 'coin' ? 'default' : 'outline'}
                      onClick={() => setMethod('coin')}
                    >
                      <Coins className="w-4 h-4 mr-1" />
                      铜钱法
                    </Button>
                    <Button
                      variant={method === 'time' ? 'default' : 'outline'}
                      onClick={() => setMethod('time')}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      时间起卦
                    </Button>
                    <Button
                      variant={method === 'manual' ? 'default' : 'outline'}
                      onClick={() => setMethod('manual')}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      手动输入
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 步骤2：起卦 */}
          {step === 'cast' && (
            <motion.div
              key="cast"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">
                  {method === 'coin' && '投掷铜钱'}
                  {method === 'time' && '时间起卦'}
                  {method === 'manual' && '手动输入'}
                </h1>
                <p className="text-muted-foreground">
                  问事类别：{QUESTION_CATEGORIES.find(c => c.value === category)?.label}
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  {method === 'coin' && (
                    <CoinCasting onComplete={handleCoinComplete} />
                  )}

                  {method === 'time' && (
                    <TimeCastingUI onCast={handleTimeCast} />
                  )}

                  {method === 'manual' && (
                    <ManualCastingUI onCast={handleManualCast} />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 步骤3：结果 */}
          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ResultDisplay result={result} />
            </motion.div>
          )}

          {/* 处理中 */}
          {isProcessing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">正在排盘分析...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 时间起卦 UI
const TimeCastingUI: React.FC<{ onCast: (date: Date) => void }> = ({ onCast }) => {
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">选择起卦时间</label>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="w-full max-w-xs mx-auto block p-2 border rounded-lg bg-background"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        默认为当前时间，也可以选择其他时间
      </p>
      <Button onClick={() => onCast(new Date(dateTime))}>
        开始起卦
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
};

// 手动输入 UI
const ManualCastingUI: React.FC<{ onCast: (states: YaoState[]) => void }> = ({ onCast }) => {
  const [yaoStates, setYaoStates] = useState<Array<{ yinYang: '阴' | '阳'; isMoving: boolean }>>(
    Array(6).fill({ yinYang: '阳', isMoving: false })
  );

  const toggleYinYang = (index: number) => {
    const newStates = [...yaoStates];
    newStates[index] = {
      ...newStates[index],
      yinYang: newStates[index].yinYang === '阳' ? '阴' : '阳',
    };
    setYaoStates(newStates);
  };

  const toggleMoving = (index: number) => {
    const newStates = [...yaoStates];
    newStates[index] = {
      ...newStates[index],
      isMoving: !newStates[index].isMoving,
    };
    setYaoStates(newStates);
  };

  const handleSubmit = () => {
    const states = yaoStates.map(s =>
      createManualYaoState(s.yinYang, s.isMoving)
    );
    onCast(states);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {[5, 4, 3, 2, 1, 0].map((index) => (
          <div key={index} className="flex items-center gap-4 justify-center">
            <span className="w-12 text-sm text-muted-foreground">
              {index + 1}爻
            </span>
            <Button
              variant={yaoStates[index].yinYang === '阳' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleYinYang(index)}
            >
              {yaoStates[index].yinYang === '阳' ? '阳 ⚊' : '阴 ⚋'}
            </Button>
            <Button
              variant={yaoStates[index].isMoving ? 'destructive' : 'ghost'}
              size="sm"
              onClick={() => toggleMoving(index)}
            >
              {yaoStates[index].isMoving ? '动' : '静'}
            </Button>
          </div>
        ))}
      </div>
      <div className="text-center">
        <Button onClick={handleSubmit}>
          完成输入
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default function CastPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
      <CastPageContent />
    </Suspense>
  );
}
