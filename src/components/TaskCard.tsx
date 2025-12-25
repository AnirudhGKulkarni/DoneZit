import React from 'react';
import { motion } from 'framer-motion';
import { Task } from '@/types';
import { format, isPast, isToday } from 'date-fns';
import { CheckCircle2, Circle, Trash2, Calendar, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

const priorityConfig = {
  high: { label: 'High', className: 'priority-high', textClass: 'priority-high-text' },
  medium: { label: 'Medium', className: 'priority-medium', textClass: 'priority-medium-text' },
  low: { label: 'Low', className: 'priority-low', textClass: 'priority-low-text' },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete }) => {
  const isCompleted = task.status === 'completed';
  const deadline = new Date(task.deadline);
  const isOverdue = !isCompleted && isPast(deadline) && !isToday(deadline);
  const isDueToday = !isCompleted && isToday(deadline);
  const priority = priorityConfig[task.priority];

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border bg-card p-4 shadow-md transition-all duration-200",
        isCompleted && "opacity-60",
        isOverdue && "border-destructive/50"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 transition-transform duration-200 hover:scale-110"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-success" />
          ) : (
            <Circle className={cn("w-6 h-6", priority.textClass)} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-foreground",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              priority.className
            )}>
              <Flag className="w-3 h-3 inline mr-1" />
              {priority.label}
            </span>

            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
              isOverdue ? "bg-destructive/10 text-destructive" :
              isDueToday ? "bg-warning/10 text-warning" :
              "bg-muted text-muted-foreground"
            )}>
              <Calendar className="w-3 h-3" />
              {format(deadline, 'MMM d, h:mm a')}
            </span>

            {task.category && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                {task.category}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
