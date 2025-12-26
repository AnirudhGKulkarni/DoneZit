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
import { Task, TaskFormData, Priority, FilterType, TaskStatus } from '@/types';
import { db } from '@/services/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc as firestoreDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

interface UseTasksReturn {
  tasks: Task[];
  filteredTasks: Task[];
  filter: FilterType;
  categoryFilter: string | null;
  setFilter: (filter: FilterType) => void;
  setCategoryFilter: (category: string | null) => void;
  addTask: (taskData: TaskFormData) => Promise<void>;
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

  // Subscribe to Firestore realtime tasks for the user (fallback to localStorage)
  useEffect(() => {
    if (!userId) {
      setTasks([]);
      return;
    }

    // Subscribe to Firestore collection for this user's tasks
    try {
      const tasksCol = collection(db, 'users', userId, 'tasks');
      const q = query(tasksCol, orderBy('createdAt', 'asc'));
      const unsub = onSnapshot(q, snapshot => {
        const docs: Task[] = snapshot.docs.map(d => {
          const data: any = d.data();
          return {
            id: d.id,
            userId,
            title: data.title,
            description: data.description,
            createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            deadline: data.deadline && data.deadline.toDate ? data.deadline.toDate() : new Date(data.deadline),
            priority: data.priority,
            status: data.status as TaskStatus,
            category: data.category,
            categoryColor: data.categoryColor
          };
        });

        setTasks(sortTasks(docs));

        // also persist a local copy for offline fallback
        try {
          localStorage.setItem(`tasks_${userId}`, JSON.stringify(docs));
        } catch (e) {
          // ignore localStorage errors
        }
      }, err => {
        console.error('Tasks realtime listener error:', err);
        // If permissions prevent reading from Firestore, fall back to cached localStorage copy
        try {
          const isPermissionError = (err && (err.code === 'permission-denied' || /permission/i.test(String(err.message || ''))));
          if (isPermissionError) {
            console.warn('Firestore permission denied — loading tasks from localStorage fallback.');
            const storageKey = `tasks_${userId}`;
            const storedTasks = localStorage.getItem(storageKey);
            if (storedTasks) {
              try {
                const parsed = JSON.parse(storedTasks);
                const tasksWithDates = parsed.map((task: any) => ({
                  ...task,
                  createdAt: new Date(task.createdAt),
                  deadline: new Date(task.deadline)
                }));
                setTasks(sortTasks(tasksWithDates));
              } catch (e) {
                console.error('Failed to parse stored tasks fallback:', e);
                setTasks([]);
              }
            } else {
              setTasks([]);
            }
          }
        } catch (e) {
          console.error('Error handling realtime listener failure:', e);
        }
      });

      return () => unsub();
    } catch (e) {
      console.error('Failed to subscribe to tasks:', e);
      // fallback: try to load from localStorage
      const storageKey = `tasks_${userId}`;
      const storedTasks = localStorage.getItem(storageKey);
      if (storedTasks) {
        try {
          const parsed = JSON.parse(storedTasks);
          const tasksWithDates = parsed.map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            deadline: new Date(task.deadline)
          }));
          setTasks(tasksWithDates);
        } catch (err) {
          console.error('Failed to parse stored tasks:', err);
          setTasks([]);
        }
      }
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
  const addTask = useCallback(async (taskData: TaskFormData) => {
    if (!userId) return;

    try {
      const tasksCol = collection(db, 'users', userId, 'tasks');
      await addDoc(tasksCol, {
        title: taskData.title,
        description: taskData.description,
        createdAt: serverTimestamp(),
        deadline: Timestamp.fromDate(new Date(taskData.deadline)),
        priority: taskData.priority,
        status: 'pending',
        category: taskData.category || null
      });
      // onSnapshot listener will update local state
    } catch (e) {
      console.error('Failed to add task to Firestore:', e);
      // fallback: local-only add
      const fallbackId = `local-${Date.now()}`;
      const newTask: Task = {
        id: fallbackId,
        userId,
        title: taskData.title,
        description: taskData.description,
        createdAt: new Date(),
        deadline: taskData.deadline,
        priority: taskData.priority,
        status: 'pending',
        category: taskData.category
      };
      setTasks(prev => sortTasks([...prev, newTask]));
    }
  }, [userId]);

  /**
   * Update an existing task
   */
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    if (!userId) return;

    (async () => {
      try {
        const taskRef = firestoreDoc(db, 'users', userId, 'tasks', id);
        const payload: any = { ...updates };
        if (updates.deadline) payload.deadline = Timestamp.fromDate(new Date(updates.deadline as any));
        await updateDoc(taskRef, payload);
        // onSnapshot will update local state
      } catch (e) {
        console.error('Failed to update task in Firestore:', e);
        // fallback to local update
        setTasks(prev => {
          const updated = prev.map(task => task.id === id ? { ...task, ...updates } : task);
          return sortTasks(updated as Task[]);
        });
      }
    })();
  }, [userId]);

  /**
   * Delete a task
   */
  const deleteTask = useCallback((id: string) => {
    if (!userId) return;

    (async () => {
      try {
        const taskRef = firestoreDoc(db, 'users', userId, 'tasks', id);
        await deleteDoc(taskRef);
      } catch (e) {
        console.error('Failed to delete task from Firestore:', e);
        // fallback local delete
        setTasks(prev => prev.filter(task => task.id !== id));
      }
    })();
  }, [userId]);

  /**
   * Toggle task status between pending and completed
   */
  const toggleTaskStatus = useCallback((id: string) => {
    if (!userId) return;

    const toggle = async () => {
      try {
        // find existing task in local state
        const existing = tasks.find(t => t.id === id);
        if (!existing) return;
        const newStatus = existing.status === 'pending' ? 'completed' : 'pending';
        const taskRef = firestoreDoc(db, 'users', userId, 'tasks', id);
        await updateDoc(taskRef, { status: newStatus });
      } catch (e) {
        console.error('Failed to toggle task status in Firestore:', e);
        setTasks(prev => {
          const updated = prev.map(task => task.id === id ? { ...task, status: task.status === 'pending' ? 'completed' : 'pending' } : task);
          return sortTasks(updated as Task[]);
        });
      }
    };

    toggle();
  }, [userId, tasks]);

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
