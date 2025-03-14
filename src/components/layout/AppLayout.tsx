import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

/**
 * App layout props
 */
interface AppLayoutProps {
  children?: ReactNode;
}

/**
 * Main application layout
 * Provides consistent structure for all pages
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Header would go here */}
      
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      
      {/* Footer would go here */}
    </div>
  );
}

export default AppLayout; 