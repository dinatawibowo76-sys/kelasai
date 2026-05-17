'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import StudentLayout from '@/components/shared/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface QuizQuestion {
  id: string;
  question: string;
  options: string | null;
  questionType: string;
  points: number;
}

interface QuizData {
  id: string;
  title: string;
  difficulty: string;
  questionType: string;
  questions: QuizQuestion[];
  session: {
    title: string;
    class: {
      className: string;
      educationLevel: string;
    };
  };
}

export default function StudentQuizPage() {
  const { selectedQuizId, studentSession, navigate, setQuizScore } = useAppStore();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!selectedQuizId) return;
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/quiz/${selectedQuizId}?role=student`);
        const data = await res.json();
        if (data.quiz) setQuiz(data.quiz);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [selectedQuizId]);

  const parseOptions = (optionsStr: string | null): string[] => {
    if (!optionsStr) return [];
    try {
      return JSON.parse(optionsStr);
    } catch {
      return [];
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quiz || !studentSession) return;
    setShowConfirm(false);
    setSubmitting(true);

    try {
      const answerArray = quiz.questions.map((q) => ({
        questionId: q.id,
        studentAnswer: answers[q.id] || '',
      }));

      const res = await fetch('/api/quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentSessionId: studentSession.id,
          quizId: quiz.id,
          answers: answerArray,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim jawaban');

      setQuizScore({
        score: data.attempt.score,
        totalPoints: data.attempt.earnedPoints || 0,
      });

      // Store answers data for result page in window temporarily
      (window as Record<string, unknown>).__quizResult = data;

      navigate('student-quiz-result');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim jawaban');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = quiz ? ((currentQuestion + 1) / quiz.questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <StudentLayout title="Quiz" showBack>
        <div className="space-y-4">
          <Progress value={0} className="h-2" />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <StudentLayout title="Quiz" showBack>
        <div className="text-center py-12">
          <p className="text-gray-500">Quiz tidak ditemukan</p>
          <Button className="mt-4" onClick={() => navigate('student-learn')}>Kembali</Button>
        </div>
      </StudentLayout>
    );
  }

  const question = quiz.questions[currentQuestion];
  const options = parseOptions(question.options);

  return (
    <StudentLayout title={quiz.title} showBack>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Soal {currentQuestion + 1} dari {quiz.questions.length}</span>
          <span>{answeredCount}/{quiz.questions.length} dijawab</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-blue-100 shadow-md mb-4">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-700">{currentQuestion + 1}</span>
            </div>
            <p className="text-base font-medium text-gray-800 flex-1">{question.question}</p>
          </div>

          {/* Answer Options */}
          {question.questionType === 'multiple_choice' && options.length > 0 ? (
            <RadioGroup
              value={answers[question.id] || ''}
              onValueChange={(value) => handleAnswer(question.id, value)}
              className="space-y-2"
            >
              {options.map((option, idx) => {
                const optionKey = String.fromCharCode(65 + idx); // A, B, C, D
                return (
                  <Label
                    key={idx}
                    htmlFor={`option-${idx}`}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      answers[question.id] === optionKey
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
                    }`}
                  >
                    <RadioGroupItem value={optionKey} id={`option-${idx}`} />
                    <span className="text-sm text-gray-700">{option}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          ) : question.questionType === 'true_false' ? (
            <RadioGroup
              value={answers[question.id] || ''}
              onValueChange={(value) => handleAnswer(question.id, value)}
              className="flex gap-3"
            >
              {['Benar', 'Salah'].map((option) => (
                <Label
                  key={option}
                  htmlFor={`option-${option}`}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-colors ${
                    answers[question.id] === option
                      ? option === 'Benar'
                        ? 'border-green-400 bg-green-50'
                        : 'border-red-400 bg-red-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <RadioGroupItem value={option} id={`option-${option}`} />
                  <span className="text-sm font-medium">
                    {option === 'Benar' ? <CheckCircle className="w-4 h-4 text-green-600 inline mr-1" /> : <XCircle className="w-4 h-4 text-red-500 inline mr-1" />}
                    {option}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              placeholder="Tulis jawaban kamu di sini..."
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              rows={4}
              className="resize-none"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-11 rounded-xl border-gray-200"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Sebelumnya
        </Button>

        {currentQuestion < quiz.questions.length - 1 ? (
          <Button
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
          >
            Selanjutnya
          </Button>
        ) : (
          <Button
            className="flex-1 h-11 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Selesai & Kumpulkan'}
          </Button>
        )}
      </div>

      {/* Question Navigation Dots */}
      <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
        {quiz.questions.map((_, idx) => (
          <button
            key={idx}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
              idx === currentQuestion
                ? 'bg-blue-600 text-white'
                : answers[quiz.questions[idx].id]
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}
            onClick={() => setCurrentQuestion(idx)}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kumpulkan Jawaban?</DialogTitle>
            <DialogDescription>
              {answeredCount < quiz.questions.length
                ? `Kamu baru menjawab ${answeredCount} dari ${quiz.questions.length} soal. Soal yang tidak dijawab akan dianggap salah.`
                : `Semua ${quiz.questions.length} soal sudah dijawab. Yakin ingin mengumpulkan?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
              Kembali
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSubmit}
            >
              Kumpulkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
