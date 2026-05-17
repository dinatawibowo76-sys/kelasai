'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TeacherLayout from '@/components/shared/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CreateSessionPage() {
  const { teacher, selectedClassId, navigate, setSelectedSessionId } = useAppStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error('Judul sesi harus diisi');
      return;
    }
    if (!teacher || !selectedClassId) {
      toast.error('Data tidak lengkap. Kembali dan coba lagi.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          title,
          description: description || undefined,
          teacherId: teacher.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat sesi');

      toast.success('Sesi berhasil dibuat!');
      setSelectedSessionId(data.session.id);
      navigate('session-detail');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat sesi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherLayout title="Buat Sesi Baru">
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-500 hover:text-gray-700 -ml-2 mb-4"
        onClick={() => navigate('class-detail')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </Button>

      <Card className="border-blue-100 shadow-md max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            Buat Sesi Pembelajaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTitle">Judul Sesi</Label>
              <Input
                id="sessionTitle"
                placeholder="Contoh: Pertemuan 1 - Persamaan Kuadrat"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionDesc">Deskripsi <span className="text-gray-400">(opsional)</span></Label>
              <Textarea
                id="sessionDesc"
                placeholder="Deskripsi singkat tentang sesi ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Membuat...
                </>
              ) : (
                'Buat Sesi'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TeacherLayout>
  );
}
