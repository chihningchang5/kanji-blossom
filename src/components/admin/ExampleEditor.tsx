import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ExampleSentence } from '@/hooks/useVocabulary';

interface Props {
  examples: ExampleSentence[];
  onSave: (examples: ExampleSentence[]) => void;
  onCancel: () => void;
}

export default function ExampleEditor({ examples: initial, onSave, onCancel }: Props) {
  const [examples, setExamples] = useState<ExampleSentence[]>(initial.length ? initial : [{ sentence: '', reading: '', translation: '' }]);

  const update = (index: number, field: keyof ExampleSentence, value: string) => {
    setExamples(prev => prev.map((ex, i) => i === index ? { ...ex, [field]: value } : ex));
  };

  const addRow = () => {
    setExamples(prev => [...prev, { sentence: '', reading: '', translation: '' }]);
  };

  const removeRow = (index: number) => {
    setExamples(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const cleaned = examples.filter(ex => ex.sentence.trim());
    onSave(cleaned);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">編輯例句</h4>
      {examples.map((ex, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1">
            <Input
              placeholder="例句（日文）"
              value={ex.sentence}
              onChange={(e) => update(i, 'sentence', e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="讀音（平假名）"
              value={ex.reading}
              onChange={(e) => update(i, 'reading', e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="中文翻譯"
              value={ex.translation}
              onChange={(e) => update(i, 'translation', e.target.value)}
              className="text-sm"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => removeRow(i)} className="text-destructive mt-1">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus className="w-4 h-4 mr-1" />新增例句
      </Button>
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSave}>儲存例句</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>取消</Button>
      </div>
    </div>
  );
}
