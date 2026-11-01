import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-row font-sans text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content Area with Header */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100/70">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-slate-100/70">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
