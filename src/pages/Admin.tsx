import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload, Trash2, Pencil, Gift } from 'lucide-react';
import { useVocabulary, useAddVocabulary, useUpdateVocabulary, useDeleteVocabulary, useBulkImport, type VocabularyItem, type ExampleSentence } from '@/hooks/useVocabulary';
import { useRewards, useAddReward, useDeleteReward } from '@/hooks/useRewards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppHeader from '@/components/AppHeader';
import { toast } from 'sonner';
import ExampleEditor from '@/components/admin/ExampleEditor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  const deleteMut = useDeleteVocabulary();
  const bulkMut = useBulkImport();
  const { data: rewards, isLoading: rewardsLoading } = useRewards();
  const addReward = useAddReward();
  const deleteReward = useDeleteReward();
  const [jsonText, setJsonText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingExamplesId, setEditingExamplesId] = useState<string | null>(null);
  const [rewardUrl, setRewardUrl] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardDays, setRewardDays] = useState('25');

  const publicWords = words?.filter(w => w.is_public) || [];

  const handleAdd = (data: { word: string; reading: string; translation: string; level: string }) => {
    // Check for duplicate (same word + reading)
    const existing = publicWords.find(w => w.word === data.word && w.reading === data.reading);
    if (existing) {
      updateMut.mutate({ id: existing.id, ...data }, {
        onSuccess: () => toast.success('已合併更新同名單字！'),
        onError: (e) => toast.error('更新失敗：' + e.message),
      });
      return;
    }
    addMut.mutate({ ...data, examples: [], is_public: true }, {
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

  const handleDelete = (id: string) => {
    deleteMut.mutate(id, {
      onSuccess: () => toast.success('刪除成功！'),
      onError: (e) => toast.error('刪除失敗：' + e.message),
    });
  };

  const handleSaveExamples = (id: string, examples: ExampleSentence[]) => {
    updateMut.mutate({ id, examples } as any, {
      onSuccess: () => { toast.success('例句已更新！'); setEditingExamplesId(null); },
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

      // Deduplicate: merge items with same word+reading, keep last
      const uniqueMap = new Map<string, any>();
      for (const item of items) {
        const key = `${item.word}|${item.reading}`;
        uniqueMap.set(key, item);
      }

      // Check against existing words
      const toInsert: any[] = [];
      const toUpdate: { id: string; data: any }[] = [];

      for (const item of uniqueMap.values()) {
        const existing = publicWords.find(w => w.word === item.word && w.reading === item.reading);
        const cleaned = {
          word: String(item.word).trim(),
          reading: String(item.reading).trim(),
          translation: String(item.translation).trim(),
          level: String(item.level).trim(),
          examples: Array.isArray(item.examples) ? item.examples : [],
          is_public: true,
        };
        if (existing) {
          toUpdate.push({ id: existing.id, data: cleaned });
        } else {
          toInsert.push(cleaned);
        }
      }

      // Process updates
      const updatePromises = toUpdate.map(({ id, data }) =>
        updateMut.mutateAsync({ id, ...data } as any)
      );

      Promise.all(updatePromises).then(() => {
        if (toInsert.length > 0) {
          bulkMut.mutate(toInsert, {
            onSuccess: () => {
              toast.success(`新增 ${toInsert.length} 個、更新 ${toUpdate.length} 個單字！`);
              setJsonText('');
            },
            onError: (e) => toast.error('匯入失敗：' + e.message),
          });
        } else {
          toast.success(`更新 ${toUpdate.length} 個已存在的單字！`);
          setJsonText('');
        }
      }).catch((e) => toast.error('更新失敗：' + e.message));

    } catch (e: any) {
      toast.error('JSON 格式錯誤：' + e.message);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-10">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />手動新增公共庫單字
          </h2>
          <p className="text-xs text-muted-foreground mb-2">若漢字與讀音相同，將自動合併更新。</p>
          <EditForm onSubmit={handleAdd} submitLabel="新增" />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />批次匯入公共庫
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            貼上 JSON 格式的單字列表（重複漢字+讀音將自動合併）：
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

        <section>
          <h2 className="text-lg font-semibold mb-4">公共庫單字 ({publicWords.length})</h2>
          {isLoading ? (
            <p className="text-muted-foreground">載入中...</p>
          ) : !publicWords.length ? (
            <p className="text-muted-foreground">尚無公共庫單字。</p>
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
                  {publicWords.map((w) => (
                    <tr key={w.id} className="border-t border-border">
                      {editingId === w.id ? (
                        <td colSpan={5} className="px-4 py-3">
                          <EditForm initial={w} onSubmit={handleUpdate(w.id)} submitLabel="更新" />
                          <Button variant="ghost" size="sm" className="mt-1" onClick={() => setEditingId(null)}>取消</Button>
                        </td>
                      ) : editingExamplesId === w.id ? (
                        <td colSpan={5} className="px-4 py-3">
                          <ExampleEditor
                            examples={w.examples || []}
                            onSave={(examples) => handleSaveExamples(w.id, examples)}
                            onCancel={() => setEditingExamplesId(null)}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-2 font-serif font-semibold">{w.word}</td>
                          <td className="px-4 py-2">{w.reading}</td>
                          <td className="px-4 py-2">{w.translation}</td>
                          <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{w.level}</span></td>
                          <td className="px-4 py-2 flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditingId(w.id)}>編輯</Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingExamplesId(w.id)}>
                              <Pencil className="w-4 h-4 mr-1" />例句
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>確認刪除</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    確定要刪除「{w.word}」嗎？此操作無法復原。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(w.id)}>刪除</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
        {/* Reward Management */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />獎勵圖片管理
          </h2>
          <div className="flex flex-wrap gap-2 items-end mb-4">
            <Input placeholder="圖片 URL" value={rewardUrl} onChange={(e) => setRewardUrl(e.target.value)} className="w-64" />
            <Input placeholder="說明文字" value={rewardDesc} onChange={(e) => setRewardDesc(e.target.value)} className="w-40" />
            <Input placeholder="解鎖天數" type="number" value={rewardDays} onChange={(e) => setRewardDays(e.target.value)} className="w-24" />
            <Button size="sm" onClick={() => {
              if (!rewardUrl.trim()) { toast.error('請填入圖片 URL'); return; }
              addReward.mutate({ image_url: rewardUrl.trim(), description: rewardDesc.trim() || '神秘獎勵', unlock_days: Number(rewardDays) || 25 }, {
                onSuccess: () => { toast.success('獎勵已新增！'); setRewardUrl(''); setRewardDesc(''); setRewardDays('25'); },
                onError: (e) => toast.error('新增失敗：' + e.message),
              });
            }} disabled={addReward.isPending}>新增獎勵</Button>
          </div>

          {rewardsLoading ? (
            <p className="text-muted-foreground">載入中...</p>
          ) : !rewards?.length ? (
            <p className="text-muted-foreground">尚無獎勵。</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rewards.map((r) => (
                <div key={r.id} className="border border-border rounded-lg p-3 bg-card">
                  <div className="w-full h-32 flex items-center justify-center bg-background rounded mb-2 overflow-hidden">
                    <img src={r.image_url} alt={r.description} className="max-w-full max-h-full object-contain" />
                  </div>
                  <p className="text-sm font-medium">{r.description}</p>
                  <p className="text-xs text-muted-foreground">解鎖天數：{r.unlock_days}</p>
                  <Button variant="ghost" size="sm" className="text-destructive mt-1" onClick={() => deleteReward.mutate(r.id, {
                    onSuccess: () => toast.success('已刪除'),
                    onError: (e) => toast.error(e.message),
                  })}>
                    <Trash2 className="w-4 h-4 mr-1" />刪除
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
