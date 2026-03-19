import { useState, useMemo, useCallback } from 'react';
import type { VocabularyItem, ExampleSentence } from '@/hooks/useVocabulary';

interface Props {
  question: VocabularyItem;
  options: VocabularyItem[];
  onAnswer: (correct: boolean, word: VocabularyItem) => void;
}

export default function ClozeQuestion({ question, options, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const example = useMemo(() => {
    const examples = question.examples || [];
    if (!examples.length) return null;
    return examples[Math.floor(Math.random() * examples.length)];
  }, [question]);

  const cloze = useMemo(() => {
    if (!example) return '';
    return example.sentence.replace(question.word, '＿＿＿＿');
  }, [example, question.word]);

  const handleSelect = useCallback((optionId: string) => {
    if (selected) return;
    setSelected(optionId);
    const correct = question.id === optionId;

    setTimeout(() => {
      setSelected(null);
      onAnswer(correct, question);
    }, 1200);
  }, [selected, question, onAnswer]);

  const isCorrect = selected === question.id;

  if (!example) return null;

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
        <p className="text-sm text-muted-foreground mb-4">請選出正確填入空格的詞彙</p>
        <p className="text-2xl font-serif leading-relaxed mb-3">{cloze}</p>
        <p className="reading-text text-base">{example.reading}</p>
        <p className="text-sm text-muted-foreground mt-2">{example.translation}</p>
      </div>

      {selected && (
        <div className="text-center mb-6 animate-fade-in">
          <p className="text-sm text-muted-foreground">原句：</p>
          <p className="font-serif text-lg">{example.sentence}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {options.map((opt) => {
          let cls = 'quiz-option';
          if (selected) {
            if (opt.id === question.id) cls += ' quiz-option-correct';
            else if (opt.id === selected) cls += ' quiz-option-wrong';
          }
          return (
            <button key={opt.id} className={cls} onClick={() => handleSelect(opt.id)}>
              <span className="font-medium font-serif text-lg">{opt.word}</span>
              <span className="text-sm text-muted-foreground ml-2">{opt.reading}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
