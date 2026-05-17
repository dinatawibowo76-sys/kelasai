'use client';

import { useEffect, useRef, useState } from 'react';
import { Trophy, ArrowLeft, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import StudentLayout from '@/components/shared/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnswerResult {
  questionId: string;
  studentAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  points: number;
}

interface QuizResultData {
  attempt: {
    id: string;
    score: number;
    totalPoints: number;
    earnedPoints: number;
  };
  answers: AnswerResult[];
}

export default function StudentQuizResultPage() {
  const { quizScore, navigate, selectedQuizId, studentSession } = useAppStore();
  const [resultData, setResultData] = useState<QuizResultData | null>(null);
  const [questions, setQuestions] = useState<Array<{
    id: string;
    question: string;
    answer: string;
    explanation: string | null;
    points: number;
  }> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initResult = async () => {
      // Try to get from window temporary storage
      const winData = (window as Record<string, unknown>).__quizResult as QuizResultData | undefined;
      if (winData) {
        delete (window as Record<string, unknown>).__quizResult;
        setResultData(winData);
        return;
      }

      // Also try to fetch from API
      if (studentSession) {
        try {
          const res = await fetch(`/api/quiz/attempt?studentSessionId=${studentSession.id}`);
          const data = await res.json();
          if (data.attempts && data.attempts.length > 0) {
            const latest = data.attempts[0];
            setResultData({
              attempt: {
                id: latest.id,
                score: latest.score,
                totalPoints: latest.totalPoints,
                earnedPoints: latest.score,
              },
              answers: latest.answers,
            });
          }
        } catch {
          // silently fail
        }
      }
    };
    initResult();
  }, [studentSession]);

  // Fetch full quiz questions for review
  useEffect(() => {
    if (!selectedQuizId || !resultData) return;
    let cancelled = false;
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/quiz/${selectedQuizId}?role=teacher`);
        const data = await res.json();
        if (!cancelled && data.quiz?.questions) {
          setQuestions(data.quiz.questions);
        }
      } catch {
        // silently fail
      }
    };
    fetchQuestions();
    return () => { cancelled = true; };
  }, [selectedQuizId, resultData]);

  const score = quizScore?.score || resultData?.attempt?.score || 0;
  const totalPoints = resultData?.attempt?.totalPoints || 100;
  const earnedPoints = resultData?.attempt?.earnedPoints || 0;

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = () => {
    if (score >= 80) return 'from-green-50 to-green-100/50';
    if (score >= 60) return 'from-amber-50 to-amber-100/50';
    return 'from-red-50 to-red-100/50';
  };

  const getScoreEmoji = () => {
    if (score >= 90) return '🎉';
    if (score >= 80) return '😊';
    if (score >= 60) return '💪';
    return '📚';
  };

  return (
    <StudentLayout title="Hasil Quiz" showBack>
      {/* Score Display */}
      <Card className={`border-0 shadow-lg bg-gradient-to-br ${getScoreBg()} mb-6`}>
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-2">{getScoreEmoji()}</div>
          <div className={`text-5xl font-bold ${getScoreColor()} mb-1`}>
            {score}
          </div>
          <div className="text-sm text-gray-500 mb-2">
            dari {totalPoints} poin
          </div>
          {earnedPoints > 0 && (
            <Badge variant="outline" className="bg-white/80 text-gray-600">
              {earnedPoints} poin benar
            </Badge>
          )}
          <div className="mt-3">
            {score >= 80 ? (
              <p className="text-sm text-green-700 font-medium">Luar biasa! Kamu menguasai materinya! 🌟</p>
            ) : score >= 60 ? (
              <p className="text-sm text-amber-700 font-medium">Bagus! Terus belajar ya! 💪</p>
            ) : (
              <p className="text-sm text-red-700 font-medium">Jangan menyerah! Coba pelajari lagi ya! 📖</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Answer Review */}
      {resultData?.answers && questions && resultData.answers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Pembahasan Soal
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {resultData.answers.map((answer, idx) => {
              const question = questions.find((q) => q.id === answer.questionId);
              return (
                <Card
                  key={answer.questionId}
                  className={`border ${
                    answer.isCorrect ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        answer.isCorrect ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {answer.isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {question?.question || `Soal ${idx + 1}`}
                        </p>
                        <div className="mt-1 space-y-0.5">
                          <p className={`text-xs ${answer.isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                            Jawaban kamu: {answer.studentAnswer || '(tidak dijawab)'}
                          </p>
                          {!answer.isCorrect && (
                            <p className="text-xs text-green-700 font-medium">
                              Jawaban benar: {answer.correctAnswer}
                            </p>
                          )}
                          {question?.explanation && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              💡 {question.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl text-base"
          onClick={() => navigate('student-learn')}
        >
          <BookOpen className="w-5 h-5 mr-2" />
          Kembali ke Materi
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl border-gray-200"
          onClick={() => navigate('student-join')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Keluar dari Sesi
        </Button>
      </div>

      {/* Trophy decoration for high scores */}
      {score >= 80 && (
        <div className="text-center mt-6 animate-bounce-in">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
        </div>
      )}
    </StudentLayout>
  );
}
