import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { QuizResult } from '@/pages/Quiz';

interface Props {
  results: QuizResult[];
  toggleLearned: { mutateAsync: (args: { id: string; is_learned: boolean }) => Promise<void>; isPending: boolean };
  onReset: () => void;
  onNextGroup?: () => void;
  isLoadingNext?: boolean;
}

export default function QuizSummary({ results, toggleLearned, onReset }: Props) {
  // BUG FIX: Build initial checks from results directly — all correct answers are pre-checked
  const [learnedChecks, setLearnedChecks] = useState<Record<string, boolean>>(() => {
    const checks: Record<string, boolean> = {};
    results.forEach(r => { checks[r.word.id] = r.correct; });
    return checks;
  });
  const [submitted, setSubmitted] = useState(false);

  const correctCount = results.filter(r => r.correct).length;

  const handleSubmitLearned = async () => {
    const toMark = Object.entries(learnedChecks).filter(([, v]) => v);
    for (const [id] of toMark) {
      await toggleLearned.mutateAsync({ id, is_learned: true });
    }
    setSubmitted(true);
  };

  if (submitted) {
    const markedCount = Object.values(learnedChecks).filter(Boolean).length;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 animate-fade-in">
        <h2 className="text-3xl font-bold">已更新！</h2>
        <p className="text-muted-foreground text-lg">已將 {markedCount} 個單字標記為已習得。</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onReset}>
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
        {correctCount}/{results.length}
      </div>
      <p className="text-muted-foreground text-lg">
        正確率：{Math.round((correctCount / results.length) * 100)}%
      </p>

      <div className="w-full max-w-md mt-4">
        <h3 className="text-lg font-semibold mb-3 text-center">勾選已掌握的單字：</h3>
        <div className="space-y-3">
          {results.map((r) => (
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
          <Button variant="outline" onClick={onReset}>
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
