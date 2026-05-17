import { create } from 'zustand';

export type Page =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'class-detail'
  | 'session-detail'
  | 'create-class'
  | 'create-session'
  | 'upload-material'
  | 'generate-quiz'
  | 'analytics'
  | 'student-join'
  | 'student-learn'
  | 'student-quiz'
  | 'student-quiz-result';

interface AppState {
  // Navigation
  currentPage: Page;
  pageParams: Record<string, string>;
  navigate: (page: Page, params?: Record<string, string>) => void;
  goBack: () => void;
  pageHistory: Array<{ page: Page; params: Record<string, string> }>;

  // Teacher Auth
  teacher: {
    id: string;
    name: string;
    email: string;
  } | null;
  setTeacher: (teacher: AppState['teacher']) => void;
  logout: () => void;

  // Student Session
  studentSession: {
    id: string;
    studentName: string;
    sessionId: string;
    sessionCode: string;
  } | null;
  setStudentSession: (session: AppState['studentSession']) => void;

  // Selected items
  selectedClassId: string | null;
  setSelectedClassId: (id: string | null) => void;
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  selectedQuizId: string | null;
  setSelectedQuizId: (id: string | null) => void;
  quizScore: { score: number; totalPoints: number } | null;
  setQuizScore: (score: { score: number; totalPoints: number } | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: 'landing',
  pageParams: {},
  pageHistory: [],
  navigate: (page, params = {}) => {
    const state = get();
    set({
      currentPage: page,
      pageParams: params,
      pageHistory: [...state.pageHistory, { page: state.currentPage, params: state.pageParams }],
    });
  },
  goBack: () => {
    const state = get();
    if (state.pageHistory.length > 0) {
      const last = state.pageHistory[state.pageHistory.length - 1];
      set({
        currentPage: last.page,
        pageParams: last.params,
        pageHistory: state.pageHistory.slice(0, -1),
      });
    }
  },

  // Teacher Auth
  teacher: null,
  setTeacher: (teacher) => set({ teacher }),
  logout: () => set({ teacher: null, currentPage: 'landing', pageHistory: [] }),

  // Student Session
  studentSession: null,
  setStudentSession: (session) => set({ studentSession: session }),

  // Selected items
  selectedClassId: null,
  setSelectedClassId: (id) => set({ selectedClassId: id }),
  selectedSessionId: null,
  setSelectedSessionId: (id) => set({ selectedSessionId: id }),
  selectedQuizId: null,
  setSelectedQuizId: (id) => set({ selectedQuizId: id }),
  quizScore: null,
  setQuizScore: (score) => set({ quizScore: score }),
}));
