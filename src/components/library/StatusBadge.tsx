import type { ReadStatus } from '@/types';
import { cn } from '@/lib/utils';

const styles: Record<ReadStatus, { label: string; className: string }> = {
  'to-read': {
    label: 'To Read',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  reading: {
    label: 'Reading',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  read: {
    label: 'Read',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
};

export function StatusBadge({ status }: { status: ReadStatus }) {
  const { label, className } = styles[status] ?? styles['to-read'];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
        className
      )}
    >
      {label}
    </span>
  );
}
