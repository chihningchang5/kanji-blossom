import { ExternalLink, Volume2 } from 'lucide-react';
import { speakJapanese } from '@/lib/speech';
import type { VocabularyItem } from '@/hooks/useVocabulary';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  word: VocabularyItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WordDetailModal({ word, open, onOpenChange }: Props) {
  if (!word) return null;

  const examples = Array.isArray(word.examples) ? word.examples : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center space-y-2">
            <div
              className="japanese-word text-5xl cursor-pointer inline-block"
              onClick={() => speakJapanese(word.word)}
            >
              {word.word}
            </div>
            <p className="reading-text">{word.reading}</p>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">{word.translation}</p>
            <span className="inline-block text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium mt-1">
              {word.level}
            </span>
          </div>

          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={() => speakJapanese(word.word)}>
              <Volume2 className="w-4 h-4 mr-1" />發音
            </Button>
          </div>

          {examples.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="text-sm font-semibold text-muted-foreground">例句</h4>
              {examples.map((ex, i) => (
                <div key={i} className="bg-secondary/50 rounded-lg p-3 space-y-1">
                  <p
                    className="font-serif text-base cursor-pointer hover:text-primary transition-colors"
                    onClick={() => speakJapanese(ex.sentence)}
                  >
                    {ex.sentence}
                    <Volume2 className="w-3.5 h-3.5 inline ml-1 text-muted-foreground" />
                  </p>
                  <p className="text-sm text-muted-foreground">{ex.reading}</p>
                  <p className="text-sm text-foreground">{ex.translation}</p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <a
              href={`https://jisho.org/search/${encodeURIComponent(word.word)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              在 Jisho.org 查看更多
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
