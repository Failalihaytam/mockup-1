import React from 'react';
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  Gauge,
  History,
  ListTodo,
  Siren,
  TrendingUp,
  Users,
  ArrowDownRight,
  ArrowUpRight,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { cn } from '../ui/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  unit?: string;
  icon?: string;
  color?: string;
  progress?: number;
  trend?: 'Up' | 'Down' | 'None';
  state?: string;
  target?: string | number;
  deviation?: string;
}

const iconMap: Record<string, LucideIcon> = {
  group: Users,
  task: ListTodo,
  'project-definition-triangle-2': FolderKanban,
  alert: AlertTriangle,
  timesheet: Clock3,
  'trend-up': TrendingUp,
  document: FileText,
  accept: CheckCircle2,
  incident: Siren,
  history: History,
  performance: Gauge,
  'business-objects-experience': BriefcaseBusiness,
};

const resolveTone = (
  color?: string,
  state?: string
): {
  chip: string;
  value: string;
  border: string;
} => {
  const normalized = (state ?? color ?? '').toLowerCase();

  if (normalized.includes('good') || normalized.includes('positive') || normalized === 'green') {
    return {
      chip: 'bg-primary/12 text-primary',
      value: 'text-primary',
      border: 'border-primary/35',
    };
  }

  if (normalized.includes('error') || normalized.includes('negative') || normalized === 'red') {
    return {
      chip: 'bg-destructive/12 text-destructive',
      value: 'text-destructive',
      border: 'border-destructive/35',
    };
  }

  if (
    normalized.includes('critical') ||
    normalized.includes('warning') ||
    normalized === 'yellow' ||
    normalized === 'orange'
  ) {
    return {
      chip: 'bg-accent text-accent-foreground',
      value: 'text-accent-foreground',
      border: 'border-accent',
    };
  }

  return {
    chip: 'bg-primary/10 text-primary',
    value: 'text-primary',
    border: 'border-primary/30',
  };
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  unit,
  icon,
  color,
  progress,
  trend = 'None',
  state,
  target,
  deviation,
}) => {
  const Icon = icon ? iconMap[icon] : undefined;
  const tone = resolveTone(color, state);

  return (
    <Card className={cn('overflow-hidden border bg-card shadow-none transition-colors hover:border-primary/40', tone.border)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {title}
            </CardTitle>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {Icon && (
            <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-md', tone.chip)}>
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-end gap-2">
          <span className={cn('text-3xl font-semibold tracking-tight', tone.value)}>{value}</span>
          {unit && <span className="pb-1 text-sm text-muted-foreground">{unit}</span>}
          {trend !== 'None' && (
            <span className="pb-1">
              {trend === 'Up' ? (
                <ArrowUpRight className="h-4 w-4 text-primary" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
            </span>
          )}
        </div>

        {(deviation || target !== undefined) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {deviation && <Badge variant="secondary">{deviation}</Badge>}
            {target !== undefined && <span>Target: {target}</span>}
          </div>
        )}

        {progress !== undefined && <Progress value={Math.max(0, Math.min(100, progress))} />}
      </CardContent>
    </Card>
  );
};
