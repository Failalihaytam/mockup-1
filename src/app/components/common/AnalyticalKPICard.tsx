// SAP Fiori AnalyticalCard with NumericContent for KPIs
import React from 'react';
import {
  Card,
  CardHeader,
  NumericSideIndicator,
  DeviationIndicator,
  ValueColor,
} from '@ui5/webcomponents-react';

export interface AnalyticalKPICardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  unit?: string;
  state?: ValueColor;
  trend?: 'Up' | 'Down' | 'None';
  deviation?: string;
  target?: number;
  icon?: string;
}

export const AnalyticalKPICard: React.FC<AnalyticalKPICardProps> = ({
  title,
  subtitle,
  value,
  unit,
  state = ValueColor.None,
  trend = 'None',
  deviation,
  target,
  icon,
}) => {
  const getStateColor = (state: ValueColor) => {
    switch (state) {
      case ValueColor.Good:
      case ValueColor.Positive:
        return 'var(--sapPositiveColor)';
      case ValueColor.Error:
      case ValueColor.Negative:
        return 'var(--sapNegativeColor)';
      case ValueColor.Critical:
        return 'var(--sapCriticalColor)';
      default:
        return 'var(--sapNeutralColor)';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Up':
        return '↑';
      case 'Down':
        return '↓';
      default:
        return '';
    }
  };

  return (
    <Card
      header={
        <CardHeader
          titleText={title}
          subtitleText={subtitle}
          avatar={icon ? <ui5-icon name={icon} /> : undefined}
        />
      }
      style={{
        width: '100%',
        minHeight: '180px',
      }}
    >
      <div
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {/* Main Value */}
        <div
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: getStateColor(state),
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.25rem',
          }}
        >
          <span>{value}</span>
          {unit && (
            <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--sapTextColor)' }}>
              {unit}
            </span>
          )}
          {trend !== 'None' && (
            <span style={{ fontSize: '1.5rem', marginLeft: '0.5rem' }}>
              {getTrendIcon(trend)}
            </span>
          )}
        </div>

        {/* Deviation */}
        {deviation && (
          <div style={{ fontSize: '0.875rem', color: 'var(--sapNeutralTextColor)' }}>
            {deviation}
          </div>
        )}

        {/* Target Progress */}
        {target !== undefined && typeof value === 'number' && (
          <div style={{ marginTop: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--sapNeutralTextColor)',
                marginBottom: '0.25rem',
              }}
            >
              <span>Progress</span>
              <span>
                {value} / {target}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--sapNeutralBackground)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (value / target) * 100)}%`,
                  height: '100%',
                  backgroundColor: getStateColor(state),
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
