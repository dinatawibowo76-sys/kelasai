'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Plus, Clock, FileText, Brain, Users, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TeacherLayout from '@/components/shared/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface SessionItem {
  id: string;
  title: string;
  sessionCode: string;
  status: string;
  description: string | null;
  createdAt: string;
  _count: {
    materials: number;
    studentSessions: number;
    quizzes: number;
  };
}

export default function ClassDetailPage() {
  const { selectedClassId, navigate, setSelectedSessionId, pageParams } = useAppStore();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<{
    className: string;
    educationLevel: string;
    classCode: string;
    description: string | null;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const classId = selectedClassId || pageParams.classId;

  useEffect(() => {
    if (!classId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/sessions?classId=${classId}`);
        const data = await res.json();
        if (data.sessions) {
          setSessions(data.sessions);
          // Extract class info from the first session if available
          if (data.sessions.length > 0) {
            // We need to fetch class details separately
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  // Fetch class info
  useEffect(() => {
    if (!classId) return;
    const fetchClass = async () => {
      try {
        const res = await fetch(`/api/classes?teacherId=${useAppStore.getState().teacher?.id}`);
        const data = await res.json();
        const cls = data.classes?.find((c: { id: string }) => c.id === classId);
        if (cls) {
          setClassInfo({
            className: cls.className,
            educationLevel: cls.educationLevel,
            classCode: cls.classCode,
            description: cls.description,
          });
        }
      } catch {
        // silently fail
      }
    };
    fetchClass();
  }, [classId]);

  const handleCopyCode = () => {
    if (classInfo?.classCode) {
      navigator.clipboard.writeText(classInfo.classCode);
      setCopiedCode(true);
      toast.success('Kode kelas disalin!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    navigate('session-detail');
  };

  const getEducationBadge = (level: string) => {
    const colors: Record<string, string> = {
      SD: 'bg-green-50 text-green-700 border-green-200',
      SMP: 'bg-blue-50 text-blue-700 border-blue-200',
      SMA: 'bg-purple-50 text-purple-700 border-purple-200',
      SMK: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return colors[level] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <TeacherLayout title={classInfo?.className || 'Detail Kelas'}>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-500 hover:text-gray-700 -ml-2 mb-3"
        onClick={() => navigate('dashboard')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </Button>

      {/* Class Info Card */}
      <Card className="border-blue-100 shadow-md mb-6 bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                {classInfo?.className || 'Memuat...'}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {classInfo?.educationLevel && (
                  <Badge variant="outline" className={getEducationBadge(classInfo.educationLevel)}>
                    {classInfo.educationLevel}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Kode: {classInfo?.classCode || '...'}
                </Badge>
              </div>
              {classInfo?.description && (
                <p className="text-sm text-gray-500 mt-2">{classInfo.description}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={handleCopyCode}
            >
              {copiedCode ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copiedCode ? 'Disalin!' : 'Salin Kode'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Button
        className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-md mb-6"
        onClick={() => navigate('create-session')}
      >
        <Plus className="w-4 h-4 mr-2" />
        Buat Sesi Baru
      </Button>

      {/* Sessions List */}
      <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-600" />
        Sesi Pembelajaran
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gray-100">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-blue-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Belum ada sesi</p>
            <p className="text-sm text-gray-400 mt-1">Buat sesi pertama untuk mulai mengajar</p>
            <Button
              className="mt-4 bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('create-session')}
            >
              <Plus className="w-4 h-4 mr-1" /> Buat Sesi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 stagger-children">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
              onClick={() => handleSessionClick(session.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 truncate">{session.title}</h4>
                    {session.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{session.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {session._count.materials} materi
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {session._count.studentSessions} siswa
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Brain className="w-3 h-3" /> {session._count.quizzes} quiz
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <Badge
                      variant={session.status === 'active' ? 'default' : 'secondary'}
                      className={session.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                      }
                    >
                      {session.status === 'active' ? 'Aktif' : 'Ditutup'}
                    </Badge>
                    <div className="text-xs text-gray-400 mt-1">
                      <code className="font-mono">{session.sessionCode}</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TeacherLayout>
  );
}
