import { Badge } from '@/components/ui/badge';
import type { ReadStatus } from '@/types';

const config: Record<ReadStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  'to-read': { label: 'To Read', variant: 'outline' },
  reading: { label: 'Reading', variant: 'default' },
  read: { label: 'Read', variant: 'secondary' },
};

export function StatusBadge({ status }: { status: ReadStatus }) {
  const { label, variant } = config[status] ?? config['to-read'];
  return <Badge variant={variant}>{label}</Badge>;
}
