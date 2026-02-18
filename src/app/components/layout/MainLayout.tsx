// Main layout with SAP Fiori ShellBar and SideNavigation
import React from 'react';
import { Outlet } from 'react-router';
import { FlexBox, FlexBoxDirection } from '@ui5/webcomponents-react';
import { AppShell } from './AppShell';
import { AppNavigation } from './AppNavigation';

export const MainLayout: React.FC = () => {
  return (
    <AppShell>
      <FlexBox 
        direction={FlexBoxDirection.Row} 
        style={{ 
          height: 'calc(100vh - 44px)', 
          width: '100vw',
          overflow: 'hidden'
        }}
      >
        <AppNavigation />
        <FlexBox 
          direction={FlexBoxDirection.Column} 
          style={{ 
            flexGrow: 1, 
            overflowY: 'auto', 
            background: 'var(--sapBackgroundColor)',
          }}
        >
          <Outlet />
        </FlexBox>
      </FlexBox>
    </AppShell>
  );
};
