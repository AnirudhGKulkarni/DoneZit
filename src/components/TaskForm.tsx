import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TaskFormData, Priority } from '@/types';
import { Button } from '@/components/ui/button';
import { X, Flag, Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  onClose: () => void;
}

const priorities: { value: Priority; label: string; className: string }[] = [
  { value: 'low', label: 'Low', className: 'priority-low' },
  { value: 'medium', label: 'Medium', className: 'priority-medium' },
  { value: 'high', label: 'High', className: 'priority-high' },
];

const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Study'];

export const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      deadline: new Date(deadline),
      priority,
      category: category || undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-2xl shadow-xl border p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">New Task</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-12 px-4 rounded-lg border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
            required
          />

          <textarea
            placeholder="Description (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors resize-none"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Deadline
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border-2 border-input bg-background text-foreground focus:border-primary/50 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flag className="w-4 h-4" /> Priority
            </label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "flex-1 py-2 rounded-lg font-medium text-sm transition-all",
                    priority === p.value ? p.className : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" /> Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(category === cat ? '' : cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    category === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" variant="gradient" size="lg" className="w-full">
            Create Task
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
};
