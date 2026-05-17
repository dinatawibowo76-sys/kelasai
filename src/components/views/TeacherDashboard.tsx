'use client';

import { useEffect, useState } from 'react';
import { Plus, BookOpen, Users, Brain, Clock, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TeacherLayout from '@/components/shared/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ClassItem {
  id: string;
  className: string;
  educationLevel: string;
  classCode: string;
  description: string | null;
  createdAt: string;
  _count: { sessions: number };
}

export default function TeacherDashboard() {
  const { teacher, navigate, setSelectedClassId } = useAppStore();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalActiveSessions: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    if (!teacher) return;
    const fetchData = async () => {
      try {
        const [classesRes, analyticsRes] = await Promise.all([
          fetch(`/api/classes?teacherId=${teacher.id}`),
          fetch(`/api/analytics?teacherId=${teacher.id}`),
        ]);
        const classesData = await classesRes.json();
        const analyticsData = await analyticsRes.json();

        if (classesData.classes) setClasses(classesData.classes);
        if (analyticsData.analytics) {
          setStats({
            totalClasses: analyticsData.analytics.totalClasses,
            totalActiveSessions: analyticsData.analytics.totalActiveSessions,
            totalStudents: analyticsData.analytics.totalStudents,
          });
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teacher]);

  const handleClassClick = (classId: string) => {
    setSelectedClassId(classId);
    navigate('class-detail');
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
    <TeacherLayout title="Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Selamat datang, {teacher?.name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-sm text-gray-500 mt-1">Kelola kelas dan sesi belajar Anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <Card className="border-blue-100 shadow-sm">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-10 mx-auto" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-blue-700">{stats.totalClasses}</div>
            )}
            <div className="text-xs text-gray-500">Kelas</div>
          </CardContent>
        </Card>
        <Card className="border-green-100 shadow-sm">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-10 mx-auto" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-green-700">{stats.totalActiveSessions}</div>
            )}
            <div className="text-xs text-gray-500">Sesi Aktif</div>
          </CardContent>
        </Card>
        <Card className="border-purple-100 shadow-sm">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center mx-auto mb-2">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-10 mx-auto" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-purple-700">{stats.totalStudents}</div>
            )}
            <div className="text-xs text-gray-500">Siswa</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <Button
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-md"
          onClick={() => navigate('create-class')}
        >
          <Plus className="w-5 h-5 mr-2" />
          Buat Kelas Baru
        </Button>
      </div>

      {/* Classes List */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-600" />
          Kelas Anda
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
        ) : classes.length === 0 ? (
          <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Belum ada kelas</p>
              <p className="text-sm text-gray-400 mt-1">Buat kelas pertama Anda untuk mulai mengajar</p>
              <Button
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('create-class')}
              >
                <Plus className="w-4 h-4 mr-1" /> Buat Kelas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 stagger-children">
            {classes.map((cls) => (
              <Card
                key={cls.id}
                className="border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => handleClassClick(cls.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">{cls.className}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getEducationBadge(cls.educationLevel)}>
                          {cls.educationLevel}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {cls._count.sessions} sesi
                        </span>
                      </div>
                      {cls.description && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{cls.description}</p>
                      )}
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <div className="text-xs text-gray-400">Kode</div>
                      <code className="text-sm font-mono font-semibold text-blue-600">{cls.classCode}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
