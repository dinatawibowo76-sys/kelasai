'use client';

import { useState } from 'react';
import { ArrowLeft, Brain, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TeacherLayout from '@/components/shared/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function GenerateQuizPage() {
  const { teacher, selectedSessionId, navigate } = useAppStore();
  const [title, setTitle] = useState('');
  const [questionCount, setQuestionCount] = useState('5');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [loading, setLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<Array<{
    id: string;
    question: string;
    options: string | null;
    answer: string;
    explanation: string | null;
    questionType: string;
    points: number;
  }> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error('Judul quiz harus diisi');
      return;
    }
    if (!teacher || !selectedSessionId) {
      toast.error('Data tidak lengkap');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          title,
          difficulty,
          questionType,
          questionCount: parseInt(questionCount),
          teacherId: teacher.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat quiz');

      setGeneratedQuiz(data.quiz.questions);
      toast.success(`Quiz berhasil dibuat dengan ${data.quiz.questions.length} soal!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat quiz');
    } finally {
      setLoading(false);
    }
  };

  const parseOptions = (optionsStr: string | null): string[] => {
    if (!optionsStr) return [];
    try {
      return JSON.parse(optionsStr);
    } catch {
      return [];
    }
  };

  const getDifficultyLabel = (diff: string) => {
    const labels: Record<string, string> = { easy: 'Mudah', medium: 'Sedang', hard: 'Sulit' };
    return labels[diff] || diff;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      multiple_choice: 'Pilihan Ganda',
      essay: 'Essay',
      true_false: 'Benar/Salah',
      mixed: 'Campuran',
    };
    return labels[type] || type;
  };

  return (
    <TeacherLayout title="Generate Quiz">
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-500 hover:text-gray-700 -ml-2 mb-4"
        onClick={() => navigate('session-detail')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </Button>

      <Card className="border-blue-100 shadow-md max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-blue-600" />
            Generate Quiz AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generatedQuiz ? (
            <div>
              <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-xl">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Quiz berhasil dibuat! {generatedQuiz.length} soal
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {generatedQuiz.map((q, idx) => (
                  <Card key={q.id} className="border-gray-100 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0">
                          {idx + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{q.question}</p>
                          {q.options && parseOptions(q.options).length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {parseOptions(q.options).map((opt, oi) => (
                                <p key={oi} className={`text-xs ${opt.charAt(0) === q.answer ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                                  {opt}
                                </p>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-green-600 mt-1">Jawaban: {q.answer}</p>
                          {q.explanation && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">{q.explanation}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                className="w-full h-11 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                onClick={() => navigate('session-detail')}
              >
                Kembali ke Sesi
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quizTitle">Judul Quiz</Label>
                <Input
                  id="quizTitle"
                  placeholder="Contoh: Quiz Persamaan Kuadrat"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Jumlah Soal</Label>
                <Select value={questionCount} onValueChange={setQuestionCount} disabled={loading}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Soal</SelectItem>
                    <SelectItem value="10">10 Soal</SelectItem>
                    <SelectItem value="15">15 Soal</SelectItem>
                    <SelectItem value="20">20 Soal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tingkat Kesulitan</Label>
                <Select value={difficulty} onValueChange={setDifficulty} disabled={loading}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Mudah</SelectItem>
                    <SelectItem value="medium">Sedang</SelectItem>
                    <SelectItem value="hard">Sulit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipe Soal</Label>
                <Select value={questionType} onValueChange={setQuestionType} disabled={loading}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                    <SelectItem value="true_false">Benar/Salah</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="mixed">Campuran</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-xl">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm text-blue-700">AI sedang membuat soal...</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </TeacherLayout>
  );
}
