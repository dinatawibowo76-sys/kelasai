'use client';

import { useEffect, useState, useRef } from 'react';
import { FileText, MessageSquare, Brain, Send, Loader2, BookOpen, Lightbulb, PenTool, ListChecks } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import StudentLayout from '@/components/shared/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  message: string;
  role: 'student' | 'ai';
  createdAt: string;
}

interface MaterialItem {
  id: string;
  fileName: string;
  fileType: string;
  extractedText: string | null;
  createdAt: string;
}

interface QuizItem {
  id: string;
  title: string;
  difficulty: string;
  questionType: string;
  _count: { questions: number };
}

interface SessionData {
  id: string;
  title: string;
  sessionCode: string;
  status: string;
  description: string | null;
  materials: MaterialItem[];
  quizzes: QuizItem[];
  class: {
    className: string;
    educationLevel: string;
  };
}

export default function StudentLearnPage() {
  const { studentSession, navigate, setSelectedQuizId } = useAppStore();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!studentSession) return;
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${studentSession.sessionId}`);
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [studentSession]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (message?: string) => {
    const msg = message || chatInput.trim();
    if (!msg || !studentSession) return;

    // Add student message to local state
    const studentMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      message: msg,
      role: 'student',
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, studentMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentSessionId: studentSession.id,
          message: msg,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim pesan');

      const aiMsg: ChatMessage = {
        id: data.messageId || `ai-${Date.now()}`,
        message: data.reply,
        role: 'ai',
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim pesan');
    } finally {
      setChatLoading(false);
    }
  };

  const quickActions = [
    { label: 'Jelaskan lebih gampang', icon: Lightbulb },
    { label: 'Berikan contoh', icon: BookOpen },
    { label: 'Ringkas materi', icon: FileText },
    { label: 'Buat latihan soal', icon: PenTool },
  ];

  const getDifficultyBadge = (diff: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-50 text-green-700 border-green-200',
      medium: 'bg-amber-50 text-amber-700 border-amber-200',
      hard: 'bg-red-50 text-red-700 border-red-200',
    };
    const labels: Record<string, string> = { easy: 'Mudah', medium: 'Sedang', hard: 'Sulit' };
    return { className: colors[diff] || colors.medium, label: labels[diff] || diff };
  };

  if (loading) {
    return (
      <StudentLayout title="Memuat...">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title={session?.title || 'Belajar'}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-gray-100 p-1 rounded-xl mb-4">
          <TabsTrigger value="materi" className="text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Materi</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <MessageSquare className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Chat AI</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Brain className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
        </TabsList>

        {/* Materi Tab */}
        <TabsContent value="materi" className="mt-0">
          {session?.materials && session.materials.length > 0 ? (
            <div className="space-y-3">
              {session.materials.map((material) => (
                <Card key={material.id} className="border-gray-100 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{material.fileName}</p>
                        <Badge variant="outline" className="text-xs mt-0.5 bg-gray-50">
                          {material.fileType.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    {material.extractedText && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{material.extractedText}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
              <CardContent className="p-8 text-center">
                <FileText className="w-10 h-10 text-blue-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Belum ada materi tersedia</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Chat AI Tab */}
        <TabsContent value="chat" className="mt-0">
          <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Tanyakan sesuatu tentang materi!</p>
                  <p className="text-xs text-gray-400 mt-1">AI akan menjawab berdasarkan materi dari guru</p>
                </div>
              )}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 text-sm ${
                      msg.role === 'student'
                        ? 'bg-blue-600 text-white chat-bubble-student'
                        : 'bg-white border border-gray-100 shadow-sm text-gray-800 chat-bubble-ai'
                    }`}
                  >
                    {msg.role === 'ai' && (
                      <span className="text-xs text-blue-500 font-medium block mb-1">AI Tutor</span>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 chat-bubble-ai">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      <span className="text-xs text-gray-400">AI sedang berpikir...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap text-xs border-blue-200 text-blue-600 hover:bg-blue-50 flex-shrink-0"
                  onClick={() => handleSendMessage(action.label)}
                  disabled={chatLoading}
                >
                  <action.icon className="w-3 h-3 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ketik pertanyaan..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={chatLoading}
                className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <Button
                className="h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white p-0"
                onClick={() => handleSendMessage()}
                disabled={chatLoading || !chatInput.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="mt-0">
          {session?.quizzes && session.quizzes.length > 0 ? (
            <div className="space-y-3">
              {session.quizzes.map((quiz) => {
                const diff = getDifficultyBadge(quiz.difficulty);
                return (
                  <Card key={quiz.id} className="border-gray-100 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800">{quiz.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={diff.className}>
                              {diff.label}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {quiz._count.questions} soal
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white ml-2"
                          onClick={() => {
                            setSelectedQuizId(quiz.id);
                            navigate('student-quiz');
                          }}
                        >
                          <ListChecks className="w-3 h-3 mr-1" />
                          Kerjakan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
              <CardContent className="p-8 text-center">
                <Brain className="w-10 h-10 text-blue-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Belum ada quiz tersedia</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </StudentLayout>
  );
}
