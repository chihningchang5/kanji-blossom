import { Volume2 } from 'lucide-react';
import { speakJapanese } from '@/lib/speech';
import type { VocabularyItem } from '@/hooks/useVocabulary';

interface Props {
  item: VocabularyItem;
  index: number;
}

export default function VocabularyCard({ item, index }: Props) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-8 text-center space-y-3 animate-fade-in cursor-pointer group"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() => speakJapanese(item.word)}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="japanese-word">{item.word}</span>
        <Volume2 className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="reading-text">{item.reading}</p>
      <p className="text-foreground font-medium">{item.translation}</p>
      <span className="inline-block text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
        {item.level}
      </span>
    </div>
  );
}
