'use client';

import { GraduationCap, LogOut, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

interface TeacherLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function TeacherLayout({ children, title }: TeacherLayoutProps) {
  const { teacher, logout, navigate } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-blue-700 text-lg hidden sm:inline">KelasAI</span>
          </div>

          {title && (
            <h1 className="text-sm font-semibold text-gray-700 truncate max-w-[200px] sm:max-w-none">
              {title}
            </h1>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => navigate('analytics')}
            >
              <BarChart3 className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Analitik</span>
            </Button>
            {teacher && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 hidden md:inline">{teacher.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
