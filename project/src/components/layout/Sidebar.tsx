import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sun, Grid, ClipboardList, LogOut, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { logout, isAdmin } = useAuth();

  return (
    <div className="bg-gray-900 text-gray-100 w-64 h-screen flex flex-col shadow-xl">
      {/* Logo and app name */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 p-2.5 rounded-lg shadow-md transform transition-transform duration-300 hover:rotate-12 hover:scale-110">
            <Sun className="h-5 w-5 text-gray-900" />
          </div>
          <h1 className="text-xl font-bold text-amber-400">
            Solar Inspector
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <div className="mb-4 px-2">
          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Main Menu</p>
        </div>
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out transform ${
                  isActive
                    ? 'bg-gray-800 text-amber-400 translate-x-2 shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-amber-300 hover:translate-x-1'
                }`
              }
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              <span className="font-medium">Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/panels"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out transform ${
                  isActive
                    ? 'bg-gray-800 text-amber-400 translate-x-2 shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-amber-300 hover:translate-x-1'
                }`
              }
            >
              <Grid className="h-5 w-5 mr-3" />
              <span className="font-medium">Manage Panels</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/inspections"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out transform ${
                  isActive
                    ? 'bg-gray-800 text-amber-400 translate-x-2 shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-amber-300 hover:translate-x-1'
                }`
              }
            >
              <ClipboardList className="h-5 w-5 mr-3" />
              <span className="font-medium">Inspection History</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/ai-assistance"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out transform ${
                  isActive
                    ? 'bg-gray-800 text-amber-400 translate-x-2 shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-amber-300 hover:translate-x-1'
                }`
              }
            >
              <span className="h-5 w-5 mr-3" role="img" aria-label="AI">🤖</span>
              <span className="font-medium">AI Assistance</span>
            </NavLink>
          </li>

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="pt-6 mb-3 px-2">
                <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Admin Area</p>
                <div className="h-0.5 w-12 bg-gray-700 mt-2"></div>
              </div>
            <li>
              <NavLink
                to="/grid-builder"
                className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out transform ${
                    isActive
                        ? 'bg-gray-800 text-amber-400 translate-x-2 shadow-md'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-amber-300 hover:translate-x-1'
                  }`
                }
              >
                  <Settings className="h-5 w-5 mr-3" />
                  <span className="font-medium">Grid Builder</span>
              </NavLink>
            </li>
            </>
          )}
        </ul>
      </nav>

      {/* Footer with logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center p-3 w-full text-left rounded-lg text-gray-300 hover:bg-gray-800 transition-all duration-200 ease-in-out group"
        >
          <div className="relative">
            <LogOut className="h-5 w-5 mr-3 group-hover:text-red-400 transition-colors duration-200" />
            <span className="absolute top-0 left-0 w-full h-full bg-gray-900 rounded-full animate-ping opacity-0 group-hover:opacity-30"></span>
          </div>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;