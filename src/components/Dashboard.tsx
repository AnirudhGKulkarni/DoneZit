import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from '@/components/TaskCard';
import { TaskForm } from '@/components/TaskForm';
import { FilterBar } from '@/components/FilterBar';
import { StatsCards } from '@/components/StatsCards';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, CheckCircle2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuthContext();
  const [showForm, setShowForm] = useState(false);
  const {
    filteredTasks,
    filter,
    categoryFilter,
    setFilter,
    setCategoryFilter,
    addTask,
    deleteTask,
    toggleTaskStatus,
    getTaskStats
  } = useTasks(user?.uid || null);

  const stats = getTaskStats();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TaskFlow</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Filter Bar */}
        <FilterBar
          filter={filter}
          categoryFilter={categoryFilter}
          onFilterChange={setFilter}
          onCategoryChange={setCategoryFilter}
        />

        {/* Add Task Button */}
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

      {/* Task Form Modal */}
      <AnimatePresence>
        {showForm && (
          <TaskForm
            onSubmit={(data) => {
              addTask(data);
              setShowForm(false);
            }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
