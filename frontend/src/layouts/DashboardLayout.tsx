import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { 
  Home, 
  LayoutDashboard, 
  Search, 
  Sparkles, 
  Upload, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  Atom
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Search Papers', path: '/search', icon: Search },
    { name: 'AI Tools', path: '/tools', icon: Sparkles },
    { name: 'Upload PDF', path: '/upload', icon: Upload },
    { name: 'Doc Space', path: '/docspace', icon: FileText },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0E0A22] border-r border-violet-900/40">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-violet-900/30">
        <div className="p-2 bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-lg text-white shadow-purpleGlow">
          <Atom className="w-6 h-6 animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-outfit bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
            ResearchHub AI
          </h1>
          <span className="text-xs text-violet-400/80 tracking-widest font-mono uppercase">Agentic Copilot</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300
              ${isActive 
                ? 'bg-gradient-to-r from-violet-600/30 to-violet-500/10 text-violet-300 border-l-4 border-violet-500 font-semibold shadow-purpleGlow' 
                : 'text-gray-400 hover:bg-violet-950/20 hover:text-gray-200'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer info */}
      <div className="p-4 border-t border-violet-900/30 bg-[#0A0718]/45">
        <div className="flex items-center gap-3 px-2 py-3 mb-2 rounded-xl bg-violet-950/20">
          <div className="p-2 rounded-lg bg-violet-900/50 text-violet-300">
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-gray-200">{user?.username}</p>
            <p className="text-xs truncate text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0B0816] text-[#F3F4F6]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between px-6 py-4 md:hidden border-b border-violet-900/30 bg-[#0E0A22]">
          <div className="flex items-center gap-2">
            <Atom className="w-6 h-6 text-violet-500" />
            <span className="text-lg font-bold font-outfit text-white">ResearchHub AI</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:bg-violet-950/40"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="relative flex flex-col w-72 max-w-xs h-full z-10"
              >
                <div className="absolute top-4 right-4 z-20">
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 rounded-lg bg-violet-950/50 text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <SidebarContent />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
