import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useDailyWords, useVocabulary, useToggleLearned, type VocabularyItem } from '@/hooks/useVocabulary';
import AppHeader from '@/components/AppHeader';
import { speakJapanese } from '@/lib/speech';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

function generateQuiz(dailyWords: VocabularyItem[], allWords: VocabularyItem[]) {
  return dailyWords.map((word) => {
    const wrongOptions = allWords
      .filter((w) => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [...wrongOptions, word].sort(() => Math.random() - 0.5);
    return { question: word, options };
  });
}

export default function Quiz() {
  const { data: dailyWords, isLoading: l1 } = useDailyWords();
  const { data: allWords, isLoading: l2 } = useVocabulary();
  const toggleLearned = useToggleLearned();

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<{ correct: boolean; word: VocabularyItem }[]>([]);
  const [finished, setFinished] = useState(false);
  const [learnedChecks, setLearnedChecks] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const quiz = useMemo(() => {
    if (!dailyWords?.length || !allWords?.length || allWords.length < 4) return [];
    return generateQuiz(dailyWords, allWords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyWords?.map(w => w.id).join(','), allWords?.length]);

  const advance = useCallback(() => {
    if (current + 1 >= quiz.length) {
      setFinished(true);
      // Pre-check correct answers
      const checks: Record<string, boolean> = {};
      results.forEach(r => { checks[r.word.id] = r.correct; });
      // Include current (last) answer
      const lastCorrect = quiz[current].question.id === selected;
      checks[quiz[current].question.id] = lastCorrect;
      setLearnedChecks(checks);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }, [current, quiz, results, selected]);

  const handleSelect = useCallback((optionId: string) => {
    if (selected) return;
    setSelected(optionId);
    const correct = quiz[current].question.id === optionId;
    speakJapanese(quiz[current].question.word);

    setTimeout(() => {
      setResults((prev) => [...prev, { correct, word: quiz[current].question }]);
      advance();
    }, 1200);
  }, [selected, quiz, current, advance]);

  const handleSubmitLearned = async () => {
    const toMark = Object.entries(learnedChecks).filter(([, v]) => v);
    for (const [id] of toMark) {
      await toggleLearned.mutateAsync({ id, is_learned: true });
    }
    setSubmitted(true);
  };

  const reset = () => {
    setCurrent(0);
    setSelected(null);
    setResults([]);
    setFinished(false);
    setLearnedChecks({});
    setSubmitted(false);
  };

  if (l1 || l2) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">載入中...</div>;

  if (!quiz.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">需要至少 4 個單字才能開始測驗。</p>
        <Button asChild><Link to="/admin">前往新增單字</Link></Button>
      </div>
    );
  }

  // Summary screen
  if (finished) {
    const allResults = results;
    const correctCount = allResults.filter((r) => r.correct).length;

    if (submitted) {
      const markedCount = Object.values(learnedChecks).filter(Boolean).length;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 animate-fade-in">
          <h2 className="text-3xl font-bold">已更新！</h2>
          <p className="text-muted-foreground text-lg">已將 {markedCount} 個單字標記為已習得。</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" />再試一次
            </Button>
            <Button asChild><Link to="/">回到首頁</Link></Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 animate-fade-in">
        <h2 className="text-4xl font-bold">測驗完成！</h2>
        <div className="text-6xl font-serif font-bold text-primary">
          {correctCount}/{allResults.length}
        </div>
        <p className="text-muted-foreground text-lg">
          正確率：{Math.round((correctCount / allResults.length) * 100)}%
        </p>

        <div className="w-full max-w-md mt-4">
          <h3 className="text-lg font-semibold mb-3 text-center">勾選已掌握的單字：</h3>
          <div className="space-y-3">
            {allResults.map((r) => (
              <label
                key={r.word.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <Checkbox
                  checked={learnedChecks[r.word.id] ?? false}
                  onCheckedChange={(checked) =>
                    setLearnedChecks((prev) => ({ ...prev, [r.word.id]: !!checked }))
                  }
                />
                <span className="japanese-word text-xl">{r.word.word}</span>
                <span className="reading-text text-sm">{r.word.reading}</span>
                <span className="text-sm text-muted-foreground ml-auto">{r.word.translation}</span>
                <span className={`text-lg font-bold ${r.correct ? 'text-primary' : 'text-destructive'}`}>
                  {r.correct ? '○' : '×'}
                </span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 mt-6 justify-center">
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" />重新測驗
            </Button>
            <Button onClick={handleSubmitLearned} disabled={toggleLearned.isPending}>
              確認送出 ✓
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const q = quiz[current];
  const isCorrect = selected === q.question.id;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />返回</Link>
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
          <p className="text-sm text-muted-foreground mb-4">以下漢字的中文意思是？</p>
          <p className="japanese-word text-5xl cursor-pointer" onClick={() => speakJapanese(q.question.word)}>
            {q.question.word}
          </p>
          <p className="reading-text mt-2">{q.question.reading}</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {q.options.map((opt) => {
            let cls = 'quiz-option';
            if (selected) {
              if (opt.id === q.question.id) cls += ' quiz-option-correct';
              else if (opt.id === selected) cls += ' quiz-option-wrong';
            }
            return (
              <button key={opt.id} className={cls} onClick={() => handleSelect(opt.id)}>
                <span className="font-medium">{opt.translation}</span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
