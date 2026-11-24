export type Priority = 'High' | 'Medium' | 'Low';

export type NavView =
  | 'dashboard'
  | 'all'
  | 'today'
  | 'upcoming'
  | 'completed'
  | 'settings';

export type SortOption = 'dueDate' | 'priority' | 'createdAt' | 'title';

export type StatusFilter = 'all' | 'active' | 'completed';

export interface Task {
  id: string;
  userId?: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD or ''
  priority: Priority;
  category: string;
  completed: boolean;
  createdAt: string;
}

export interface UserSettings {
  userName: string;
  defaultPriority: Priority;
  defaultView: NavView;
  categories: string[];
}

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  category: string;
}
