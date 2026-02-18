// SAP Fiori Analytical KPI Card component

import React from 'react';
import {
  Card,
  AnalyticalCardHeader,
  FlexBox,
  FlexBoxDirection,
  FlexBoxAlignItems,
  ValueColor,
  DeviationIndicator,
  Icon,
} from '@ui5/webcomponents-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  unit?: string;
  icon?: string;
  color?: string;
  progress?: number;
  trend?: 'Up' | 'Down' | 'None';
  state?: ValueColor;
  target?: string | number;
  deviation?: string;
}

const colorToState = (color?: string): ValueColor => {
  switch (color) {
    case 'green':
      return ValueColor.Good;
    case 'red':
      return ValueColor.Error;
    case 'yellow':
      return ValueColor.Critical;
    case 'blue':
      return ValueColor.Neutral;
    default:
      return ValueColor.None;
  }
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
  // Map trend string to DeviationIndicator enum
  const indicator =
    trend === 'Up'
      ? DeviationIndicator.Up
      : trend === 'Down'
        ? DeviationIndicator.Down
        : DeviationIndicator.None;

  // Resolve state: explicit state prop takes precedence, otherwise derive from color
  const resolvedState = state ?? colorToState(color);

  return (
    <Card
      header={
        <AnalyticalCardHeader
          titleText={title}
          subtitleText={subtitle}
          state={resolvedState}
          value={value.toString()}
          scale={unit}
          status={deviation}
          trend={indicator}
        />
      }
    >
      <FlexBox
        direction={FlexBoxDirection.Column}
        alignItems={FlexBoxAlignItems.Center}
        style={{ padding: '0.75rem', minHeight: '2rem' }}
      >
        {icon && <Icon name={icon} style={{ fontSize: '1.5rem', opacity: 0.5 }} />}
        {progress !== undefined && (
          <div style={{ width: '100%', marginTop: '0.25rem' }}>
            <div
              style={{
                height: '4px',
                borderRadius: '2px',
                background: 'var(--sapContent_ForegroundBorderColor, #d9d9d9)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  height: '100%',
                  borderRadius: '2px',
                  background: 'var(--sapBrandColor, #0a6ed1)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}
      </FlexBox>
    </Card>
  );
};
