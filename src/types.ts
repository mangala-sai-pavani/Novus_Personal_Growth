export interface Habit {
  id: string;
  name: string;
  streak: number;
  completed: boolean;
  icon?: string;
  color?: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface RoutineTask {
  id: string;
  time: string;
  title: string;
  category: 'work' | 'health' | 'personal' | 'learning';
  completed: boolean;
  priority: TaskPriority;
  date?: string; // For Today | Tomorrow | Week
}

export interface Goal {
  id: string;
  title: string;
  progress: number; // 0 to 100
  deadline: string;
  description?: string;
  category?: string;
  milestones: { id: string; title: string; completed: boolean }[];
}

export interface JournalEntry {
  id: string;
  date: any;
  content: string;
  mood: 'great' | 'good' | 'okay' | 'bad';
  tags: string[];
}
