import { Link } from 'react-router-dom';
import { BookOpen, PenTool, Settings } from 'lucide-react';
import { useDailyWords } from '@/hooks/useVocabulary';
import VocabularyCard from '@/components/VocabularyCard';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { data: words, isLoading } = useDailyWords();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-primary">日</span>本語の単語
          </h1>
          <nav className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/quiz"><PenTool className="w-4 h-4 mr-1" />測驗</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin"><Settings className="w-4 h-4 mr-1" />管理</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-medium tracking-widest uppercase">每日學習</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">今日の五つの言葉</h2>
          <p className="text-muted-foreground">點擊單字即可聽取日文發音</p>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">載入中...</div>
        ) : !words?.length ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-muted-foreground">尚未有單字，請先至管理頁面新增。</p>
            <Button asChild>
              <Link to="/admin">前往管理頁面</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {words.map((w, i) => (
                <VocabularyCard key={w.id} item={w} index={i} />
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
    </div>
  );
};

export default Index;
