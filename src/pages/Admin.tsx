import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Upload } from 'lucide-react';
import { useVocabulary, useAddVocabulary, useUpdateVocabulary, useBulkImport, type VocabularyItem } from '@/hooks/useVocabulary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5'];

function EditForm({ initial, onSubmit, submitLabel }: {
  initial?: Partial<VocabularyItem>;
  onSubmit: (data: { word: string; reading: string; translation: string; level: string }) => void;
  submitLabel: string;
}) {
  const [word, setWord] = useState(initial?.word || '');
  const [reading, setReading] = useState(initial?.reading || '');
  const [translation, setTranslation] = useState(initial?.translation || '');
  const [level, setLevel] = useState(initial?.level || 'N5');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !reading.trim() || !translation.trim()) {
      toast.error('請填寫所有欄位');
      return;
    }
    onSubmit({ word: word.trim(), reading: reading.trim(), translation: translation.trim(), level });
    if (!initial?.id) {
      setWord(''); setReading(''); setTranslation('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
      <Input placeholder="漢字" value={word} onChange={(e) => setWord(e.target.value)} className="w-28" />
      <Input placeholder="平假名" value={reading} onChange={(e) => setReading(e.target.value)} className="w-32" />
      <Input placeholder="中文翻譯" value={translation} onChange={(e) => setTranslation(e.target.value)} className="w-32" />
      <select value={level} onChange={(e) => setLevel(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <Button type="submit" size="sm">{submitLabel}</Button>
    </form>
  );
}

export default function Admin() {
  const { data: words, isLoading } = useVocabulary();
  const addMut = useAddVocabulary();
  const updateMut = useUpdateVocabulary();
  const bulkMut = useBulkImport();
  const [jsonText, setJsonText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = (data: { word: string; reading: string; translation: string; level: string }) => {
    addMut.mutate({ ...data, examples: [] }, {
      onSuccess: () => toast.success('新增成功！'),
      onError: (e) => toast.error('新增失敗：' + e.message),
    });
  };

  const handleUpdate = (id: string) => (data: { word: string; reading: string; translation: string; level: string }) => {
    updateMut.mutate({ id, ...data }, {
      onSuccess: () => { toast.success('更新成功！'); setEditingId(null); },
      onError: (e) => toast.error('更新失敗：' + e.message),
    });
  };

  const handleBulkImport = () => {
    try {
      const items = JSON.parse(jsonText);
      if (!Array.isArray(items)) throw new Error('請提供 JSON 陣列');
      for (const item of items) {
        if (!item.word || !item.reading || !item.translation || !item.level) {
          throw new Error('每個項目需包含 word, reading, translation, level');
        }
        if (!LEVELS.includes(item.level)) {
          throw new Error(`無效的 level: ${item.level}`);
        }
      }
      const cleaned = items.map(({ word, reading, translation, level }: any) => ({
        word: String(word).trim(),
        reading: String(reading).trim(),
        translation: String(translation).trim(),
        level: String(level).trim(),
      }));
      bulkMut.mutate(cleaned, {
        onSuccess: () => { toast.success(`成功匯入 ${cleaned.length} 個單字！`); setJsonText(''); },
        onError: (e) => toast.error('匯入失敗：' + e.message),
      });
    } catch (e: any) {
      toast.error('JSON 格式錯誤：' + e.message);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />返回首頁</Link>
          </Button>
          <h1 className="text-xl font-bold">單字管理</h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Add new word */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />手動新增單字
          </h2>
          <EditForm onSubmit={handleAdd} submitLabel="新增" />
        </section>

        {/* Bulk import */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />AI 批次匯入
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            貼上 JSON 格式的單字列表，可包含 examples 欄位：
            <code className="block mt-1 p-2 bg-secondary rounded text-xs whitespace-pre-wrap">
              {'[{"word":"猫","reading":"ねこ","translation":"貓","level":"N5","examples":[{"sentence":"猫が好きです","reading":"ねこがすきです","translation":"我喜歡貓"}]}]'}
            </code>
          </p>
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='[{"word":"猫","reading":"ねこ","translation":"貓","level":"N5"}]'
            rows={6}
          />
          <Button className="mt-3" onClick={handleBulkImport} disabled={bulkMut.isPending || !jsonText.trim()}>
            {bulkMut.isPending ? '匯入中...' : '批次匯入'}
          </Button>
        </section>

        {/* Word list */}
        <section>
          <h2 className="text-lg font-semibold mb-4">現有單字 ({words?.length || 0})</h2>
          {isLoading ? (
            <p className="text-muted-foreground">載入中...</p>
          ) : !words?.length ? (
            <p className="text-muted-foreground">尚無單字。</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">漢字</th>
                    <th className="text-left px-4 py-2 font-medium">讀音</th>
                    <th className="text-left px-4 py-2 font-medium">翻譯</th>
                    <th className="text-left px-4 py-2 font-medium">等級</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {words.map((w) => (
                    <tr key={w.id} className="border-t border-border">
                      {editingId === w.id ? (
                        <td colSpan={5} className="px-4 py-3">
                          <EditForm initial={w} onSubmit={handleUpdate(w.id)} submitLabel="更新" />
                          <Button variant="ghost" size="sm" className="mt-1" onClick={() => setEditingId(null)}>取消</Button>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-2 font-serif font-semibold">{w.word}</td>
                          <td className="px-4 py-2">{w.reading}</td>
                          <td className="px-4 py-2">{w.translation}</td>
                          <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{w.level}</span></td>
                          <td className="px-4 py-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingId(w.id)}>編輯</Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
