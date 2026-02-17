// Main layout with sidebar and top bar

import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-auto bg-background p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
