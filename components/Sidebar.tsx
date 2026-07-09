'use client';

import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Briefcase,
  FileText,
  CalendarDays,
  BarChart3,
  Files,
  Users,
  Settings,
  Bell,
  Clock,
  ShieldAlert,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Department } from '../lib/types';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  departments: Department[];
  selectedDeptId: string | null;
  onDeptSelect: (id: string | null) => void;
  userRole: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  departments,
  selectedDeptId,
  onDeptSelect,
  userRole,
  collapsed,
  onToggleCollapsed
}: SidebarProps) {
  const sections = [
    {
      title: null,
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, views: ['Dashboard'] }
      ]
    },
    {
      title: 'Project Management',
      items: [
        { name: 'Departments', icon: FolderOpen, views: ['Departments'] },
        { name: 'Tasks', icon: FileText, views: ['Tasks'] },
        { name: 'Calendar', icon: CalendarDays, views: ['Calendar'] }
      ]
    },
    {
      title: 'HR Management',
      items: [
        { name: 'Attendance', icon: Clock, views: ['Attendance'] },
        { name: 'Users', icon: Users, views: ['Users'] },
        { name: 'Reports', icon: BarChart3, views: ['Reports'] },
        { name: 'Settings', icon: Settings, views: ['Settings'] }
      ]
    }
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className={`flex h-16 items-center border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-6'}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 shrink-0">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <line x1="3" x2="21" y1="9" y2="9"/>
          <line x1="9" x2="9" y1="21" y2="9"/>
        </svg>
        {!collapsed && (
          <span className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-slate-50">OMNIWORK</span>
        )}
      </div>

      {/* Collapse/Expand Toggle */}
      <button
        id="sidebar-collapse-toggle"
        onClick={onToggleCollapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={`flex items-center gap-2 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900 transition-colors cursor-pointer ${
          collapsed ? 'justify-center px-2' : 'px-6'
        }`}
      >
        {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
        {!collapsed && <span>Collapse</span>}
      </button>

      {/* User Role Badge */}
      {!collapsed && (
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-900/60 bg-slate-50/40 dark:bg-slate-900/15">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {userRole} Mode
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-thin">
        <nav className="space-y-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              {section.title && !collapsed && (
                <div className="px-6 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.views.includes(currentView);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      id={`sidebar-link-${item.name.toLowerCase()}`}
                      onClick={() => onViewChange(item.name)}
                      title={collapsed ? item.name : undefined}
                      className={`flex w-full items-center py-2.5 text-sm font-medium transition-all duration-200 border-r-3 ${
                        collapsed ? 'justify-center px-2' : 'gap-3 px-6'
                      } ${
                        isActive
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      {!collapsed && <span>{item.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Departments Filter Segment */}
        {!collapsed && (
          <div className="pt-5 border-t border-slate-100 dark:border-slate-900 mt-4">
            <div className="flex items-center justify-between px-6 mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Departments
              </span>
            </div>
            <div className="space-y-0.5">
              <button
                id="dept-filter-all"
                onClick={() => onDeptSelect(null)}
                className={`flex w-full items-center gap-2.5 px-6 py-2 text-left text-xs transition-colors ${
                  selectedDeptId === null
                    ? 'bg-slate-50 dark:bg-slate-900/40 text-slate-950 dark:text-slate-50 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/30 dark:hover:bg-slate-900/20 hover:text-slate-800'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                All Departments
              </button>
              {departments.map((dept) => {
                const isSelected = selectedDeptId === dept.id;
                return (
                  <button
                    key={dept.id}
                    id={`dept-filter-${dept.id}`}
                    onClick={() => onDeptSelect(dept.id)}
                    className={`flex w-full items-center gap-2.5 px-6 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-slate-50 dark:bg-slate-900/40 text-slate-950 dark:text-slate-50 font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/30 dark:hover:bg-slate-900/20 hover:text-slate-800'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      dept.id === 'dept-webdev' ? 'bg-indigo-500' :
                      dept.id === 'dept-uiux' ? 'bg-amber-500' :
                      dept.id === 'dept-qa' ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}></span>
                    <span className="truncate">{dept.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="border-t border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/10 p-4">
          <div className="rounded-xl border border-blue-100 dark:border-blue-950/40 bg-blue-50/40 dark:bg-blue-950/10 p-3">
            <div className="flex gap-2">
              <ShieldAlert className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-blue-900 dark:text-blue-300">Prototype Environment</p>
                <p className="text-[9px] text-blue-700/80 dark:text-blue-400/70 mt-0.5 leading-normal">
                  Easily toggle user roles in the top navbar to explore all workflows instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
