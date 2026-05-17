'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Check, FileText, Brain, Users, Clock, Upload, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TeacherLayout from '@/components/shared/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface SessionDetail {
  id: string;
  title: string;
  sessionCode: string;
  status: string;
  description: string | null;
  class: {
    id: string;
    className: string;
    educationLevel: string;
    teacherId: string;
  };
  materials: Array<{
    id: string;
    fileName: string;
    fileType: string;
    createdAt: string;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    difficulty: string;
    questionType: string;
    createdAt: string;
    _count: { questions: number };
  }>;
  _count: {
    studentSessions: number;
  };
}

export default function SessionDetailPage() {
  const { selectedSessionId, navigate, pageParams } = useAppStore();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [students, setStudents] = useState<Array<{ id: string; studentName: string; studentNumber: string | null; joinedAt: string }>>([]);

  const sessionId = selectedSessionId || pageParams.sessionId;

  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  const handleCopyLink = () => {
    if (session?.sessionCode) {
      const link = `${window.location.origin}/#join=${session.sessionCode}`;
      navigator.clipboard.writeText(link);
      setCopiedCode(true);
      toast.success('Link sesi disalin! Bagikan ke siswa via WhatsApp.');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getDifficultyBadge = (diff: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-50 text-green-700 border-green-200',
      medium: 'bg-amber-50 text-amber-700 border-amber-200',
      hard: 'bg-red-50 text-red-700 border-red-200',
    };
    const labels: Record<string, string> = { easy: 'Mudah', medium: 'Sedang', hard: 'Sulit' };
    return { className: colors[diff] || colors.medium, label: labels[diff] || diff };
  };

  if (loading) {
    return (
      <TeacherLayout title="Detail Sesi">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </TeacherLayout>
    );
  }

  if (!session) {
    return (
      <TeacherLayout title="Sesi Tidak Ditemukan">
        <div className="text-center py-12">
          <p className="text-gray-500">Sesi tidak ditemukan</p>
          <Button className="mt-4" onClick={() => navigate('dashboard')}>Kembali</Button>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title={session.title}>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-500 hover:text-gray-700 -ml-2 mb-3"
        onClick={() => navigate('class-detail')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Kelas
      </Button>

      {/* Session Info Card */}
      <Card className="border-blue-100 shadow-md mb-6 bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">{session.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {session.class.className} • {session.class.educationLevel}
              </p>
              {session.description && (
                <p className="text-sm text-gray-400 mt-1">{session.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={session.status === 'active' ? 'default' : 'secondary'}
                  className={session.status === 'active'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                  }
                >
                  {session.status === 'active' ? 'Aktif' : 'Ditutup'}
                </Badge>
                <span className="text-xs text-gray-400">
                  <Users className="w-3 h-3 inline mr-1" />
                  {session._count.studentSessions} siswa
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={handleCopyLink}
            >
              {copiedCode ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copiedCode ? 'Disalin!' : 'Bagikan Link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="materi" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="materi" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span className="hidden sm:inline">Materi</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Brain className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="siswa" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span className="hidden sm:inline">Siswa</span>
          </TabsTrigger>
          <TabsTrigger value="aktivitas" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span className="hidden sm:inline">Aktivitas</span>
          </TabsTrigger>
        </TabsList>

        {/* Materi Tab */}
        <TabsContent value="materi" className="mt-4">
          <Button
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl mb-4"
            onClick={() => navigate('upload-material')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Materi
          </Button>
          {session.materials.length === 0 ? (
            <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
              <CardContent className="p-6 text-center">
                <FileText className="w-10 h-10 text-blue-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Belum ada materi diunggah</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {session.materials.map((material) => (
                <Card key={material.id} className="border-gray-100 shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{material.fileName}</p>
                      <p className="text-xs text-gray-400 uppercase">{material.fileType}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="mt-4">
          <Button
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl mb-4"
            onClick={() => navigate('generate-quiz')}
          >
            <Brain className="w-4 h-4 mr-2" />
            Generate Quiz
          </Button>
          {session.quizzes.length === 0 ? (
            <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
              <CardContent className="p-6 text-center">
                <Brain className="w-10 h-10 text-blue-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Belum ada quiz</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {session.quizzes.map((quiz) => {
                const diff = getDifficultyBadge(quiz.difficulty);
                return (
                  <Card key={quiz.id} className="border-gray-100 shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{quiz.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={diff.className}>
                            {diff.label}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {quiz._count.questions} soal
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Siswa Tab */}
        <TabsContent value="siswa" className="mt-4">
          {session._count.studentSessions === 0 ? (
            <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
              <CardContent className="p-6 text-center">
                <Users className="w-10 h-10 text-blue-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Belum ada siswa yang bergabung</p>
                <p className="text-xs text-gray-400 mt-1">Bagikan kode sesi <code className="font-mono text-blue-600">{session.sessionCode}</code> ke siswa</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-2">{session._count.studentSessions} siswa telah bergabung</p>
                <p className="text-xs text-gray-400">Lihat detail di halaman analitik</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aktivitas Tab */}
        <TabsContent value="aktivitas" className="mt-4">
          <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
            <CardContent className="p-6 text-center">
              <Clock className="w-10 h-10 text-blue-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aktivitas terbaru akan muncul di sini</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-blue-200 text-blue-600"
                onClick={() => navigate('analytics')}
              >
                Lihat Analitik
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </TeacherLayout>
  );
}
