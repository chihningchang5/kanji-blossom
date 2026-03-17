import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useDailyWords, useVocabulary, useToggleLearned, type VocabularyItem } from '@/hooks/useVocabulary';
import { speakJapanese } from '@/lib/speech';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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
  const [learnPrompt, setLearnPrompt] = useState<VocabularyItem | null>(null);

  const quiz = useMemo(() => {
    if (!dailyWords?.length || !allWords?.length || allWords.length < 4) return [];
    return generateQuiz(dailyWords, allWords);
  }, [dailyWords, allWords]);

  const advance = useCallback(() => {
    if (current + 1 >= quiz.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }, [current, quiz.length]);

  const handleSelect = useCallback((optionId: string) => {
    if (selected) return;
    const correct = quiz[current].question.id === optionId;
    setSelected(optionId);
    speakJapanese(quiz[current].question.word);

    setTimeout(() => {
      setResults((prev) => [...prev, { correct, word: quiz[current].question }]);
      if (correct) {
        setLearnPrompt(quiz[current].question);
      } else {
        advance();
      }
    }, 1200);
  }, [selected, quiz, current, advance]);

  const handleLearnResponse = (learned: boolean) => {
    if (learned && learnPrompt) {
      toggleLearned.mutate({ id: learnPrompt.id, is_learned: true });
    }
    setLearnPrompt(null);
    advance();
  };

  const reset = () => {
    setCurrent(0);
    setSelected(null);
    setResults([]);
    setFinished(false);
    setLearnPrompt(null);
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

  if (finished) {
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h2 className="text-4xl font-bold">測驗完成！</h2>
        <div className="text-6xl font-serif font-bold text-primary">
          {correctCount}/{results.length}
        </div>
        <p className="text-muted-foreground text-lg">
          正確率：{Math.round((correctCount / results.length) * 100)}%
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" />再試一次
          </Button>
          <Button asChild><Link to="/">回到首頁</Link></Button>
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

      <Dialog open={!!learnPrompt} onOpenChange={() => handleLearnResponse(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>已掌握此單字？</DialogTitle>
            <DialogDescription>
              「{learnPrompt?.word}」回答正確！是否將此單字標記為已習得？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => handleLearnResponse(false)}>
              還沒
            </Button>
            <Button onClick={() => handleLearnResponse(true)}>
              已掌握 ✓
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
