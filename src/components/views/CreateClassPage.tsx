'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TeacherLayout from '@/components/shared/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CreateClassPage() {
  const { teacher, navigate, setSelectedClassId } = useAppStore();
  const [className, setClassName] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !educationLevel) {
      toast.error('Nama kelas dan jenjang pendidikan harus diisi');
      return;
    }
    if (!teacher) {
      toast.error('Anda harus masuk terlebih dahulu');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className,
          educationLevel,
          description: description || undefined,
          teacherId: teacher.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat kelas');

      toast.success('Kelas berhasil dibuat!');
      setSelectedClassId(data.class.id);
      navigate('class-detail');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat kelas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherLayout title="Buat Kelas Baru">
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-500 hover:text-gray-700 -ml-2 mb-4"
        onClick={() => navigate('dashboard')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </Button>

      <Card className="border-blue-100 shadow-md max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Buat Kelas Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="className">Nama Kelas</Label>
              <Input
                id="className"
                placeholder="Contoh: Matematika Kelas 10A"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="educationLevel">Jenjang Pendidikan</Label>
              <Select value={educationLevel} onValueChange={setEducationLevel} disabled={loading}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Pilih jenjang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SD">SD (Sekolah Dasar)</SelectItem>
                  <SelectItem value="SMP">SMP (Sekolah Menengah Pertama)</SelectItem>
                  <SelectItem value="SMA">SMA (Sekolah Menengah Atas)</SelectItem>
                  <SelectItem value="SMK">SMK (Sekolah Menengah Kejuruan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classDesc">Deskripsi <span className="text-gray-400">(opsional)</span></Label>
              <Textarea
                id="classDesc"
                placeholder="Deskripsi singkat tentang kelas ini..."
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
                'Buat Kelas'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TeacherLayout>
  );
}
