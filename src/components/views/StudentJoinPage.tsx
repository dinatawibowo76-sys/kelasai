'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Search, ArrowLeft, Loader2, BookOpen, School } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SessionInfo {
  title: string;
  description: string | null;
  status: string;
  class: {
    className: string;
    educationLevel: string;
  };
}

export default function StudentJoinPage() {
  const { navigate, setStudentSession } = useAppStore();
  const [sessionCode, setSessionCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [step, setStep] = useState<'code' | 'join'>('code');

  // Check URL hash for direct join link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#join=')) {
      const code = hash.replace('#join=', '');
      setSessionCode(code);
    }
  }, []);

  const handleSearch = async () => {
    if (!sessionCode.trim()) {
      toast.error('Masukkan kode sesi');
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/sessions/by-code?code=${encodeURIComponent(sessionCode.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sesi tidak ditemukan');

      setSessionInfo(data.session);
      setStep('join');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sesi tidak ditemukan');
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async () => {
    if (!studentName.trim()) {
      toast.error('Nama harus diisi');
      return;
    }
    if (!sessionCode.trim()) {
      toast.error('Kode sesi diperlukan');
      return;
    }
    setJoining(true);
    try {
      const res = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionCode: sessionCode.trim(),
          studentName: studentName.trim(),
          studentNumber: studentNumber.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal bergabung');

      setStudentSession({
        id: data.studentSession.id,
        studentName: studentName.trim(),
        sessionId: data.session.id,
        sessionCode: data.session.sessionCode,
      });
      toast.success('Berhasil bergabung!');
      navigate('student-learn');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal bergabung ke sesi');
    } finally {
      setJoining(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-blue-700">KelasAI</span>
          </div>
          {step === 'join' && (
            <button
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
              onClick={() => { setStep('code'); setSessionInfo(null); }}
            >
              <ArrowLeft className="w-3 h-3" /> Kembali
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-gray-800">Masuk ke Sesi Belajar</h1>
            <p className="text-sm text-gray-500 mt-1">Masukkan kode dari guru Anda</p>
          </div>

          {step === 'code' ? (
            <Card className="border-blue-100 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionCode" className="text-base font-medium">Kode Sesi</Label>
                    <Input
                      id="sessionCode"
                      placeholder="Masukkan kode sesi"
                      value={sessionCode}
                      onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="h-12 text-center text-lg font-mono tracking-widest uppercase"
                      maxLength={8}
                    />
                  </div>
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl text-base"
                    onClick={handleSearch}
                    disabled={searching || !sessionCode.trim()}
                  >
                    {searching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Cari Sesi
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 animate-fade-in-up">
              {/* Session Info Card */}
              {sessionInfo && (
                <Card className="border-blue-100 shadow-lg bg-gradient-to-r from-blue-50 to-white">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-800">{sessionInfo.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={getEducationBadge(sessionInfo.class.educationLevel)}>
                        {sessionInfo.class.educationLevel}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <School className="w-3 h-3" /> {sessionInfo.class.className}
                      </span>
                    </div>
                    {sessionInfo.description && (
                      <p className="text-xs text-gray-400 mt-2">{sessionInfo.description}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Join Form */}
              <Card className="border-blue-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentName" className="text-base font-medium">Nama Siswa</Label>
                      <Input
                        id="studentName"
                        placeholder="Masukkan nama kamu"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentNumber" className="text-sm">
                        Nomor Absen <span className="text-gray-400">(opsional)</span>
                      </Label>
                      <Input
                        id="studentNumber"
                        placeholder="Contoh: 15"
                        value={studentNumber}
                        onChange={(e) => setStudentNumber(e.target.value)}
                        className="h-11"
                        maxLength={3}
                      />
                    </div>
                    <Button
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl text-base"
                      onClick={handleJoin}
                      disabled={joining || !studentName.trim()}
                    >
                      {joining ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Mulai Belajar'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Back to landing */}
          <div className="text-center mt-6">
            <button
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto"
              onClick={() => navigate('landing')}
            >
              <ArrowLeft className="w-3 h-3" /> Kembali ke halaman utama
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
