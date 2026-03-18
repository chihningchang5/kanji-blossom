import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, BookCheck, Swords } from 'lucide-react';
import { useLearnedWords, useVocabulary, useToggleLearned, type VocabularyItem } from '@/hooks/useVocabulary';
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

type QuizMode = 'A' | 'B'; // A: reading→translation, B: translation→reading

interface ReviewQuestion {
  word: VocabularyItem;
  mode: QuizMode;
  options: string[];
  answer: string;
}

function generateReviewQuiz(learned: VocabularyItem[], all: VocabularyItem[]): ReviewQuestion[] {
  return learned.map((word) => {
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
  const { data: learnedWords, isLoading: l1 } = useLearnedWords();
  const { data: allWords, isLoading: l2 } = useVocabulary();
  const toggleLearned = useToggleLearned();

  const [showQuiz, setShowQuiz] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<VocabularyItem[]>([]);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [unlearnPrompt, setUnlearnPrompt] = useState<VocabularyItem[] | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);

  const quiz = useMemo(() => {
    if (!showQuiz || !learnedWords?.length || !allWords?.length || allWords.length < 4) return [];
    return generateReviewQuiz(learnedWords, allWords);
  }, [showQuiz, learnedWords, allWords]);

  const advance = useCallback(() => {
    if (current + 1 >= quiz.length) {
      setFinished(true);
      if (wrongAnswers.length > 0) {
        setUnlearnPrompt(wrongAnswers);
      }
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }, [current, quiz.length, wrongAnswers]);

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
    setCurrent(0);
    setSelected(null);
    setResults([]);
    setWrongAnswers([]);
    setFinished(false);
  };

  if (l1 || l2) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">載入中...</div>;

  // Review quiz view
  if (showQuiz) {
    if (!quiz.length) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">需要至少 4 個單字才能開始複習測驗。</p>
          <Button onClick={stopQuiz}>返回已習得列表</Button>
        </div>
      );
    }

    if (finished) {
      const correctCount = results.filter(Boolean).length;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6">
          <h2 className="text-4xl font-bold">複習完成！</h2>
          <div className="text-6xl font-serif font-bold text-primary">
            {correctCount}/{results.length}
          </div>
          <p className="text-muted-foreground text-lg">
            正確率：{Math.round((correctCount / results.length) * 100)}%
          </p>
          {wrongAnswers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              答錯 {wrongAnswers.length} 題：{wrongAnswers.map((w) => w.word).join('、')}
            </p>
          )}
          <div className="flex gap-3">
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
          <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={stopQuiz}>
              <ArrowLeft className="w-4 h-4 mr-1" />返回
            </Button>
            <span className="text-sm text-muted-foreground">{current + 1} / {quiz.length}</span>
          </div>
        </header>

        <main className="container max-w-xl mx-auto px-4 py-16">
          {selected && (
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
              <span className={`text-9xl font-bold animate-scale-in ${isCorrect ? 'text-primary' : 'text-destructive'}`}>
                {isCorrect ? '○' : '×'}
              </span>
            </div>
          )}

          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground mb-4">
              {q.mode === 'A' ? '以下平假名的中文意思是？' : '以下中文對應的平假名是？'}
            </p>
            <p
              className="japanese-word text-5xl cursor-pointer"
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
      <header className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />返回首頁</Link>
          </Button>
          {learnedWords && learnedWords.length >= 4 && (
            <Button size="sm" onClick={() => setShowQuiz(true)}>
              <Swords className="w-4 h-4 mr-1" />複習測驗
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
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
          <div className="text-center py-20 space-y-4">
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
                className="bg-card border border-border rounded-lg p-6 text-center space-y-2 animate-fade-in cursor-pointer hover:border-primary transition-colors"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => setSelectedWord(w)}
              >
                <p className="font-serif text-2xl font-semibold">{w.word}</p>
                <p className="text-sm text-muted-foreground">{w.reading}</p>
                <p className="text-sm text-foreground">{w.translation}</p>
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {w.level}
                </span>
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
