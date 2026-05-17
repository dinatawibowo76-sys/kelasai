'use client';

import { GraduationCap, Sparkles, Zap, Users, BookOpen, School } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  const { navigate } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-12 sm:py-20 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in-up">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">KelasAI</h1>
          </div>

          {/* Tagline */}
          <h2 className="text-xl sm:text-2xl font-medium mb-3 animate-fade-in-up" style={{ animationDelay: '75ms' }}>
            AI Tutor untuk Sekolah Indonesia
          </h2>

          {/* Description */}
          <p className="text-blue-100 text-base sm:text-lg max-w-xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            Guru membuat sesi belajar AI, siswa masuk hanya dengan nama. 
            Belajar jadi lebih mudah dan menyenangkan!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '225ms' }}>
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold text-base h-12 px-8 rounded-xl shadow-lg shadow-blue-900/20"
              onClick={() => navigate('login')}
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              Masuk sebagai Guru
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 font-semibold text-base h-12 px-8 rounded-xl bg-white/10 backdrop-blur-sm"
              onClick={() => navigate('student-join')}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Masuk sebagai Siswa
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-center text-lg sm:text-xl font-bold text-gray-800 mb-8">
            Mengapa KelasAI?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 stagger-children">
            <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Mudah Digunakan</h4>
                <p className="text-sm text-gray-500">
                  Cukup buat sesi, bagikan kode, dan siswa langsung bisa belajar
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">AI Cerdas</h4>
                <p className="text-sm text-gray-500">
                  AI menjawab pertanyaan siswa berdasarkan materi yang diajarkan guru
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Gratis & Ringan</h4>
                <p className="text-sm text-gray-500">
                  Bisa diakses dari HP murah sekalipun, tanpa instalasi
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-50 to-blue-100/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-blue-700">1000+</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Siswa
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-blue-700">500+</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                Sesi
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-blue-700">50+</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                <School className="w-3 h-3 sm:w-4 sm:h-4" />
                Sekolah
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} KelasAI. AI Tutor untuk Sekolah Indonesia.
        </div>
      </footer>
    </div>
  );
}
