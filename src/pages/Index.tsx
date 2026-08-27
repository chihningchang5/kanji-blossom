import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays } from 'lucide-react';
import { useDailyWords, type VocabularyItem } from '@/hooks/useVocabulary';
import VocabularyCard from '@/components/VocabularyCard';
import WordDetailModal from '@/components/WordDetailModal';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { data: words, isLoading } = useDailyWords();
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/35">
      <AppHeader />

      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-10 rounded-3xl border border-border/70 bg-card/80 px-5 py-8 text-center shadow-sm sm:mb-12 sm:px-8 sm:py-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] sm:text-sm">每日學習</span>
          </div>
          <h2 className="mb-3 text-3xl font-bold sm:text-4xl">今日の五つの言葉</h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            每天只專注五個單字，先理解、再發音、再測驗。點一下卡片就能看例句與更多細節。
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/quiz">開始今日測驗</Link>
            </Button>
            <Link to="/calendar" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              學習集點卡
            </Link>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold sm:text-xl">今日單字卡</h3>
            <p className="text-sm text-muted-foreground">先看、先聽，再進入測驗。</p>
          </div>
          <div className="hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground sm:block">
            5 words a day
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">載入中...</div>
        ) : !words?.length ? (
          <div className="space-y-4 py-20 text-center">
            <p className="text-muted-foreground">尚未有未學習的單字，請先至管理頁面新增。</p>
            <Button asChild>
              <Link to="/admin">前往管理頁面</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {words.map((w, i) => (
                <VocabularyCard key={w.id} item={w} index={i} onClick={() => setSelectedWord(w)} />
              ))}
            </div>
            <div className="mt-10 text-center sm:mt-12">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/quiz">開始測驗 →</Link>
              </Button>
            </div>
          </>
        )}
      </main>

      <WordDetailModal
        word={selectedWord}
        open={!!selectedWord}
        onOpenChange={(open) => !open && setSelectedWord(null)}
      />
    </div>
  );
};

export default Index;
