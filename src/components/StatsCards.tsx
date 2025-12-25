import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, ListTodo } from 'lucide-react';

interface StatsCardsProps {
  stats: { total: number; completed: number; pending: number; overdue: number };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    { label: 'Total', value: stats.total, icon: ListTodo, className: 'bg-primary/10 text-primary' },
    { label: 'Pending', value: stats.pending, icon: Clock, className: 'bg-warning/10 text-warning' },
    { label: 'Done', value: stats.completed, icon: CheckCircle, className: 'bg-success/10 text-success' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
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
          <p className="text-2xl font-bold">{card.value}</p>
          <p className="text-xs opacity-80">{card.label}</p>
        </motion.div>
      ))}
    </div>
  );
};
