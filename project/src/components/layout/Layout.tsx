import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Don't show sidebar on auth pages
  if (isAuthPage) {
    return <Outlet />;
  }

  // Show sidebar only when authenticated
  return (
    <div className="flex h-screen bg-gray-100">
      {isAuthenticated && <Sidebar />}
      <main className={`flex-1 overflow-auto ${!isAuthenticated ? 'w-full' : ''}`}>
        <div className="container mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;