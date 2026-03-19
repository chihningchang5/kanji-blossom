import { useState, useCallback } from 'react';
import { speakJapanese } from '@/lib/speech';
import type { VocabularyItem } from '@/hooks/useVocabulary';

interface Props {
  question: VocabularyItem;
  options: VocabularyItem[];
  onAnswer: (correct: boolean, word: VocabularyItem) => void;
}

export default function QuizQuestion({ question, options, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = useCallback((optionId: string) => {
    if (selected) return;
    setSelected(optionId);
    const correct = question.id === optionId;
    speakJapanese(question.word);

    setTimeout(() => {
      setSelected(null);
      onAnswer(correct, question);
    }, 1200);
  }, [selected, question, onAnswer]);

  const isCorrect = selected === question.id;

  return (
    <>
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <span className={`text-9xl font-bold animate-scale-in ${isCorrect ? 'text-primary' : 'text-destructive'}`}>
            {isCorrect ? '○' : '×'}
          </span>
        </div>
      )}

      <div className="text-center mb-12">
        <p className="text-sm text-muted-foreground mb-4">以下漢字的中文意思是？</p>
        <p className="japanese-word text-5xl cursor-pointer" onClick={() => speakJapanese(question.word)}>
          {question.word}
        </p>
        <p className="reading-text mt-2">{question.reading}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((opt) => {
          let cls = 'quiz-option';
          if (selected) {
            if (opt.id === question.id) cls += ' quiz-option-correct';
            else if (opt.id === selected) cls += ' quiz-option-wrong';
          }
          return (
            <button key={opt.id} className={cls} onClick={() => handleSelect(opt.id)}>
              <span className="font-medium">{opt.translation}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
