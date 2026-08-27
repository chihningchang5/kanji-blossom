import { Volume2 } from 'lucide-react';
import { speakJapanese } from '@/lib/speech';
import type { VocabularyItem } from '@/hooks/useVocabulary';

interface Props {
  item: VocabularyItem;
  index: number;
  onClick?: () => void;
}

export default function VocabularyCard({ item, index, onClick }: Props) {
  return (
    <div
      className="group cursor-pointer rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all duration-200 animate-fade-in hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md sm:p-8"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={onClick}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="japanese-word text-3xl sm:text-4xl" onClick={(e) => { e.stopPropagation(); speakJapanese(item.word); }}>
          {item.word}
        </span>
        <Volume2 className="h-5 w-5 text-muted-foreground opacity-70 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" aria-hidden="true" />
      </div>
      <p className="reading-text">{item.reading}</p>
      <p className="text-foreground font-medium">{item.translation}</p>
      <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        {item.level}
      </span>
    </div>
  );
}
