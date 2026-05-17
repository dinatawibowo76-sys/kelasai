'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Users, Brain, BarChart3, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TeacherLayout from '@/components/shared/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  totalClasses: number;
  totalActiveSessions: number;
  totalSessions: number;
  totalStudents: number;
  recentActivity: Array<{
    id: string;
    message: string;
    role: string;
    studentName: string;
    sessionTitle: string;
    createdAt: string;
  }>;
  quizPerformance: Array<{
    quizId: string;
    title: string;
    averageScore: number;
    attemptCount: number;
  }>;
  sessionStats: Array<{
    id: string;
    title: string;
    sessionCode: string;
    status: string;
    className: string;
    studentCount: number;
    createdAt: string;
  }>;
}

export default function AnalyticsPage() {
  const { teacher, navigate } = useAppStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacher) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/analytics?teacherId=${teacher.id}`);
        const data = await res.json();
        if (data.analytics) setAnalytics(data.analytics);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teacher]);

  return (
    <TeacherLayout title="Analitik">
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-500 hover:text-gray-700 -ml-2 mb-4"
        onClick={() => navigate('dashboard')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </Button>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="border-blue-100 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-1">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            {loading ? <Skeleton className="h-6 w-8 mx-auto" /> : (
              <div className="text-xl font-bold text-blue-700">{analytics?.totalClasses || 0}</div>
            )}
            <div className="text-xs text-gray-500">Kelas</div>
          </CardContent>
        </Card>
        <Card className="border-green-100 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-1">
              <BarChart3 className="w-4 h-4 text-green-600" />
            </div>
            {loading ? <Skeleton className="h-6 w-8 mx-auto" /> : (
              <div className="text-xl font-bold text-green-700">{analytics?.totalSessions || 0}</div>
            )}
            <div className="text-xs text-gray-500">Sesi</div>
          </CardContent>
        </Card>
        <Card className="border-purple-100 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mx-auto mb-1">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            {loading ? <Skeleton className="h-6 w-8 mx-auto" /> : (
              <div className="text-xl font-bold text-purple-700">{analytics?.totalStudents || 0}</div>
            )}
            <div className="text-xs text-gray-500">Siswa</div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mx-auto mb-1">
              <Brain className="w-4 h-4 text-amber-600" />
            </div>
            {loading ? <Skeleton className="h-6 w-8 mx-auto" /> : (
              <div className="text-xl font-bold text-amber-700">{analytics?.quizPerformance?.length || 0}</div>
            )}
            <div className="text-xs text-gray-500">Quiz</div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Performance Chart */}
      <Card className="border-blue-100 shadow-md mb-6">
        <CardContent className="p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600" />
            Rata-rata Nilai Quiz
          </h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : analytics?.quizPerformance && analytics.quizPerformance.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.quizPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="title"
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    formatter={(value: number) => [`${value}%`, 'Rata-rata']}
                  />
                  <Bar dataKey="averageScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              Belum ada data quiz
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Stats */}
      <Card className="border-blue-100 shadow-md mb-6">
        <CardContent className="p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Statistik Sesi
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : analytics?.sessionStats && analytics.sessionStats.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.sessionStats.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                    <p className="text-xs text-gray-400">{s.className}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {s.studentCount}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {s.status === 'active' ? 'Aktif' : 'Tutup'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada data sesi</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-blue-100 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Aktivitas Terbaru
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.recentActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    act.role === 'ai' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <span className="text-xs">{act.role === 'ai' ? '🤖' : '👤'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700">{act.studentName}</p>
                    <p className="text-xs text-gray-500 truncate">{act.message}</p>
                    <p className="text-xs text-gray-400">{act.sessionTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada aktivitas</p>
          )}
        </CardContent>
      </Card>
    </TeacherLayout>
  );
}
