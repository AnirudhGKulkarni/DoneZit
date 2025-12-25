import React from 'react';
import { FilterType } from '@/types';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filter: FilterType;
  categoryFilter: string | null;
  onFilterChange: (filter: FilterType) => void;
  onCategoryChange: (category: string | null) => void;
}

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Done' },
  { value: 'high-priority', label: 'High' },
  { value: 'due-today', label: 'Today' },
  { value: 'overdue', label: 'Overdue' },
];

export const FilterBar: React.FC<FilterBarProps> = ({ filter, onFilterChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilterChange(f.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
            filter === f.value
              ? "gradient-primary text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
};
