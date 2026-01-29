'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Coins,
  Clock,
  Edit3,
  ChevronRight,
  BookOpen,
  Shield,
  Eye,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            基于文王卦体系的专业排盘系统
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            六爻占卜
          </h1>

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            传承千年的智慧，以现代的方式呈现。<br />
            规则准确可追溯，每一步推导都清晰可见。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cast">
              <Button size="lg" className="w-full sm:w-auto">
                立即起卦
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => setShowIntro(!showIntro)}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              了解六爻
            </Button>
          </div>
        </motion.div>
      </section>

      {/* 简介说明（可折叠） */}
      {showIntro && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="container mx-auto px-4 pb-16"
        >
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                什么是六爻占卜？
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                六爻占卜源自中国传统《周易》，是一种通过摇卦来获取信息和建议的方法。
                它不是预测"必然发生什么"，而是帮助你理解"当前的趋势和影响因素"。
              </p>
              <p>
                想象一下，六爻就像是给当前情况拍一张"能量照片"：
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>它能显示你所处的位置（世爻）</li>
                <li>展示外部环境或对方的状态（应爻）</li>
                <li>分析关键因素的强弱（用神旺衰）</li>
                <li>预判可能的发展趋势（动爻变化）</li>
              </ul>
              <p className="font-medium text-foreground">
                本系统的特点：
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>所有结论都基于明确的规则，不是"凭感觉"</li>
                <li>每一步推导都可以展开查看"为什么"</li>
                <li>提供"白话解释"和"专业解释"双层视图</li>
                <li>明确标注不确定因素，不做过度解读</li>
              </ul>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* 起卦方式选择 */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">选择起卦方式</h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* 铜钱法 */}
          <Link href="/cast?method=coin">
            <Card className="h-full card-hover cursor-pointer border-2 border-primary/20 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  三枚铜钱
                  <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
                    推荐
                  </span>
                </CardTitle>
                <CardDescription>
                  最传统、最标准的起卦方式
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• 虚拟投掷三枚铜钱</li>
                  <li>• 重复6次得到完整卦象</li>
                  <li>• 过程有趣，结果可靠</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* 时间起卦 */}
          <Link href="/cast?method=time">
            <Card className="h-full card-hover cursor-pointer hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle>时间起卦</CardTitle>
                <CardDescription>
                  根据起卦时间自动生成
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• 选择日期和时间</li>
                  <li>• 系统自动计算卦象</li>
                  <li>• 适合快速查询</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* 手动输入 */}
          <Link href="/cast?method=manual">
            <Card className="h-full card-hover cursor-pointer hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                  <Edit3 className="w-6 h-6 text-green-500" />
                </div>
                <CardTitle>手动输入</CardTitle>
                <CardDescription>
                  适合导入已有卦例
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• 直接选择每爻阴阳</li>
                  <li>• 标记动爻位置</li>
                  <li>• 适合学习和复盘</li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* 特点说明 */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">规则准确</h3>
            <p className="text-sm text-muted-foreground">
              基于《增删卜易》等传统典籍，所有规则可追溯
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-medium mb-2">透明可查</h3>
            <p className="text-sm text-muted-foreground">
              每一步推导都可以展开查看依据和来源
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-medium mb-2">易于理解</h3>
            <p className="text-sm text-muted-foreground">
              提供白话解释，不懂命理也能看明白
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            本系统仅供参考，不构成任何专业建议。
          </p>
          <p>
            规则来源：《周易》《增删卜易》《卜筮正宗》
          </p>
        </div>
      </footer>
    </div>
  );
}
