import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, BookCheck, Swords } from 'lucide-react';
import { useLearnedWords, useVocabulary, useToggleLearned, useMarkReviewed, type VocabularyItem } from '@/hooks/useVocabulary';
import AppHeader from '@/components/AppHeader';
import { speakJapanese } from '@/lib/speech';
import { Button } from '@/components/ui/button';
import WordDetailModal from '@/components/WordDetailModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type QuizMode = 'A' | 'B';

interface ReviewQuestion {
  word: VocabularyItem;
  mode: QuizMode;
  options: string[];
  answer: string;
}

function generateReviewQuiz(learned: VocabularyItem[], all: VocabularyItem[], count: number): ReviewQuestion[] {
  // Priority: last_reviewed_at NULL first, then oldest last_reviewed_at, then oldest learned_at
  const sorted = [...learned].sort((a, b) => {
    const ra = a.last_reviewed_at ? new Date(a.last_reviewed_at).getTime() : 0;
    const rb = b.last_reviewed_at ? new Date(b.last_reviewed_at).getTime() : 0;
    if (ra !== rb) return ra - rb; // NULL (0) first, then oldest
    const la = a.learned_at ? new Date(a.learned_at).getTime() : 0;
    const lb = b.learned_at ? new Date(b.learned_at).getTime() : 0;
    return la - lb;
  });
  const selected = sorted.slice(0, count);

  return selected.map((word) => {
    const mode: QuizMode = Math.random() > 0.5 ? 'A' : 'B';
    const others = all.filter((w) => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3);

    if (mode === 'A') {
      const answer = word.translation;
      const options = [...others.map((o) => o.translation), answer].sort(() => Math.random() - 0.5);
      return { word, mode, options, answer };
    } else {
      const answer = word.reading;
      const options = [...others.map((o) => o.reading), answer].sort(() => Math.random() - 0.5);
      return { word, mode, options, answer };
    }
  });
}

export default function Learned() {
  const { data: learnedWords, isLoading: l1, isError: e1, error: er1 } = useLearnedWords();
  const { data: allWords, isLoading: l2, isError: e2 } = useVocabulary();
  const toggleLearned = useToggleLearned();
  const markReviewed = useMarkReviewed();

  const [showQuiz, setShowQuiz] = useState(false);
  const [showCountPicker, setShowCountPicker] = useState(false);
  const [quizCount, setQuizCount] = useState(10);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<VocabularyItem[]>([]);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [unlearnPrompt, setUnlearnPrompt] = useState<VocabularyItem[] | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);

  const quiz = useMemo(() => {
    if (!showQuiz || !learnedWords?.length || !allWords?.length || allWords.length < 4) return [];
    return generateReviewQuiz(learnedWords, allWords, quizCount);
  }, [showQuiz, learnedWords, allWords, quizCount]);

  const advance = useCallback(() => {
    if (current + 1 >= quiz.length) {
      setFinished(true);
      // Mark all reviewed words' last_reviewed_at
      const reviewedIds = quiz.map(q => q.word.id);
      markReviewed.mutate(reviewedIds);
      if (wrongAnswers.length > 0) {
        setUnlearnPrompt(wrongAnswers);
      }
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }, [current, quiz, wrongAnswers, markReviewed]);

  const handleSelect = useCallback((option: string) => {
    if (selected) return;
    const correct = option === quiz[current].answer;
    setSelected(option);
    speakJapanese(quiz[current].word.word);

    setTimeout(() => {
      setResults((prev) => [...prev, correct]);
      if (!correct) {
        setWrongAnswers((prev) => [...prev, quiz[current].word]);
      }
      advance();
    }, 1200);
  }, [selected, quiz, current, advance]);

  const handleUnlearn = (doUnlearn: boolean) => {
    if (doUnlearn && unlearnPrompt) {
      unlearnPrompt.forEach((w) => toggleLearned.mutate({ id: w.id, is_learned: false }));
    }
    setUnlearnPrompt(null);
  };

  const resetQuiz = () => {
    setCurrent(0);
    setSelected(null);
    setResults([]);
    setWrongAnswers([]);
    setFinished(false);
    setShowQuiz(true);
  };

  const stopQuiz = () => {
    setShowQuiz(false);
    setShowCountPicker(false);
    setCurrent(0);
    setSelected(null);
    setResults([]);
    setWrongAnswers([]);
    setFinished(false);
  };

  const startQuiz = (count: number) => {
    setQuizCount(count);
    setShowCountPicker(false);
    setShowQuiz(true);
    setCurrent(0);
    setSelected(null);
    setResults([]);
    setWrongAnswers([]);
    setFinished(false);
  };

  if (l1 || l2) return <div className="min-h-screen flex items-center justify-center px-4 text-center text-muted-foreground">連線中...</div>;
  if (e1 || e2) return <div className="min-h-screen flex flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground"><p>連線失敗，請稍後再試</p><p className="text-xs">{er1 instanceof Error ? er1.message : ''}</p></div>;

  // Count picker dialog
  if (showCountPicker) {
    const total = learnedWords?.length || 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center animate-fade-in">
        <h2 className="text-2xl font-bold font-serif">複習測驗</h2>
        <p className="text-sm text-muted-foreground">選擇本次複習題數（優先出最久未複習的單字）</p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          {[10, 20].filter(n => n <= total).map(n => (
            <Button key={n} variant="outline" className="text-lg" onClick={() => startQuiz(n)}>
              {n} 題
            </Button>
          ))}
          <Button variant="outline" className="text-lg" onClick={() => startQuiz(total)}>
            全部（{total} 題）
          </Button>
          <Button variant="ghost" onClick={stopQuiz} className="mt-2">取消</Button>
        </div>
      </div>
    );
  }

  // Review quiz view
  if (showQuiz) {
    if (!quiz.length) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-muted-foreground">需要至少 4 個單字才能開始複習測驗。</p>
          <Button onClick={stopQuiz}>返回已習得列表</Button>
        </div>
      );
    }

    if (finished) {
      const correctCount = results.filter(Boolean).length;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">複習完成！</h2>
          <div className="text-5xl font-serif font-bold text-primary sm:text-6xl">
            {correctCount}/{results.length}
          </div>
          <p className="text-lg text-muted-foreground">
            正確率：{Math.round((correctCount / results.length) * 100)}%
          </p>
          {wrongAnswers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              答錯 {wrongAnswers.length} 題：{wrongAnswers.map((w) => w.word).join('、')}
            </p>
          )}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="outline" onClick={resetQuiz}>
              <RotateCcw className="w-4 h-4 mr-1" />再試一次
            </Button>
            <Button onClick={stopQuiz}>返回已習得列表</Button>
          </div>

          <Dialog open={!!unlearnPrompt} onOpenChange={() => handleUnlearn(false)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>移回未學習？</DialogTitle>
                <DialogDescription>
                  以下單字答錯了，是否移回「未學習」狀態重新練習？
                  <br />
                  <strong>{unlearnPrompt?.map((w) => w.word).join('、')}</strong>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => handleUnlearn(false)}>保持已習得</Button>
                <Button variant="destructive" onClick={() => handleUnlearn(true)}>移回未學習</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    const q = quiz[current];
    const isCorrect = selected === q.answer;

    return (
      <div className="min-h-screen">
        <header className="border-b border-border">
          <div className="container mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
            <Button variant="ghost" size="sm" onClick={stopQuiz}>
              <ArrowLeft className="w-4 h-4 mr-1" />返回
            </Button>
            <span className="text-sm text-muted-foreground">{current + 1} / {quiz.length}</span>
          </div>
        </header>

        <main className="container mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
          {selected && (
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
              <span className={`text-7xl font-bold animate-scale-in sm:text-9xl ${isCorrect ? 'text-primary' : 'text-destructive'}`}>
                {isCorrect ? '○' : '×'}
              </span>
            </div>
          )}

          <div className="mb-10 text-center sm:mb-12">
            <p className="text-sm text-muted-foreground mb-4">
              {q.mode === 'A' ? '以下平假名的中文意思是？' : '以下中文對應的平假名是？'}
            </p>
            <p
              className="japanese-word cursor-pointer break-all text-4xl sm:text-5xl"
              onClick={() => speakJapanese(q.word.word)}
            >
              {q.mode === 'A' ? q.word.reading : q.word.translation}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt, i) => {
              let cls = 'quiz-option';
              if (selected) {
                if (opt === q.answer) cls += ' quiz-option-correct';
                else if (opt === selected) cls += ' quiz-option-wrong';
              }
              return (
                <button key={i} className={cls} onClick={() => handleSelect(opt)}>
                  <span className="font-medium">{opt}</span>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // Learned words list view
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="container mx-auto flex max-w-5xl justify-end px-4 py-4 sm:px-6">
          {learnedWords && learnedWords.length >= 4 && (
            <Button size="sm" className="w-full sm:w-auto" onClick={() => setShowCountPicker(true)}>
              <Swords className="w-4 h-4 mr-1" />複習測驗
            </Button>
          )}
      </div>

      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-10 text-center sm:mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <BookCheck className="w-5 h-5" />
            <span className="text-sm font-medium tracking-widest uppercase">已習得單字</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">掌握済みの言葉</h2>
          <p className="text-muted-foreground">
            已習得 {learnedWords?.length || 0} 個單字
          </p>
        </div>

        {!learnedWords?.length ? (
          <div className="space-y-4 py-20 text-center">
            <p className="text-muted-foreground">尚未有已習得的單字。</p>
            <p className="text-sm text-muted-foreground">在測驗中答對後，可將單字標記為已習得。</p>
            <Button asChild>
              <Link to="/quiz">前往測驗</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {learnedWords.map((w, i) => (
              <div
                key={w.id}
                className="group relative cursor-pointer space-y-2 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-colors animate-fade-in hover:border-primary sm:p-6"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => setSelectedWord(w)}
              >
                <p className="font-serif text-2xl font-semibold">{w.word}</p>
                <p className="text-sm text-muted-foreground">{w.reading}</p>
                <p className="text-sm text-foreground">{w.translation}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {w.level}
                  </span>
                </div>
                {w.learned_at && (
                  <p className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    習得：{new Date(w.learned_at).toLocaleDateString('zh-TW')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <WordDetailModal
        word={selectedWord}
        open={!!selectedWord}
        onOpenChange={(open) => !open && setSelectedWord(null)}
      />
    </div>
  );
}
