import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '六爻占卜 - 基于文王卦的专业排盘系统',
  description: '专业的六爻占卜系统，基于文王卦（京房易）体系，提供准确的排盘与可追溯的解卦分析。',
  keywords: ['六爻', '占卜', '文王卦', '周易', '纳甲', '排盘'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background antialiased')}>
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
