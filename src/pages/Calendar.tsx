import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cherry } from 'lucide-react';
import { useLearnedWords } from '@/hooks/useVocabulary';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar() {
  const { data: learnedWords, isLoading } = useLearnedWords();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Count learned words per day using learned_at
  const dailyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!learnedWords) return counts;
    learnedWords.forEach((w) => {
      const la = (w as any).learned_at;
      if (!la) return;
      const d = new Date(la);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [learnedWords]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthStamps = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if ((dailyCounts[key] || 0) >= 5) count++;
    }
    return count;
  }, [dailyCounts, year, month, daysInMonth]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = `${year}年${month + 1}月`;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />首頁</Link>
          </Button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-serif mb-1">学習カレンダー</h2>
          <p className="text-muted-foreground text-sm">每日習得 5 個單字即可獲得印章！</p>
        </div>

        {/* Calendar Card */}
        <div className="bg-card border-2 border-primary/20 rounded-xl p-5 shadow-sm">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold font-serif text-foreground">{monthLabel}</h3>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className={`text-center text-xs font-medium py-1 ${d === '日' ? 'text-primary' : d === '土' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const count = dailyCounts[key] || 0;
              const hasStamp = count >= 5;
              const isToday = day === now.getDate();

              return (
                <div
                  key={day}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all
                    ${isToday ? 'ring-2 ring-primary/40' : ''}
                    ${hasStamp ? 'bg-primary/5' : 'hover:bg-accent/30'}
                  `}
                >
                  {hasStamp ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-primary text-lg">🌸</span>
                      <span className="text-[10px] text-muted-foreground">{day}</span>
                    </div>
                  ) : (
                    <>
                      <span className={`font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>{day}</span>
                      {count > 0 && (
                        <span className="text-[9px] text-muted-foreground">{count}字</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Monthly summary */}
          <div className="mt-6 pt-4 border-t border-border text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
              <span className="text-lg">🌸</span>
              <span className="font-serif font-bold text-primary text-lg">{monthStamps}</span>
              <span className="text-sm text-muted-foreground">朵花 / 本月</span>
            </div>
          </div>
        </div>

        {isLoading && (
          <p className="text-center text-muted-foreground mt-8">載入中...</p>
        )}
      </main>
    </div>
  );
}
