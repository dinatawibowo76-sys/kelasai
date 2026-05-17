'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import LandingPage from '@/components/views/LandingPage';
import LoginPage from '@/components/views/LoginPage';
import RegisterPage from '@/components/views/RegisterPage';
import TeacherDashboard from '@/components/views/TeacherDashboard';
import ClassDetailPage from '@/components/views/ClassDetailPage';
import SessionDetailPage from '@/components/views/SessionDetailPage';
import CreateClassPage from '@/components/views/CreateClassPage';
import CreateSessionPage from '@/components/views/CreateSessionPage';
import UploadMaterialPage from '@/components/views/UploadMaterialPage';
import GenerateQuizPage from '@/components/views/GenerateQuizPage';
import AnalyticsPage from '@/components/views/AnalyticsPage';
import StudentJoinPage from '@/components/views/StudentJoinPage';
import StudentLearnPage from '@/components/views/StudentLearnPage';
import StudentQuizPage from '@/components/views/StudentQuizPage';
import StudentQuizResultPage from '@/components/views/StudentQuizResultPage';

export default function Home() {
  const { currentPage, navigate } = useAppStore();

  // Handle URL hash-based routing for student join links
  // Format: #join=SESSION_CODE
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#join=')) {
      navigate('student-join');
    }
  }, [navigate]);

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'dashboard':
        return <TeacherDashboard />;
      case 'class-detail':
        return <ClassDetailPage />;
      case 'session-detail':
        return <SessionDetailPage />;
      case 'create-class':
        return <CreateClassPage />;
      case 'create-session':
        return <CreateSessionPage />;
      case 'upload-material':
        return <UploadMaterialPage />;
      case 'generate-quiz':
        return <GenerateQuizPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'student-join':
        return <StudentJoinPage />;
      case 'student-learn':
        return <StudentLearnPage />;
      case 'student-quiz':
        return <StudentQuizPage />;
      case 'student-quiz-result':
        return <StudentQuizResultPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderPage()}
    </div>
  );
}
