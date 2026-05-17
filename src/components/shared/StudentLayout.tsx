'use client';

import { GraduationCap, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

interface StudentLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export default function StudentLayout({ children, title, showBack }: StudentLayoutProps) {
  const { studentSession, goBack } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBack && (
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 -ml-2 mr-1"
                onClick={goBack}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            {title && (
              <h1 className="text-sm font-semibold text-gray-700 truncate max-w-[180px]">
                {title}
              </h1>
            )}
          </div>
          {studentSession && (
            <span className="text-xs text-gray-500 truncate max-w-[120px]">
              {studentSession.studentName}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4">
        {children}
      </main>
    </div>
  );
}
