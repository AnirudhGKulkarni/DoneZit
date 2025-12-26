import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, ListTodo } from 'lucide-react';

interface StatsCardsProps {
  stats: { total: number; completed: number; pending: number; overdue: number };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    { label: 'Total', value: stats.total, icon: ListTodo, className: 'bg-primary/80 text-foreground border border-border/10 shadow-sm' },
    { label: 'Pending', value: stats.pending, icon: Clock, className: 'bg-warning/80 text-foreground border border-border/10 shadow-sm' },
    { label: 'Done', value: stats.completed, icon: CheckCircle, className: 'bg-success/80 text-foreground border border-border/10 shadow-sm' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, className: 'bg-destructive/80 text-foreground border border-border/10 shadow-sm' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`rounded-xl p-3 ${card.className}`}
        >
          <card.icon className="w-5 h-5 mb-1" />
          <p className="text-2xl font-bold text-foreground">{card.value}</p>
          <p className="text-xs text-foreground/100">{card.label}</p>
        </motion.div>
      ))}
    </div>
  );
};
