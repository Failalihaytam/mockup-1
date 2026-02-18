import React from 'react';
import {
  AlertTriangle,
  Gauge,
  ListTodo,
  TrendingDown,
  TrendingUp,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../ui/utils';

export interface AnalyticalKPICardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  unit?: string;
  state?: string;
  trend?: 'Up' | 'Down' | 'None';
  deviation?: string;
  target?: number;
  icon?: string;
}

const iconMap: Record<string, LucideIcon> = {
  'trend-up': TrendingUp,
  warning: AlertTriangle,
  task: ListTodo,
  performance: Gauge,
};

const getTone = (state?: string) => {
  const normalized = (state ?? '').toLowerCase();

  if (normalized.includes('good') || normalized.includes('positive')) {
    return {
      value: 'text-primary',
      badge: 'bg-primary/12 text-primary',
      progress: 'var(--color-primary)',
    };
  }

  if (normalized.includes('error') || normalized.includes('negative')) {
    return {
      value: 'text-destructive',
      badge: 'bg-destructive/12 text-destructive',
      progress: 'var(--color-destructive)',
    };
  }

  if (normalized.includes('critical') || normalized.includes('warning')) {
    return {
      value: 'text-accent-foreground',
      badge: 'bg-accent text-accent-foreground',
      progress: 'var(--color-chart-5)',
    };
  }

  return {
    value: 'text-primary',
    badge: 'bg-primary/12 text-primary',
    progress: 'var(--color-primary)',
  };
};

export const AnalyticalKPICard: React.FC<AnalyticalKPICardProps> = ({
  title,
  subtitle,
  value,
  unit,
  state,
  trend = 'None',
  deviation,
  target,
  icon,
}) => {
  const Icon = icon ? iconMap[icon] : undefined;
  const tone = getTone(state);

  const numericValue = typeof value === 'number' ? value : Number(value);
  const hasNumericValue = Number.isFinite(numericValue);
  const progressValue =
    target !== undefined && hasNumericValue && target > 0
      ? Math.max(0, Math.min(100, (numericValue / target) * 100))
      : undefined;

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {title}
            </CardTitle>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          {Icon && (
            <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-md', tone.badge)}>
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
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </span>
          )}
        </div>

        {(deviation || target !== undefined) && (
          <p className="text-xs text-muted-foreground">
            {deviation ? `${deviation} · ` : ''}
            {target !== undefined ? `Target: ${target}` : ''}
          </p>
        )}

        {progressValue !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress to Target</span>
              <span>{progressValue.toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressValue}%`,
                  background: tone.progress,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
