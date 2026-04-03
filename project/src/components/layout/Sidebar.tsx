import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  History,
  Bot,
  Cpu,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar: React.FC = () => {
  const { logout, isAdmin } = useAuth();

  // Unified class for NavLinks to keep code clean
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ease-out ${
      isActive
        ? "bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 text-amber-500"
        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
    }`;

  return (
    <div className="bg-[#0f172a] text-slate-200 w-72 h-screen flex flex-col border-r border-slate-800/50 font-sans">
      {/* Brand Header */}
      <div className="px-8 py-10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500 blur-md opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-xl shadow-lg shadow-amber-900/20">
              <Zap className="h-6 w-6 text-slate-900 stroke-[2.5px]" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
              Solar
              <span className="text-amber-500 underline decoration-amber-500/30 underline-offset-4">
                Inspector
              </span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-1.5 font-semibold">
              Enterprise AI
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-8 custom-scrollbar">
        {/* Main Section */}
        <div>
          <h2 className="px-4 mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Operations
          </h2>
          <ul className="space-y-1.5">
            <li>
              <NavLink to="/" className={navLinkClass}>
                <div className="flex items-center">
                  <LayoutDashboard className="h-5 w-5 mr-3 stroke-[1.5px]" />
                  <span className="font-medium text-[14px]">Dashboard</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            </li>
            <li>
              <NavLink to="/panels" className={navLinkClass}>
                <div className="flex items-center">
                  <Cpu className="h-5 w-5 mr-3 stroke-[1.5px]" />
                  <span className="font-medium text-[14px]">
                    Panel Management
                  </span>
                </div>
              </NavLink>
            </li>
            <li>
              <NavLink to="/inspections" className={navLinkClass}>
                <div className="flex items-center">
                  <History className="h-5 w-5 mr-3 stroke-[1.5px]" />
                  <span className="font-medium text-[14px]">Audit Logs</span>
                </div>
              </NavLink>
            </li>
            <li>
              <NavLink to="/ai-assistance" className={navLinkClass}>
                <div className="flex items-center">
                  <Bot className="h-5 w-5 mr-3 stroke-[1.5px]" />
                  <span className="font-medium text-[14px]">AI Inspector</span>
                </div>
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="pt-2">
            <h2 className="px-4 mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 flex items-center">
              <ShieldCheck className="h-3 w-3 mr-2" /> Administration
            </h2>
            <ul className="space-y-1.5">
              <li>
                <NavLink to="/grid-builder" className={navLinkClass}>
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 mr-3 stroke-[1.5px]" />
                    <span className="font-medium text-[14px]">
                      Grid Infrastructure
                    </span>
                  </div>
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* Bottom Profile/Action Section */}
      <div className="p-6 bg-slate-900/30 border-t border-slate-800/50">
        <button
          onClick={logout}
          className="flex items-center justify-center space-x-3 w-full py-3 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 group"
        >
          <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold tracking-wide">
            Terminate Session
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
