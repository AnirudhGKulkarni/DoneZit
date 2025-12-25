/**
 * Tasks Hook
 * 
 * This hook manages all task-related state and operations.
 * Tasks are stored in localStorage for persistence.
 * 
 * Features:
 * - CRUD operations for tasks
 * - Advanced sorting by priority, deadline, and creation date
 * - Filtering by status, priority, and due date
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, TaskFormData, Priority, FilterType } from '@/types';

interface UseTasksReturn {
  tasks: Task[];
  filteredTasks: Task[];
  filter: FilterType;
  categoryFilter: string | null;
  setFilter: (filter: FilterType) => void;
  setCategoryFilter: (category: string | null) => void;
  addTask: (taskData: TaskFormData) => void;
  updateTask: (id: string, taskData: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  getTaskStats: () => { total: number; completed: number; pending: number; overdue: number };
}

// Priority weight for sorting (higher = more important)
const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1
};

/**
 * Advanced Sorting Algorithm
 * 
 * Sorts tasks using a multi-factor approach:
 * 1. Completed tasks go to the bottom
 * 2. Priority (High → Medium → Low)
 * 3. Within same priority, sort by nearest deadline
 * 4. If deadlines are equal, sort by creation time (oldest first)
 */
const sortTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    // Completed tasks always go to the bottom
    if (a.status !== b.status) {
      return a.status === 'completed' ? 1 : -1;
    }

    // For pending tasks, sort by priority first
    if (a.status === 'pending') {
      const priorityDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Same priority: sort by deadline (nearest first)
      const deadlineA = new Date(a.deadline).getTime();
      const deadlineB = new Date(b.deadline).getTime();
      const deadlineDiff = deadlineA - deadlineB;
      if (deadlineDiff !== 0) return deadlineDiff;

      // Same deadline: sort by creation time (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    // For completed tasks, sort by most recently completed (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

/**
 * Filter tasks based on filter type
 */
const filterTasks = (tasks: Task[], filter: FilterType, categoryFilter: string | null): Task[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let filtered = tasks;

  // Apply category filter first
  if (categoryFilter) {
    filtered = filtered.filter(task => task.category === categoryFilter);
  }

  // Then apply status/type filter
  switch (filter) {
    case 'completed':
      return filtered.filter(task => task.status === 'completed');
    case 'pending':
      return filtered.filter(task => task.status === 'pending');
    case 'high-priority':
      return filtered.filter(task => task.priority === 'high' && task.status === 'pending');
    case 'due-today':
      return filtered.filter(task => {
        const deadline = new Date(task.deadline);
        return task.status === 'pending' && 
               deadline >= today && 
               deadline < tomorrow;
      });
    case 'overdue':
      return filtered.filter(task => {
        const deadline = new Date(task.deadline);
        return task.status === 'pending' && deadline < today;
      });
    case 'all':
    default:
      return filtered;
  }
};

export const useTasks = (userId: string | null): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Load tasks from localStorage on mount
  useEffect(() => {
    if (userId) {
      const storageKey = `tasks_${userId}`;
      const storedTasks = localStorage.getItem(storageKey);
      if (storedTasks) {
        try {
          const parsed = JSON.parse(storedTasks);
          // Convert date strings back to Date objects
          const tasksWithDates = parsed.map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            deadline: new Date(task.deadline)
          }));
          setTasks(tasksWithDates);
        } catch (e) {
          console.error('Failed to parse stored tasks:', e);
          setTasks([]);
        }
      }
    } else {
      setTasks([]);
    }
  }, [userId]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (userId && tasks.length >= 0) {
      const storageKey = `tasks_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    }
  }, [tasks, userId]);

  /**
   * Add a new task
   */
  const addTask = useCallback((taskData: TaskFormData) => {
    if (!userId) return;

    // generate id (use crypto.randomUUID when available, otherwise fallback)
    const generateId = (): string => {
      try {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
          // @ts-ignore
          return crypto.randomUUID();
        }
      } catch (e) {
        // fall through to fallback
      }

      // fallback UUID v4 generator
      const bytes = new Uint8Array(16);
      if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
        // @ts-ignore
        crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < 16; i++) {
          bytes[i] = Math.floor(Math.random() * 256);
        }
      }
      // Per RFC4122 v4
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex: string[] = [];
      for (let i = 0; i < 16; i++) {
        hex.push(bytes[i].toString(16).padStart(2, '0'));
      }
      return `${hex.slice(0,4).join('')}-${hex.slice(4,6).join('')}-${hex.slice(6,8).join('')}-${hex.slice(8,10).join('')}-${hex.slice(10,16).join('')}`;
    };

    const newTask: Task = {
      id: generateId(),
      userId,
      title: taskData.title,
      description: taskData.description,
      createdAt: new Date(),
      deadline: taskData.deadline,
      priority: taskData.priority,
      status: 'pending',
      category: taskData.category,
    };

    setTasks(prev => sortTasks([...prev, newTask]));
  }, [userId]);

  /**
   * Update an existing task
   */
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      );
      return sortTasks(updated);
    });
  }, []);

  /**
   * Delete a task
   */
  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  /**
   * Toggle task status between pending and completed
   */
  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(prev => {
      const updated = prev.map(task => 
        task.id === id 
          ? { ...task, status: (task.status === 'pending' ? 'completed' : 'pending') as 'pending' | 'completed' }
          : task
      );
      return sortTasks(updated);
    });
  }, []);

  /**
   * Get task statistics
   */
  const getTaskStats = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      overdue: tasks.filter(t => 
        t.status === 'pending' && new Date(t.deadline) < today
      ).length
    };
  }, [tasks]);

  // Memoized filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    const filtered = filterTasks(tasks, filter, categoryFilter);
    return sortTasks(filtered);
  }, [tasks, filter, categoryFilter]);

  return {
    tasks,
    filteredTasks,
    filter,
    categoryFilter,
    setFilter,
    setCategoryFilter,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    getTaskStats
  };
};
