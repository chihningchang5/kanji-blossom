import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useDailyWords, useVocabulary, useToggleLearned, type VocabularyItem } from '@/hooks/useVocabulary';
import { speakJapanese } from '@/lib/speech';
import { Button } from '@/components/ui/button';
import QuizQuestion from '@/components/quiz/QuizQuestion';
import ReadingToKanjiQuestion from '@/components/quiz/ReadingToKanjiQuestion';
import QuizSummary from '@/components/quiz/QuizSummary';
import ClozeQuestion from '@/components/quiz/ClozeQuestion';

export interface QuizItem {
  question: VocabularyItem;
  options: VocabularyItem[];
}

export interface QuizResult {
  correct: boolean;
  word: VocabularyItem;
}

const QUIZ_ATTEMPT_KEY = 'quiz-attempt-count';
const QUIZ_ATTEMPT_DATE_KEY = 'quiz-attempt-date';

function getAttemptCount(): number {
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(QUIZ_ATTEMPT_DATE_KEY);
  if (storedDate !== today) return 0;
  return parseInt(localStorage.getItem(QUIZ_ATTEMPT_KEY) || '0', 10);
}

function incrementAttempt(): number {
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(QUIZ_ATTEMPT_DATE_KEY);
  let count = 1;
  if (storedDate === today) {
    count = parseInt(localStorage.getItem(QUIZ_ATTEMPT_KEY) || '0', 10) + 1;
  }
  localStorage.setItem(QUIZ_ATTEMPT_DATE_KEY, today);
  localStorage.setItem(QUIZ_ATTEMPT_KEY, String(count));
  return count;
}

function generateQuiz(dailyWords: VocabularyItem[], allWords: VocabularyItem[]): QuizItem[] {
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
  const [results, setResults] = useState<QuizResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [attemptCount, setAttemptCount] = useState(getAttemptCount);
  // Quiz mode: 0 = kanji→translation, 1 = reading→kanji, 2+ = cloze
  const quizMode = attemptCount === 0 ? 'basic' : attemptCount === 1 ? 'reading' : 'cloze';

  const quiz = useMemo(() => {
    if (!dailyWords?.length || !allWords?.length || allWords.length < 4) return [];
    return generateQuiz(dailyWords, allWords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyWords?.map(w => w.id).join(','), allWords?.length]);

  const handleAnswer = useCallback((correct: boolean, word: VocabularyItem) => {
    const newResults = [...results, { correct, word }];
    setResults(newResults);

    if (current + 1 >= quiz.length) {
      setFinished(true);
      incrementAttempt();
      setAttemptCount(getAttemptCount());
    } else {
      setCurrent(c => c + 1);
    }
  }, [current, quiz.length, results]);

  const reset = () => {
    setCurrent(0);
    setResults([]);
    setFinished(false);
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
    return (
      <QuizSummary
        results={results}
        toggleLearned={toggleLearned}
        onReset={reset}
      />
    );
  }

  const q = quiz[current];
  const hasExamples = q.question.examples && q.question.examples.length > 0;
  const useMode = quizMode === 'cloze' && hasExamples ? 'cloze' : quizMode === 'reading' ? 'reading' : 'basic';

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />返回</Link>
          </Button>
          <div className="flex items-center gap-3">
            {useMode === 'cloze' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                填空模式
              </span>
            )}
            {useMode === 'reading' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                讀音→漢字
              </span>
            )}
            <span className="text-sm text-muted-foreground">{current + 1} / {quiz.length}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-xl mx-auto px-4 py-16">
        {useMode === 'cloze' ? (
          <ClozeQuestion question={q.question} options={q.options} onAnswer={handleAnswer} />
        ) : useMode === 'reading' ? (
          <ReadingToKanjiQuestion question={q.question} options={q.options} onAnswer={handleAnswer} />
        ) : (
          <QuizQuestion question={q.question} options={q.options} onAnswer={handleAnswer} />
        )}
      </main>
    </div>
  );
}
