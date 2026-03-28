'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';
import { LayoutDashboard, Users, LogOut, CheckSquare, Menu, X, Settings } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, updateUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Team', href: '/admin', icon: Users, adminOnly: true },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });

  const handleProfileUpdate = (updatedUser) => {
    updateUser(updatedUser);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 lg:px-6 lg:py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">Task2Track</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2">
        {filteredItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setProfileOpen(true); setMobileOpen(false); }}
            className="w-9 h-9 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            title="Edit Profile"
          >
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
          </button>
          <div className="flex-1 min-w-0">
            <button 
              onClick={() => { setProfileOpen(true); setMobileOpen(false); }}
              className="text-sm font-medium text-white truncate block hover:text-indigo-300 transition-colors cursor-pointer text-left w-full"
            >
              {user?.name || 'User'}
            </button>
            <p className="text-xs text-slate-400 capitalize">{user?.role || 'Member'}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 bg-slate-800 text-white flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile */}
      <aside className={`lg:hidden fixed left-0 top-0 h-screen w-65 bg-slate-800 text-white flex flex-col z-50 transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        onUpdate={handleProfileUpdate}
      />
    </>
  );
}
