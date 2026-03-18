import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useDailyWords, type VocabularyItem } from '@/hooks/useVocabulary';
import VocabularyCard from '@/components/VocabularyCard';
import WordDetailModal from '@/components/WordDetailModal';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { data: words, isLoading } = useDailyWords();
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-medium tracking-widest uppercase">每日學習</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">今日の五つの言葉</h2>
          <p className="text-muted-foreground">點擊單字即可查看詳情與例句</p>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">載入中...</div>
        ) : !words?.length ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-muted-foreground">尚未有未學習的單字，請先至管理頁面新增。</p>
            <Button asChild>
              <Link to="/admin">前往管理頁面</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {words.map((w, i) => (
                <VocabularyCard key={w.id} item={w} index={i} onClick={() => setSelectedWord(w)} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Button size="lg" asChild>
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
