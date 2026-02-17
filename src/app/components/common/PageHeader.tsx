// Page header with breadcrumbs using UI5 Web Components

import React from 'react';
import { useNavigate } from 'react-router';
import {
  Breadcrumbs,
  BreadcrumbsItem,
  Title,
  Text,
  FlexBox,
  FlexBoxJustifyContent,
  FlexBoxAlignItems,
  FlexBoxDirection,
} from '@ui5/webcomponents-react';

interface Breadcrumb {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs className="mb-2">
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbsItem
              key={index}
              onClick={() => crumb.path && navigate(crumb.path)}
              style={{ cursor: crumb.path ? 'pointer' : 'default' }}
            >
              {crumb.label}
            </BreadcrumbsItem>
          ))}
        </Breadcrumbs>
      )}
      
      <FlexBox
        justifyContent={FlexBoxJustifyContent.SpaceBetween}
        alignItems={FlexBoxAlignItems.Center}
      >
        <FlexBox direction={FlexBoxDirection.Column}>
          <Title level="H2">{title}</Title>
          {subtitle && <Text className="text-gray-500 mt-1">{subtitle}</Text>}
        </FlexBox>
        
        {actions && (
          <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: '0.5rem' }}>
            {actions}
          </FlexBox>
        )}
      </FlexBox>
    </div>
  );
};
