// User type for authentication
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt?: Date;
}

// Priority levels for tasks
export type Priority = 'low' | 'medium' | 'high';

// Status of a task
export type TaskStatus = 'pending' | 'completed';

// Category/Tag for tasks
export interface Category {
  id: string;
  name: string;
  color: string;
}

// Main Task interface
export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: Date;
  deadline: Date;
  priority: Priority;
  status: TaskStatus;
  category?: string;
  categoryColor?: string;
}

// Filter options for tasks
export type FilterType = 'all' | 'completed' | 'pending' | 'high-priority' | 'due-today' | 'overdue';

// Auth state
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Form data for creating/editing tasks
export interface TaskFormData {
  title: string;
  description: string;
  deadline: Date;
  priority: Priority;
  category?: string;
}
