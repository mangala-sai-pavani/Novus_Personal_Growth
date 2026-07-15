import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Calendar, 
  BookOpen, 
  BarChart3, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  LayoutDashboard, 
  User, 
  Filter, 
  ArrowUpDown, 
  CheckCircle, 
  Smile, 
  Meh, 
  Frown, 
  Tag, 
  Target,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Flame,
  AlertCircle,
  Trash2,
  LogOut,
  Settings,
  Mail,
  Briefcase,
  UserCircle,
  LogIn,
  Moon,
  Sun,
  PieChart
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { Habit, RoutineTask, JournalEntry, Goal, TaskPriority } from './types';
import PomodoroTimer from './components/PomodoroTimer';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';

import { auth, db, googleProvider, signInWithPopup, signOut } from './firebase';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null, setError?: (err: string) => void) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (setError) {
    setError(JSON.stringify(errInfo));
  } else {
    throw new Error(JSON.stringify(errInfo));
  }
}

// --- Components ---
const SignIn = () => {
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Sign in error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized. Please add it to Firebase Console -> Auth -> Settings -> Authorized Domains.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup was blocked. Please allow popups for this site.");
      } else {
        setError(err.message || "An error occurred during sign in.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
      >
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-100">
          <TrendingUp className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold mb-3 tracking-tight">Welcome to NOVUS</h1>
        <p className="text-gray-500 mb-10 font-medium">Your personal growth system. Sign in to start your journey.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium flex items-start gap-3 text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button 
          onClick={handleSignIn}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </button>
        
        <div className="mt-8 pt-8 border-t border-gray-50 text-left">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Troubleshooting</h4>
          <ul className="space-y-2 text-[11px] text-gray-500 font-medium">
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-indigo-400 rounded-full" />
              If the popup doesn't open, check your browser's popup blocker.
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-indigo-400 rounded-full" />
              Ensure the current domain is allowlisted in Firebase Auth settings.
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-indigo-400 rounded-full" />
              Try opening the application in a new tab if it's stuck.
            </li>
          </ul>
        </div>
        
        <p className="mt-8 text-[10px] uppercase tracking-widest text-gray-300 font-bold">Secure Cloud Sync Enabled</p>
      </motion.div>
    </div>
  );
};

const ErrorBoundary = ({ error }: { error: string }) => {
  let displayMessage = "An unexpected error occurred.";
  try {
    const parsed = JSON.parse(error);
    if (parsed.error.includes("insufficient permissions")) {
      displayMessage = "You don't have permission to perform this action.";
    } else if (parsed.error.includes("offline")) {
      displayMessage = "You appear to be offline. Please check your connection.";
    }
  } catch (e) {
    displayMessage = error;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-gray-100">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-extrabold mb-2">Something went wrong</h3>
        <p className="text-gray-500 text-sm mb-6">{displayMessage}</p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold shadow-lg"
        >
          Reload Application
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'goals' | 'habits' | 'planner' | 'journal' | 'profile' | 'analytics'>('dashboard');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [routine, setRoutine] = useState<RoutineTask[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newRoutineTask, setNewRoutineTask] = useState({ time: '08:00', title: '', category: 'personal' as const, priority: 'medium' as TaskPriority });
  const [newJournalEntry, setNewJournalEntry] = useState<{ content: string, mood: 'great' | 'good' | 'okay' | 'bad', tags: string[] }>({ content: '', mood: 'great', tags: [] });
  const [newHabit, setNewHabit] = useState({ name: '', icon: '🎯', color: 'bg-indigo-50 text-indigo-600' });
  const [newGoal, setNewGoal] = useState({ title: '', description: '', deadline: '', category: 'Personal' });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [sortBy, setSortBy] = useState<'time' | 'category' | 'status'>('time');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [routineView, setRoutineView] = useState<'list' | 'timetable'>('list');
  const [plannerTab, setPlannerTab] = useState<'today' | 'tomorrow' | 'week'>('today');
  const timetableRef = useRef<HTMLDivElement>(null);

  // Reminders Logic
  useEffect(() => {
    if (!remindersEnabled || !user) return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      // Check Routine Tasks
      routine.forEach(task => {
        if (!task.completed && task.time === currentTime) {
          toast.info(`Reminder: ${task.title}`, {
            description: `It's time for your ${task.category} task!`,
            icon: <Clock className="w-4 h-4" />,
          });
        }
      });

      // Daily Habit Reminder (at 8 PM)
      if (currentTime === "20:00") {
        const pendingHabits = habits.filter(h => !h.completed);
        if (pendingHabits.length > 0) {
          toast.warning("Don't forget your habits!", {
            description: `You still have ${pendingHabits.length} habits to complete today.`,
            icon: <Flame className="w-4 h-4 text-orange-500" />,
          });
        }
      }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [routine, habits, remindersEnabled, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // Fetch Profile
    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        // Initialize profile
        const newProfile = {
          name: user.displayName || 'User',
          email: user.email || '',
          bio: '',
          joinedDate: Timestamp.now(),
          preferences: { theme: 'light', notifications: true },
          role: 'user'
        };
        setDoc(profileRef, newProfile).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`, setAppError));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`, setAppError));

    // Fetch Habits
    const habitsQuery = query(collection(db, 'habits'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubHabits = onSnapshot(habitsQuery, (snap) => {
      setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() } as Habit)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'habits', setAppError));

    // Fetch Routine
    const routineQuery = query(collection(db, 'routineTasks'), where('userId', '==', user.uid), orderBy('time', 'asc'));
    const unsubRoutine = onSnapshot(routineQuery, (snap) => {
      setRoutine(snap.docs.map(d => ({ id: d.id, ...d.data() } as RoutineTask)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'routineTasks', setAppError));

    // Fetch Goals
    const goalsQuery = query(collection(db, 'goals'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubGoals = onSnapshot(goalsQuery, (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'goals', setAppError));

    // Fetch Journals
    const journalsQuery = query(collection(db, 'journals'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const unsubJournals = onSnapshot(journalsQuery, (snap) => {
      setJournals(snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'journals', setAppError));

    return () => {
      unsubProfile();
      unsubHabits();
      unsubRoutine();
      unsubGoals();
      unsubJournals();
    };
  }, [user]);

  const updateProfile = async (updates: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`, setAppError);
    }
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'goals'), {
        ...newGoal,
        progress: 0,
        milestones: [],
        userId: user.uid,
        createdAt: Timestamp.now()
      });
      setShowGoalForm(false);
      setNewGoal({ title: '', description: '', deadline: '', category: 'Personal' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'goals', setAppError);
    }
  };

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const updatedMilestones = goal.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100) || 0;

    try {
      await updateDoc(doc(db, 'goals', goalId), {
        milestones: updatedMilestones,
        progress
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `goals/${goalId}`, setAppError);
    }
  };

  const deleteGoal = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Goal',
      message: 'Are you sure you want to delete this goal? All milestones associated with it will also be removed.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'goals', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `goals/${id}`, setAppError);
        }
      }
    });
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'habits'), {
        ...newHabit,
        streak: 0,
        completed: false,
        userId: user.uid,
        createdAt: Timestamp.now()
      });
      setShowHabitForm(false);
      setNewHabit({ name: '', icon: '🎯', color: 'bg-indigo-50 text-indigo-600' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'habits', setAppError);
    }
  };

  const toggleHabit = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    try {
      await updateDoc(doc(db, 'habits', id), {
        completed: !habit.completed,
        streak: !habit.completed ? habit.streak + 1 : Math.max(0, habit.streak - 1)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `habits/${id}`, setAppError);
    }
  };

  const deleteHabit = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Habit',
      message: 'Are you sure you want to delete this habit? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'habits', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `habits/${id}`, setAppError);
        }
      }
    });
  };

  const toggleRoutineTask = async (id: string) => {
    const task = routine.find(t => t.id === id);
    if (!task) return;
    try {
      await updateDoc(doc(db, 'routineTasks', id), {
        completed: !task.completed
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `routineTasks/${id}`, setAppError);
    }
  };

  const deleteRoutineTask = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'routineTasks', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `routineTasks/${id}`, setAppError);
        }
      }
    });
  };

  const addRoutineTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'routineTasks'), {
        ...newRoutineTask,
        completed: false,
        userId: user.uid,
        createdAt: Timestamp.now()
      });
      setShowRoutineForm(false);
      setNewRoutineTask({ time: '08:00', title: '', category: 'personal', priority: 'medium' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'routineTasks', setAppError);
    }
  };

  const addJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'journals'), {
        ...newJournalEntry,
        date: Timestamp.now(),
        userId: user.uid
      });
      setShowJournalForm(false);
      setNewJournalEntry({ content: '', mood: 'great', tags: [] });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'journals', setAppError);
    }
  };

  const scrollToCurrentHour = () => {
    const currentHour = new Date().getHours();
    const element = document.getElementById(`hour-${currentHour}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const filteredAndSortedRoutine = routine
    .filter(task => {
      const categoryMatch = categoryFilter === 'all' || task.category === categoryFilter;
      const statusMatch = statusFilter === 'all' || 
                         (statusFilter === 'completed' && task.completed) || 
                         (statusFilter === 'pending' && !task.completed);
      return categoryMatch && statusMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'time') return a.time.localeCompare(b.time);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      if (sortBy === 'status') return Number(a.completed) - Number(b.completed);
      return 0;
    });

  if (!authReady) return null;
  if (!user) return <SignIn />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24">
      <Toaster position="top-center" richColors />
      {appError && <ErrorBoundary error={appError} />}
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-indigo-600 leading-none">NOVUS</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold mt-0.5">System v2.0</p>
            </div>
          </motion.div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('profile')}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border transition-all overflow-hidden",
                activeTab === 'profile' ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-100 text-indigo-600"
              )}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Welcome Section */}
              <section className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Good Morning, {profile?.name || 'Pavani'} 👋</h2>
                  <p className="text-gray-400 text-sm font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100"
                >
                  <User className="w-6 h-6 text-indigo-600" />
                </button>
              </section>

              {/* Today Progress Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden h-full flex flex-col justify-center border border-white/10">
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-extrabold text-xl tracking-tight">Today's Focus</h3>
                        <p className="text-indigo-100/70 text-xs font-medium mt-1">Consistency is the key to mastery</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black block">
                          {Math.round((habits.filter(h => h.completed).length / (habits.length || 1)) * 100)}%
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Complete</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1 backdrop-blur-sm border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(habits.filter(h => h.completed).length / (habits.length || 1)) * 100}%` }}
                          className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/60">
                        <span>{habits.filter(h => h.completed).length} Habits Done</span>
                        <span>{habits.length - habits.filter(h => h.completed).length} Remaining</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
                </section>

                {/* Streak Section */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg tracking-tight">Active Streaks</h3>
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {habits.slice(0, 4).map(habit => (
                      <div key={habit.id} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                          <span className="text-xl">{habit.icon || '🎯'}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate w-full max-w-[100px]">{habit.name}</p>
                          <p className="text-sm font-extrabold text-gray-900 mt-0.5">{habit.streak} Days 🔥</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Today's Tasks (Mini) */}
              <section className="max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg tracking-tight">Upcoming Routine</h3>
                  <button 
                    onClick={() => setActiveTab('planner')}
                    className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest hover:underline underline-offset-4"
                  >
                    View Schedule
                  </button>
                </div>
                <div className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
                  {routine.slice(0, 4).map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => toggleRoutineTask(task.id)}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer group"
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        task.completed ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-200 group-hover:border-indigo-300"
                      )}>
                        {task.completed && <CheckCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <span className={cn(
                          "text-sm font-bold transition-all",
                          task.completed ? "text-gray-400 line-through" : "text-gray-700"
                        )}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{task.category}</span>
                          <div className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{task.time}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Streak Section Removed from here and moved up */}

              {/* Quick Actions */}
              <div className="fixed bottom-24 right-6 flex flex-col gap-3 items-end z-50">
                <AnimatePresence>
                  {showQuickMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 20 }}
                      className="flex flex-col gap-3 mb-2"
                    >
                      {[
                        { label: 'Add Task', icon: <CheckCircle className="w-5 h-5" />, tab: 'planner', action: () => setShowRoutineForm(true) },
                        { label: 'Add Habit', icon: <Flame className="w-5 h-5" />, tab: 'habits', action: () => setShowHabitForm(true) },
                        { label: 'Add Goal', icon: <Target className="w-5 h-5" />, tab: 'goals', action: () => setShowGoalForm(true) },
                        { label: 'New Journal', icon: <BookOpen className="w-5 h-5" />, tab: 'journal', action: () => setShowJournalForm(true) },
                      ].map((item, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.05, x: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setActiveTab(item.tab as any);
                            item.action();
                            setShowQuickMenu(false);
                          }}
                          className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-lg border border-gray-100 group"
                        >
                          <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-600">{item.label}</span>
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            {item.icon}
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowQuickMenu(!showQuickMenu)}
                  className={cn(
                    "w-14 h-14 text-white rounded-full shadow-xl flex items-center justify-center transition-all",
                    showQuickMenu ? "bg-gray-900 rotate-45" : "bg-indigo-600 shadow-indigo-200"
                  )}
                >
                  <Plus className="w-7 h-7" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8 pb-24"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Your Goals</h2>
                  <p className="text-gray-400 text-xs font-medium">Focus on what matters</p>
                </div>
                <button 
                  onClick={() => setShowGoalForm(!showGoalForm)}
                  className="bg-indigo-600 text-white p-2 rounded-full shadow-lg shadow-indigo-200"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {showGoalForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white p-8 rounded-[32px] border border-indigo-100 shadow-sm overflow-hidden mb-8"
                >
                  <form onSubmit={addGoal} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Goal Title</label>
                        <input
                          required
                          type="text"
                          value={newGoal.title}
                          onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                          placeholder="e.g. Run a Marathon"
                          className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Category</label>
                        <select
                          value={newGoal.category}
                          onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                          className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Health">Health</option>
                          <option value="Career">Career</option>
                          <option value="Personal">Personal</option>
                          <option value="Finance">Finance</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Deadline</label>
                        <input
                          type="date"
                          value={newGoal.deadline}
                          onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                          className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Description</label>
                        <input
                          type="text"
                          value={newGoal.description}
                          onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                          placeholder="Why is this important?"
                          className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                    >
                      Create Goal
                    </button>
                  </form>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => (
                  <div key={goal.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg">
                            {goal.category || 'Personal'}
                          </span>
                          {goal.deadline && goal.deadline !== '' && (
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{goal.title}</h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{goal.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                          {goal.progress}%
                        </div>
                        <button 
                          onClick={() => deleteGoal(goal.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress}%` }}
                          className="h-full bg-indigo-600 rounded-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Milestones</p>
                        {goal.milestones.map((milestone) => (
                          <div 
                            key={milestone.id}
                            onClick={() => toggleMilestone(goal.id, milestone.id)}
                            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group"
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                              milestone.completed ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-200 group-hover:border-indigo-300"
                            )}>
                              {milestone.completed && <CheckCircle className="w-3 h-3" />}
                            </div>
                            <span className={cn(
                              "text-xs font-semibold flex-1",
                              milestone.completed ? "text-gray-400 line-through" : "text-gray-700"
                            )}>
                              {milestone.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {goals.length === 0 && (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">No goals set yet. Aim high!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'habits' && (
            <motion.div
              key="habits"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Daily Habits</h2>
                <div className="flex gap-2">
                  <div className="bg-white border border-gray-100 p-2 rounded-2xl flex items-center gap-2 shadow-sm">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold">80% this week</span>
                  </div>
                </div>
              </div>

              {/* Date Selector */}
              <div className="flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className={cn(
                    "flex flex-col items-center p-2 rounded-xl min-w-[40px]",
                    i === 4 ? "bg-indigo-600 text-white" : "text-gray-400"
                  )}>
                    <span className="text-[10px] font-bold uppercase">{day}</span>
                    <span className="text-sm font-bold">{23 + i}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {showHabitForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden md:col-span-2 lg:col-span-3"
                  >
                    <form onSubmit={addHabit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Habit Name</label>
                        <input
                          required
                          type="text"
                          value={newHabit.name}
                          onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                          placeholder="e.g. Drink 2L Water"
                          className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Icon</label>
                        <select
                          value={newHabit.icon}
                          onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                          className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="🎯">🎯 Goal</option>
                          <option value="💧">💧 Water</option>
                          <option value="🏃">🏃 Exercise</option>
                          <option value="📚">📚 Reading</option>
                          <option value="🧘">🧘 Meditation</option>
                          <option value="🍎">🍎 Healthy Eating</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Color Theme</label>
                        <div className="flex gap-2">
                          {[
                            'bg-indigo-50 text-indigo-600',
                            'bg-orange-50 text-orange-600',
                            'bg-emerald-50 text-emerald-600',
                            'bg-rose-50 text-rose-600',
                            'bg-amber-50 text-amber-600'
                          ].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewHabit({ ...newHabit, color })}
                              className={cn(
                                "w-10 h-10 rounded-xl transition-all border-2",
                                newHabit.color === color ? "border-indigo-600 scale-110" : "border-transparent",
                                color.split(' ')[0]
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="md:col-span-2 flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100"
                        >
                          Create Habit
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowHabitForm(false)}
                          className="px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {habits.map(habit => (
                  <div 
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className={cn(
                      "p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between bg-white shadow-sm",
                      habit.completed 
                        ? "bg-indigo-50/50 border-indigo-100" 
                        : "border-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all",
                        habit.completed ? "bg-indigo-600 text-white" : (habit.color || "bg-gray-50 text-gray-400")
                      )}>
                        {habit.completed ? <CheckCircle2 className="w-6 h-6" /> : (habit.icon || <Circle className="w-6 h-6" />)}
                      </div>
                      <div>
                        <p className={cn("font-extrabold", habit.completed && "text-indigo-900")}>{habit.name}</p>
                        <div className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <p className="text-xs text-gray-400 font-medium">{habit.streak} day streak</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        habit.completed ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-200"
                      )}>
                        {habit.completed && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHabit(habit.id);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={() => setShowHabitForm(!showHabitForm)}
                  className="w-full bg-white border-2 border-dashed border-gray-200 p-4 rounded-3xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-indigo-200 hover:text-indigo-400 transition-all md:col-span-2 lg:col-span-3"
                >
                  <Plus className="w-5 h-5" />
                  {showHabitForm ? 'Cancel' : 'Add New Habit'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Daily Planner</h2>
                <button 
                  onClick={() => setShowRoutineForm(!showRoutineForm)}
                  className="bg-indigo-600 text-white p-2 rounded-full shadow-lg shadow-indigo-200"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {/* Pomodoro Timer Integration */}
              <PomodoroTimer 
                userId={user.uid} 
                routineTasks={routine} 
                onCompleteTask={toggleRoutineTask} 
              />

              {/* Planner Tabs */}
              <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
                {(['today', 'tomorrow', 'week'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setPlannerTab(tab)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      plannerTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Filters & View Toggle */}
              <div className="flex justify-between items-center">
                <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                  <button 
                    onClick={() => setRoutineView('list')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                      routineView === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400"
                    )}
                  >
                    List
                  </button>
                  <button 
                    onClick={() => setRoutineView('timetable')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                      routineView === 'timetable' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400"
                    )}
                  >
                    Timetable
                  </button>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400">
                    <Filter className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400">
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {showRoutineForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={addRoutineTask}
                  className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Time</label>
                    <input 
                      type="time" 
                      required
                      value={newRoutineTask.time}
                      onChange={e => setNewRoutineTask({...newRoutineTask, time: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Priority</label>
                    <select 
                      value={newRoutineTask.priority}
                      onChange={e => setNewRoutineTask({...newRoutineTask, priority: e.target.value as TaskPriority})}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Task Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Morning Run"
                      value={newRoutineTask.title}
                      onChange={e => setNewRoutineTask({...newRoutineTask, title: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Category</label>
                    <select 
                      value={newRoutineTask.category}
                      onChange={e => setNewRoutineTask({...newRoutineTask, category: e.target.value as any})}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="health">Health</option>
                      <option value="learning">Learning</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-3 pt-2">
                    <button 
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100"
                    >
                      Add Task
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowRoutineForm(false)}
                      className="px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}

              <div className={cn(
                routineView === 'list' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"
              )}>
                {routineView === 'list' ? (
                  <>
                    {filteredAndSortedRoutine.map(task => (
                      <div 
                        key={task.id} 
                        onClick={() => toggleRoutineTask(task.id)}
                        className={cn(
                          "bg-white p-5 rounded-3xl flex items-center gap-4 border transition-all relative overflow-hidden cursor-pointer",
                          task.completed ? "border-indigo-100 opacity-75" : "border-gray-100 shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5",
                          task.priority === 'high' ? "bg-red-500" : task.priority === 'medium' ? "bg-amber-500" : "bg-emerald-500",
                          task.completed && "bg-gray-300"
                        )} />
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          task.completed ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-200"
                        )}>
                          {task.completed && <CheckCircle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            "font-bold text-gray-900",
                            task.completed && "line-through text-gray-400"
                          )}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] font-bold text-gray-400">{task.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className={cn(
                                "w-3 h-3",
                                task.priority === 'high' ? "text-red-400" : task.priority === 'medium' ? "text-amber-400" : "text-emerald-400"
                              )} />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{task.priority}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRoutineTask(task.id);
                          }}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <div ref={timetableRef} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-0 relative">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      const tasksInHour = filteredAndSortedRoutine.filter(t => t.time.startsWith(hour));
                      const isCurrentHour = new Date().getHours() === i;
                      
                      return (
                        <div 
                          key={i} 
                          id={`hour-${i}`}
                          className={cn(
                            "flex gap-4 min-h-[60px] relative group px-2 rounded-xl transition-colors",
                            isCurrentHour && "bg-indigo-50/30"
                          )}
                        >
                          {isCurrentHour && (
                            <div 
                              className="absolute left-14 right-4 h-[2px] bg-red-400 z-20 pointer-events-none"
                              style={{ top: `${(new Date().getMinutes() / 60) * 100}%` }}
                            >
                              <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-400 rounded-full" />
                            </div>
                          )}
                          <div className={cn(
                            "w-10 text-[10px] font-bold pt-1 transition-colors",
                            isCurrentHour ? "text-indigo-600" : "text-gray-400"
                          )}>
                            {hour}:00
                          </div>
                          <div className={cn(
                            "flex-1 border-t pt-2 pb-2",
                            isCurrentHour ? "border-indigo-100" : "border-gray-50"
                          )}>
                            <div className="space-y-2">
                              {tasksInHour.map(task => (
                                <div 
                                  key={task.id}
                                  onClick={() => toggleRoutineTask(task.id)}
                                  className={cn(
                                    "p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer relative overflow-hidden",
                                    task.completed 
                                      ? "bg-gray-50 border-gray-100 text-gray-400 line-through" 
                                      : "bg-white border-gray-100 shadow-sm"
                                  )}
                                >
                                  <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1",
                                    task.priority === 'high' ? "bg-red-500" : task.priority === 'medium' ? "bg-amber-500" : "bg-emerald-500",
                                    task.completed && "bg-gray-300"
                                  )} />
                                  <div className="flex justify-between items-center">
                                    <span>{task.title}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[8px] opacity-60">{task.time}</span>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteRoutineTask(task.id);
                                        }}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {filteredAndSortedRoutine.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-sm">No tasks found for this filter.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                  <p className="text-gray-400 text-sm">Visualize your growth and trends</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Habit Completion Trend */}
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Habit Consistency</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={habits.map((h, i) => ({ name: h.name, streak: h.streak }))}>
                        <defs>
                          <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="streak" stroke="#6366f1" fillOpacity={1} fill="url(#colorStreak)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span className="text-xs font-bold text-gray-500">Current Streaks</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600">Avg: {Math.round(habits.reduce((acc, h) => acc + h.streak, 0) / (habits.length || 1))} days</span>
                  </div>
                </div>

                {/* Goal Progress */}
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Goal Trajectory</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={goals.map(g => ({ name: g.title, progress: g.progress }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="stepAfter" dataKey="progress" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-gray-500">Completion %</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Total: {goals.length} active</span>
                  </div>
                </div>

                {/* Mood Distribution */}
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm lg:col-span-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Mood Trends (Last 7 Entries)</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={journals.slice(0, 7).reverse().map(j => ({ 
                        date: typeof j.date === 'string' ? j.date : j.date?.toDate?.()?.toLocaleDateString() || 'N/A',
                        value: j.mood === 'great' ? 4 : j.mood === 'good' ? 3 : j.mood === 'okay' ? 2 : 1
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={[1, 4]} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [value === 4 ? 'Great' : value === 3 ? 'Good' : value === 2 ? 'Okay' : 'Bad', 'Mood']}
                        />
                        <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={4} dot={{ r: 8, fill: '#f59e0b', strokeWidth: 3, stroke: '#fff' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex justify-around items-center">
                    <div className="flex items-center gap-2">
                      <Smile className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-gray-500">Happiness Index</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'journal' && (
            <motion.div
              key="journal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Journal</h2>
                  <p className="text-gray-400 text-xs font-medium">
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button 
                  onClick={() => setShowJournalForm(!showJournalForm)}
                  className="bg-indigo-600 text-white p-2 rounded-full shadow-lg shadow-indigo-200"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {showJournalForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white p-8 rounded-[32px] border border-indigo-100 shadow-sm overflow-hidden mb-8"
                >
                  <form onSubmit={addJournalEntry} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">How's your mood?</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(['great', 'good', 'okay', 'bad'] as const).map(m => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setNewJournalEntry({ ...newJournalEntry, mood: m })}
                                className={cn(
                                  "py-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                                  newJournalEntry.mood === m 
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                                    : "bg-white border-gray-100 text-gray-400 hover:border-indigo-100"
                                )}
                              >
                                <span className="text-2xl">
                                  {m === 'great' && '😃'}
                                  {m === 'good' && '😊'}
                                  {m === 'okay' && '😐'}
                                  {m === 'bad' && '😞'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-tighter">{m}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">Quick Prompts</label>
                          <div className="flex flex-wrap gap-2">
                            {['What did I learn?', 'What went well?', 'What can improve?'].map(prompt => (
                              <button 
                                key={prompt}
                                type="button"
                                onClick={() => setNewJournalEntry({ ...newJournalEntry, content: newJournalEntry.content + (newJournalEntry.content ? '\n\n' : '') + prompt + '\n' })}
                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">Write your thoughts...</label>
                        <textarea
                          required
                          value={newJournalEntry.content}
                          onChange={(e) => setNewJournalEntry({ ...newJournalEntry, content: e.target.value })}
                          placeholder="What's on your mind today?"
                          className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[200px]"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                    >
                      Save Entry
                    </button>
                  </form>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <h3 className="font-bold text-lg md:col-span-2 lg:col-span-3">Past Entries</h3>
                {journals.map((entry) => (
                  <div key={entry.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                          {entry.date && typeof entry.date !== 'string' && 'toDate' in (entry.date as any) ? (entry.date as any).toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : new Date(entry.date as any).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {entry.date && typeof entry.date !== 'string' && 'toDate' in (entry.date as any) ? (entry.date as any).toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date(entry.date as any).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-xl">
                        {entry.mood === 'great' && '😃'}
                        {entry.mood === 'good' && '😊'}
                        {entry.mood === 'okay' && '😐'}
                        {entry.mood === 'bad' && '😞'}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                      {entry.content}
                    </p>
                  </div>
                ))}
                {journals.length === 0 && (
                  <div className="text-center py-12 md:col-span-2 lg:col-span-3">
                    <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">No journal entries yet. Start reflecting!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="flex flex-col items-center text-center space-y-4 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-[32px] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-12 h-12" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full border border-gray-100 flex items-center justify-center shadow-sm">
                      <Settings className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{profile?.name || user.displayName || 'User'}</h2>
                    <p className="text-gray-400 text-sm font-medium">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => signOut(auth)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-8">
                    <div className="space-y-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500">Profile Details</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Full Name</p>
                            <input 
                              type="text" 
                              value={profile?.name}
                              onChange={(e) => updateProfile({ name: e.target.value })}
                              className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                            <input 
                              type="email" 
                              value={profile?.email}
                              onChange={(e) => updateProfile({ email: e.target.value })}
                              className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mt-1">
                          <Briefcase className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Bio</p>
                          <textarea 
                            value={profile?.bio}
                            onChange={(e) => updateProfile({ bio: e.target.value })}
                            className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 resize-none"
                            rows={3}
                            placeholder="Tell us about yourself..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-gray-50 space-y-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500">Preferences</h3>
                      
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                            <AlertCircle className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold block">Notifications</span>
                            <span className="text-[10px] text-gray-400">Receive alerts for your habits and goals</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setRemindersEnabled(!remindersEnabled)}
                          className={cn(
                            "w-12 h-7 rounded-full transition-all relative",
                            remindersEnabled ? "bg-indigo-600" : "bg-gray-200"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm",
                            remindersEnabled ? "left-6" : "left-1"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center md:text-left px-4">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Joined {profile?.joinedDate && typeof profile.joinedDate !== 'string' && 'toDate' in (profile.joinedDate as any) 
                        ? (profile.joinedDate as any).toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
                        : profile?.joinedDate ? new Date(profile.joinedDate as any).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50 pb-safe">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center overflow-x-auto no-scrollbar">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-6 h-6" />} 
            label="Home" 
          />
          <NavButton 
            active={activeTab === 'goals'} 
            onClick={() => setActiveTab('goals')} 
            icon={<Target className="w-6 h-6" />} 
            label="Goals" 
          />
          <NavButton 
            active={activeTab === 'habits'} 
            onClick={() => setActiveTab('habits')} 
            icon={<Flame className="w-6 h-6" />} 
            label="Habits" 
          />
          <NavButton 
            active={activeTab === 'planner'} 
            onClick={() => setActiveTab('planner')} 
            icon={<Calendar className="w-6 h-6" />} 
            label="Planner" 
          />
          <NavButton 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
            icon={<BarChart3 className="w-6 h-6" />} 
            label="Stats" 
          />
          <NavButton 
            active={activeTab === 'journal'} 
            onClick={() => setActiveTab('journal')} 
            icon={<BookOpen className="w-6 h-6" />} 
            label="Journal" 
          />
          <NavButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            icon={<User className="w-6 h-6" />} 
            label="Profile" 
          />
        </div>
      </nav>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function ConfirmationModal({ isOpen, title, message, onConfirm, onClose }: { 
  isOpen: boolean, 
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onClose: () => void 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl space-y-6 border border-gray-100"
          >
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 py-4 rounded-2xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all min-w-[60px]",
        active ? "text-indigo-600 scale-110" : "text-gray-400 hover:text-gray-600"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {active && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5" />}
    </button>
  );
}
