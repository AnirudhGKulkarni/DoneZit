import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { useAuthContext } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';

import TopNav from '@/components/TopNav';
import VideoBg from '@/components/VideoBg';
import { TaskCard } from '@/components/TaskCard';
import { TaskForm } from '@/components/TaskForm';
import { FilterBar } from '@/components/FilterBar';
import { StatsCards } from '@/components/StatsCards';

import { Button } from '@/components/ui/button';
// header-related dropdown/avatar removed; TopNav provides those

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('theme');
      if (v) return v === 'dark';
    } catch {}
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch {}
  }, [isDark]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err: any) {
      toast({
        title: 'Logout failed',
        description: err?.message || 'Unable to logout',
        variant: 'destructive',
      });
    }
  };

  const {
    filteredTasks,
    filter,
    categoryFilter,
    setFilter,
    setCategoryFilter,
    addTask,
    deleteTask,
    toggleTaskStatus,
    getTaskStats,
  } = useTasks(user?.uid || null);

  const stats = getTaskStats();

  return (
    <div className="min-h-screen bg-transparent relative">
      <VideoBg />
      <TopNav />

      {/* ================= MAIN ================= */}
      <main className="relative z-10 container mx-auto px-4 py-6 space-y-6">
        <StatsCards stats={stats} />

        <FilterBar
          filter={filter}
          categoryFilter={categoryFilter}
          onFilterChange={setFilter}
          onCategoryChange={setCategoryFilter}
        />

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Task
          </Button>
        </motion.div>

        {/* Task List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-muted-foreground">No tasks found</p>
              </motion.div>
            ) : (
              filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TaskCard
                    task={task}
                    onToggle={() => toggleTaskStatus(task.id)}
                    onDelete={() => deleteTask(task.id)}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ================= TASK MODAL ================= */}
      <AnimatePresence>
        {showForm && (
          <TaskForm
            onSubmit={async data => {
              if (!user?.uid) {
                toast({ title: 'Not authenticated' });
                return;
              }
              try {
                await addTask(data);
                setShowForm(false);
                toast({ title: 'Task added successfully' });
              } catch {
                toast({
                  title: 'Error',
                  description: 'Failed to add task',
                  variant: 'destructive',
                });
              }
            }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default Dashboard;