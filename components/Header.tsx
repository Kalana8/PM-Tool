'use client';

import React, { useState } from 'react';
import {
  Bell,
  Search,
  ChevronRight,
  Sun,
  Moon,
  Bookmark,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { User, Notification } from '../lib/types';

interface HeaderProps {
  currentView: string;
  selectedProjectName?: string;
  onSearchClick: () => void;
  userRole: 'Admin' | 'Team Leader' | 'Team Member';
  currentUser: User;
  notifications: Notification[];
  onMarkNotificationsRead: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigate: (view: string, targetId?: string) => void;
  onSignOut: () => void;
}

export default function Header({
  currentView,
  selectedProjectName,
  onSearchClick,
  userRole,
  currentUser,
  notifications,
  onMarkNotificationsRead,
  darkMode,
  onToggleDarkMode,
  onNavigate,
  onSignOut
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notif: Notification) => {
    setShowNotifications(false);
    if (notif.type.startsWith('task')) {
      onNavigate('Tasks');
    } else if (notif.type === 'new_project') {
      onNavigate('Projects');
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-8 transition-all duration-300">
      {/* Breadcrumbs & View Title */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-colors cursor-pointer" onClick={() => onNavigate('Dashboard')}>
          OmniWork
        </span>
        <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700" />
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
          {currentView}
        </span>
        {selectedProjectName && currentView === 'Projects' && (
          <>
            <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
              {selectedProjectName}
            </span>
          </>
        )}
      </div>

      {/* Center/Right controls */}
      <div className="flex items-center gap-4">
        {/* Search Input Bar (triggers Ctrl+K) */}
        <button
          id="trigger-search"
          onClick={onSearchClick}
          className="hidden md:flex items-center justify-between rounded-lg bg-slate-100 dark:bg-slate-900 px-4 py-2 text-xs text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-all duration-200 w-80 text-left cursor-pointer"
        >
          <span>Search system...</span>
          <span className="opacity-50 text-[10px]">Ctrl + K</span>
        </button>

        {/* Current signed-in role (read-only — comes from who's logged in) */}
        <div
          id="current-role-badge"
          className="flex items-center gap-1.5 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/60 dark:bg-blue-950/20 px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{userRole}</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          id="theme-toggle"
          onClick={onToggleDarkMode}
          className="rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 transition-all duration-200 cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {darkMode ? <Moon className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" /> : <Sun className="h-4.5 w-4.5 text-amber-500" />}
        </button>

        {/* Notifications Icon with Indicator */}
        <div className="relative">
          <button
            id="notifications-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 transition-all duration-200"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              id="notifications-dropdown"
              className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-2 shadow-xl ring-1 ring-black/5 z-30"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 px-3 py-2 mb-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Notification Center ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    id="mark-all-read"
                    onClick={() => {
                      onMarkNotificationsRead();
                    }}
                    className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="max-h-[280px] overflow-y-auto space-y-1.5 scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      id={`notif-${notif.id}`}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left text-xs transition-colors ${
                        notif.read
                          ? 'hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400'
                          : 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/60 text-gray-900 dark:text-gray-100 font-medium'
                      }`}
                    >
                      <div className={`mt-0.5 rounded-full p-1 ${
                        notif.type === 'task_assigned' ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600' :
                        notif.type === 'task_approved' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' :
                        notif.type === 'task_rejected' ? 'bg-red-100 dark:bg-red-950/40 text-red-600' :
                        'bg-blue-100 dark:bg-blue-950/40 text-blue-600'
                      }`}>
                        {notif.type === 'task_approved' ? <ShieldCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[11px] leading-tight truncate">{notif.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-normal">{notif.message}</p>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 block">{notif.time}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Card */}
        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-800 pl-4">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              {currentUser.title}
            </p>
          </div>
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="h-9 w-9 rounded-full border border-gray-200 dark:border-gray-800 object-cover shadow-sm hover:opacity-90 cursor-pointer transition-opacity"
            onClick={() => onNavigate('Settings')}
          />
          <button
            id="sign-out-btn"
            onClick={onSignOut}
            title="Sign Out"
            className="rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-red-500 p-2 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
