// KPI Card component for dashboards using UI5 Card

import React from 'react';
import { Card, CardHeader, Icon, ProgressIndicator } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/trend-up.js';
import '@ui5/webcomponents-icons/dist/trend-down.js';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  progress?: number;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  progress,
}) => {
  const getValueState = (color: string) => {
    switch (color) {
      case 'green':
        return 'Positive';
      case 'red':
        return 'Negative';
      case 'yellow':
        return 'Critical';
      default:
        return 'None';
    }
  };

  return (
    <Card
      header={
        <CardHeader
          titleText={title}
          subtitleText={subtitle}
          avatar={icon ? <Icon name={icon} /> : undefined}
        />
      }
      className="h-full"
    >
      <div style={{ padding: '1rem' }}>
        <div className="flex items-end justify-between mb-4">
          <span className="text-3xl font-bold text-foreground">{value}</span>
          {trend && (
            <div
              className={`flex items-center text-sm ${
                trend.value >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <Icon name={trend.value >= 0 ? 'trend-up' : 'trend-down'} className="mr-1" />
              <span>
                {Math.abs(trend.value)}% {trend.label}
              </span>
            </div>
          )}
        </div>

        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <ProgressIndicator value={progress} valueState={getValueState(color)} />
          </div>
        )}
      </div>
    </Card>
  );
};
