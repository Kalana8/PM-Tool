'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Briefcase, FileText, Folder, User as UserIcon, X } from 'lucide-react';
import { Project, Task, Department, User } from '../lib/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  departments: Department[];
  users: User[];
  onNavigate: (view: string, targetId?: string) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  projects,
  tasks,
  departments,
  users,
  onNavigate
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredProjects = query
    ? projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : projects.slice(0, 3);

  const filteredTasks = query
    ? tasks.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))
    : tasks.slice(0, 3);

  const filteredDepts = query
    ? departments.filter(d => d.name.toLowerCase().includes(query.toLowerCase()))
    : departments.slice(0, 3);

  const filteredUsers = query
    ? users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()))
    : users.slice(0, 3);

  const handleItemClick = (view: string, id?: string) => {
    onNavigate(view, id);
    onClose();
    setQuery('');
  };

  const hasResults =
    filteredProjects.length > 0 ||
    filteredTasks.length > 0 ||
    filteredDepts.length > 0 ||
    filteredUsers.length > 0;

  return (
    <div
      id="command-palette-overlay"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-24 pb-6 px-4 backdrop-blur-sm transition-all duration-200"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl transition-all duration-300">
        {/* Search Input Header */}
        <div className="flex items-center border-b border-gray-100 dark:border-gray-900 px-4 py-3">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            id="command-palette-input"
            ref={inputRef}
            type="text"
            placeholder="Type a command or search (projects, tasks, users)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-0"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-1.5 font-mono text-[10px] font-medium text-gray-400 shadow-sm mr-2">
            ESC
          </kbd>
          <button
            id="close-command-palette"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin">
          {!hasResults && (
            <div className="py-12 text-center">
              <Command className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No results found</p>
              <p className="text-xs text-gray-400 mt-1">Try searching for keywords like website, design, refactor, or a team member.</p>
            </div>
          )}

          {/* Quick Views */}
          {query === '' && (
            <div className="mb-4">
              <h4 className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Navigation Commands</h4>
              <div className="grid grid-cols-2 gap-1 px-1">
                <button
                  id="nav-to-dashboard"
                  onClick={() => handleItemClick('Dashboard')}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 text-left transition-colors"
                >
                  <Command className="h-3.5 w-3.5 text-blue-500" />
                  Go to Dashboard
                </button>
                <button
                  id="nav-to-tasks"
                  onClick={() => handleItemClick('Tasks')}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 text-left transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-500" />
                  Go to Tasks Board
                </button>
                <button
                  id="nav-to-projects"
                  onClick={() => handleItemClick('Projects')}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 text-left transition-colors"
                >
                  <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                  Go to Projects
                </button>
                <button
                  id="nav-to-attendance"
                  onClick={() => handleItemClick('Attendance')}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 text-left transition-colors"
                >
                  <Folder className="h-3.5 w-3.5 text-rose-500" />
                  Go to Attendance Log
                </button>
              </div>
            </div>
          )}

          {/* Projects Section */}
          {filteredProjects.length > 0 && (
            <div className="mb-3">
              <h4 className="px-3 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Projects</h4>
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  id={`palette-project-${project.id}`}
                  onClick={() => handleItemClick('Projects', project.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="h-4 w-4 text-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-sm">{project.description}</p>
                    </div>
                  </div>
                  <span className="rounded bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                    {project.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Tasks Section */}
          {filteredTasks.length > 0 && (
            <div className="mb-3">
              <h4 className="px-3 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tasks</h4>
              {filteredTasks.map((task) => (
                <button
                  key={task.id}
                  id={`palette-task-${task.id}`}
                  onClick={() => handleItemClick('Tasks', task.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Due {task.dueDate} • Progress {task.progress}%</p>
                    </div>
                  </div>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                    task.priority === 'High'
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
                      : task.priority === 'Medium'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                  }`}>
                    {task.priority}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Departments Section */}
          {filteredDepts.length > 0 && (
            <div className="mb-3">
              <h4 className="px-3 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Departments</h4>
              {filteredDepts.map((dept) => (
                <button
                  key={dept.id}
                  id={`palette-dept-${dept.id}`}
                  onClick={() => handleItemClick('Departments', dept.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Folder className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{dept.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{dept.code} department</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Users Section */}
          {filteredUsers.length > 0 && (
            <div className="mb-1">
              <h4 className="px-3 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Team Members</h4>
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  id={`palette-user-${user.id}`}
                  onClick={() => handleItemClick('Users')}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{user.title} • {user.roleName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400">{user.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-950 px-4 py-2 text-[11px] text-gray-400">
          <div className="flex items-center gap-1">
            <kbd className="rounded border bg-white dark:bg-gray-900 px-1">↑↓</kbd>
            <span>to navigate</span>
            <kbd className="rounded border bg-white dark:bg-gray-900 px-1 ml-2">Enter</kbd>
            <span>to select</span>
          </div>
          <span>Search or Command Shortcuts</span>
        </div>
      </div>
    </div>
  );
}
