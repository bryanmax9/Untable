import { COLOR_CLASSES } from '@/lib/binder/colors';
import { cn } from '@/lib/utils';

interface BadgeProps {
  value: string;
  colorKey?: string; // key into COLOR_CLASSES
  className?: string;
}

export function Badge({ value, colorKey = 'default', className }: BadgeProps) {
  const { bg, text } = COLOR_CLASSES[colorKey] ?? COLOR_CLASSES.default;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap', bg, text, className)}>
      {value}
    </span>
  );
}
