'use client';

import { useState } from 'react';
import { GraduationCap, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { navigate, setTeacher } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Nama, email, dan password harus diisi');
      return;
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      // Step 1: Register
      const regRes = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, school }),
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        throw new Error(regData.error || 'Pendaftaran gagal');
      }

      // Step 2: Auto-login using our custom login endpoint
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.teacher) {
        setTeacher({
          id: loginData.teacher.id,
          name: loginData.teacher.name,
          email: loginData.teacher.email,
        });
        toast.success('Pendaftaran berhasil! Selamat datang!');
        navigate('dashboard');
      } else {
        // Registration succeeded but auto-login failed, redirect to login page
        toast.success('Pendaftaran berhasil! Silakan masuk dengan akun Anda.');
        navigate('login');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Pendaftaran gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md shadow-2xl border-0 animate-fade-in-up">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-700">KelasAI</span>
          </div>
          <CardTitle className="text-xl">Daftar Akun Guru</CardTitle>
          <CardDescription>Buat akun untuk mulai mengajar dengan AI</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="Nama guru"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="guru@sekolah.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">Nama Sekolah <span className="text-gray-400">(opsional)</span></Label>
              <Input
                id="school"
                placeholder="SMA Negeri 1 Jakarta"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                disabled={loading}
                className="h-11"
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
                  Mendaftar...
                </>
              ) : (
                'Daftar'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Sudah punya akun?{' '}
              <button
                className="text-blue-600 hover:text-blue-700 font-semibold"
                onClick={() => navigate('login')}
              >
                Masuk
              </button>
            </p>
            <button
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto"
              onClick={() => navigate('landing')}
            >
              <ArrowLeft className="w-3 h-3" />
              Kembali
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
