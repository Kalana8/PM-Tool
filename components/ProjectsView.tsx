'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  FileText,
  Video,
  Image as ImageIcon,
  MessageSquare,
  TrendingUp,
  Plus,
  Send,
  ExternalLink,
  ChevronRight,
  FolderDot,
  FileSpreadsheet,
  X,
  Play
} from 'lucide-react';
import { Project, User, Task, TaskCategory, MediaFile, TaskComment, RoleBaseLevel } from '../lib/types';
import { hasAction } from '../lib/permissions';

const PROJECT_STATUS_OPTIONS: Project['status'][] = ['Planning', 'In Progress', 'In Review', 'Completed'];

interface ProjectsViewProps {
  projects: Project[];
  users: User[];
  tasks: Task[];
  media: MediaFile[];
  selectedProjectId: string | null;
  userRole: RoleBaseLevel;
  currentUser: User;
  onProjectSelect: (id: string | null) => void;
  onAddComment: (projectId: string, text: string) => void;
  onUpdateProjectStatus: (projectId: string, status: Project['status']) => void;
  onUpdateProjectAssignee: (projectId: string, assigneeId: string | undefined) => void;
  onNavigate: (view: string, id?: string) => void;
}

type ProjectTab = 'overview' | 'tasks' | 'media' | 'comments';

export default function ProjectsView({
  projects,
  users,
  tasks,
  media,
  selectedProjectId,
  userRole,
  currentUser,
  onProjectSelect,
  onAddComment,
  onUpdateProjectStatus,
  onUpdateProjectAssignee,
  onNavigate
}: ProjectsViewProps) {
  const canEditStatus = hasAction(currentUser, 'projects.manage');
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');
  const [activeTaskCategory, setActiveTaskCategory] = useState<TaskCategory>('daily');
  const [commentInput, setCommentInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<MediaFile | null>(null);
  const [activeVideo, setActiveVideo] = useState<MediaFile | null>(null);

  // Filter projects by current selection
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedProjectId) return;
    onAddComment(selectedProjectId, commentInput.trim());
    setCommentInput('');
  };

  const getMediaIcon = (ext: string) => {
    switch (ext) {
      case 'PDF':
        return <FileText className="h-4.5 w-4.5 text-red-500" />;
      case 'DOCX':
        return <FileSpreadsheet className="h-4.5 w-4.5 text-blue-500" />;
      case 'MP4':
        return <Video className="h-4.5 w-4.5 text-indigo-500" />;
      default:
        return <ImageIcon className="h-4.5 w-4.5 text-emerald-500" />;
    }
  };

  // Portfolio Dashboard (when no project is selected)
  if (!selectedProjectId || !currentProject) {
    return (
      <div className="space-y-6 animate-fadeIn" id="projects-portfolio-container">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Enterprise Initiatives Portfolio
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Browse and manage all active, scheduled, and archived cross-departmental programs.
          </p>
        </div>

        {/* Grid of Projects */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => {
            const lead = users.find((u) => u.id === proj.leaderId);
            const team = users.filter((u) => proj.members.includes(u.id));
            const projTasks = tasks.filter((t) => t.projectId === proj.id);
            const doneTasks = projTasks.filter((t) => t.status === 'Completed').length;
            const assigneeOptions = users.filter(
              (u) => u.departmentId === proj.departmentId && (u.baseLevel === 'team_leader' || u.baseLevel === 'team_member')
            );

            return (
              <div
                key={proj.id}
                id={`project-card-${proj.id}`}
                onClick={() => onProjectSelect(proj.id)}
                className="group rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-5 shadow-sm hover:border-blue-200 dark:hover:border-blue-950/45 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      id={`project-status-select-${proj.id}`}
                      value={proj.status}
                      disabled={!canEditStatus}
                      onChange={(e) => onUpdateProjectStatus(proj.id, e.target.value as Project['status'])}
                      className={`rounded-xl px-2 py-0.5 text-[9px] font-bold border outline-none cursor-pointer disabled:cursor-not-allowed ${
                        proj.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        proj.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        proj.status === 'In Review' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-gray-50 text-gray-500 border-gray-150'
                      }`}
                    >
                      {PROJECT_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-gray-400 font-mono">Due {proj.deadline}</span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-3 leading-relaxed">
                    {proj.description}
                  </p>

                  {lead && (
                    <div className="flex items-center gap-1.5 mt-3">
                      <img src={lead.avatar} alt={lead.name} className="h-4.5 w-4.5 rounded-full object-cover" />
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        Owner: <span className="font-semibold text-gray-700 dark:text-gray-300">{lead.name}</span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">Assignee:</span>
                    <select
                      id={`project-assignee-select-${proj.id}`}
                      value={proj.assigneeId || ''}
                      disabled={!canEditStatus}
                      onChange={(e) => onUpdateProjectAssignee(proj.id, e.target.value || undefined)}
                      className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Unassigned</option>
                      {assigneeOptions.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Footer details */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-900">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                    <span>Task Velocity</span>
                    <span>{doneTasks}/{projTasks.length} Done</span>
                  </div>

                  <div className="h-1.5 w-full bg-gray-150 dark:bg-gray-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${proj.progress}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center -space-x-1.5">
                      {team.slice(0, 3).map((member) => (
                        <img
                          key={member.id}
                          src={member.avatar}
                          alt={member.name}
                          className="h-5 w-5 rounded-full object-cover border border-white"
                          title={member.name}
                        />
                      ))}
                      {team.length > 3 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 border border-white text-[8px] font-bold text-gray-500">
                          +{team.length - 3}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                      Enter Portfolio <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Project Detail Page
  const leadUser = users.find((u) => u.id === currentProject.leaderId);
  const teamUsers = users.filter((u) => currentProject.members.includes(u.id));
  const detailAssigneeOptions = users.filter(
    (u) => u.departmentId === currentProject.departmentId && (u.baseLevel === 'team_leader' || u.baseLevel === 'team_member')
  );
  const projectTasks = tasks.filter((t) => t.projectId === currentProject.id);
  const projectMedia = media.filter((m) => m.projectId === currentProject.id);

  // Extract media subtypes
  const docFiles = projectMedia.filter((m) => m.type === 'document');
  const imgFiles = projectMedia.filter((m) => m.type === 'image');
  const vidFiles = projectMedia.filter((m) => m.type === 'video');

  const tabs: Array<{ id: ProjectTab; label: string }> = [
    { id: 'overview', label: 'Overview & Milestones' },
    { id: 'tasks', label: 'Tasks List' },
    { id: 'media', label: 'Media Bento Library' },
    { id: 'comments', label: 'Feed & Remarks' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn" id="project-detail-main">
      {/* Back button */}
      <button
        id="back-to-portfolio"
        onClick={() => onProjectSelect(null)}
        className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
      >
        <FolderDot className="h-4 w-4" /> Back to Initiatives
      </button>

      {/* Hero Header block */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <select
                id={`project-detail-status-select-${currentProject.id}`}
                value={currentProject.status}
                disabled={!canEditStatus}
                onChange={(e) => onUpdateProjectStatus(currentProject.id, e.target.value as Project['status'])}
                className={`rounded-xl px-2.5 py-0.5 text-[10px] font-bold border outline-none cursor-pointer disabled:cursor-not-allowed ${
                  currentProject.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  currentProject.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  currentProject.status === 'In Review' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-gray-50 text-gray-500 border-gray-150'
                }`}
              >
                {PROJECT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Due {currentProject.deadline}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{currentProject.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">{currentProject.description}</p>
          </div>

          <div className="flex flex-col gap-3 self-start md:self-auto">
            <div className="flex items-center gap-4 border border-gray-50 dark:border-gray-900 bg-gray-50/20 dark:bg-gray-900/10 rounded-2xl p-4 min-w-[200px]">
              <img src={leadUser?.avatar} alt={leadUser?.name} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PROJECT OWNER</p>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-150">{leadUser?.name}</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400">{leadUser?.title}</p>
              </div>
            </div>

            <div className="border border-gray-50 dark:border-gray-900 bg-gray-50/20 dark:bg-gray-900/10 rounded-2xl p-4 min-w-[200px]">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">ASSIGNEE</p>
              <select
                id={`project-detail-assignee-select-${currentProject.id}`}
                value={currentProject.assigneeId || ''}
                disabled={!canEditStatus}
                onChange={(e) => onUpdateProjectAssignee(currentProject.id, e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Unassigned</option>
                {detailAssigneeOptions.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Project detail tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-900 mt-8 overflow-x-auto text-xs font-semibold">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`project-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 border-b-2 transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left panels */}
            <div className="md:col-span-2 space-y-6">
              {/* Milestone list */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-900 pb-2.5 mb-4">
                  Project Milestones
                </h3>
                <div className="space-y-4">
                  {currentProject.notes.map((note, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity feed list */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-900 pb-2.5 mb-4">
                  Recent Portfolio Activities
                </h3>
                <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-900">
                  <div className="relative flex gap-4 items-start pl-8">
                    <span className="absolute left-2.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Payment endpoint fully refactored</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">David Kim completed code push • 2 hours ago</p>
                    </div>
                  </div>
                  <div className="relative flex gap-4 items-start pl-8">
                    <span className="absolute left-2.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Atlas system tokens published</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Liam O&apos;Connor uploaded Brand PDF document • 1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Project Stats / Team */}
            <div className="space-y-6">
              {/* Radial Progress widget */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm text-center">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Completion Progress
                </h3>

                <div className="relative flex items-center justify-center my-6">
                  {/* SVG Circle Progress */}
                  <svg className="h-32 w-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="54" strokeWidth="8" stroke="currentColor" className="text-gray-100 dark:text-gray-900" fill="transparent" />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      strokeWidth="8"
                      stroke="currentColor"
                      className="text-blue-600 dark:text-blue-500"
                      fill="transparent"
                      strokeDasharray="339.292"
                      strokeDashoffset={339.292 - (339.292 * currentProject.progress) / 100}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">
                      {currentProject.progress}%
                    </span>
                    <span className="text-[10px] text-gray-400">Archived Done</span>
                  </div>
                </div>

                <div className="flex justify-around text-[11px] text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-900">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-150">{projectTasks.length}</p>
                    <p className="text-[9px]">Total Tasks</p>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-600">{projectTasks.filter(t => t.status === 'Completed').length}</p>
                    <p className="text-[9px]">Completed</p>
                  </div>
                </div>
              </div>

              {/* Team list */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-900 pb-2 mb-3">
                  Initiative Headcounts
                </h3>
                <div className="space-y-3">
                  {teamUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-2.5">
                      <img src={u.avatar} alt={u.name} className="h-7 w-7 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold text-gray-950 dark:text-gray-150">{u.name}</p>
                        <p className="text-[9px] text-gray-400">{u.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TASKS */}
        {activeTab === 'tasks' && (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-900 pb-3.5 mb-4">
              Project Task Board
            </h3>

            {/* Category Tabs: Daily Tasks vs. Continuous Tasks */}
            <div className="flex border-b border-gray-100 dark:border-gray-900 mb-4">
              <button
                onClick={() => setActiveTaskCategory('daily')}
                className={`px-4 py-2 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTaskCategory === 'daily'
                    ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-250'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Daily Tasks
                <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-full font-mono">
                  {projectTasks.filter(t => t.category === 'daily').length}
                </span>
              </button>
              <button
                onClick={() => setActiveTaskCategory('continuous')}
                className={`px-4 py-2 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTaskCategory === 'continuous'
                    ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-250'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Continuous Tasks
                <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-full font-mono">
                  {projectTasks.filter(t => t.category === 'continuous').length}
                </span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-500">
                <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-900">
                  <tr>
                    <th className="py-2.5">Task Name</th>
                    <th className="py-2.5">Assignee</th>
                    <th className="py-2.5">Priority</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Progress</th>
                    <th className="py-2.5">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                  {projectTasks.filter(t => t.category === activeTaskCategory).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-gray-450">
                        No tasks established for this project.
                      </td>
                    </tr>
                  ) : (
                    projectTasks.filter(t => t.category === activeTaskCategory).map((t) => {
                      const assignee = users.find((u) => u.id === t.assignedTo);
                      return (
                        <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                          <td className="py-3.5 font-semibold text-gray-900 dark:text-gray-100">{t.name}</td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-2">
                              <img src={assignee?.avatar} alt={assignee?.name} className="h-5.5 w-5.5 rounded-full object-cover" />
                              <span className="font-medium text-gray-800 dark:text-gray-200">{assignee?.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                              t.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                              t.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className="rounded bg-gray-50 dark:bg-gray-900 border border-gray-150 px-2 py-0.5 text-[10px] font-semibold">
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-16 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${t.progress}%` }}></div>
                              </div>
                              <span className="font-mono text-[9px] text-gray-500">{t.progress}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 font-mono text-gray-400">{t.dueDate}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA BENTO GALLERY */}
        {activeTab === 'media' && (
          <div className="space-y-8">
            {/* Gallery layouts */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-900 pb-3 mb-6 flex items-center justify-between">
                <span>Media & Artifact Library</span>
                <span className="text-xs text-gray-400 font-normal">{projectMedia.length} files total</span>
              </h3>

              {projectMedia.length === 0 ? (
                <div className="py-16 text-center text-xs text-gray-400">
                  No deliverables uploaded to this media feed.
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {projectMedia.map((file) => {
                    return (
                      <div
                        key={file.id}
                        id={`media-file-card-${file.id}`}
                        className="group relative rounded-2xl border border-gray-150 dark:border-gray-850 bg-white dark:bg-gray-950 overflow-hidden hover:shadow-md transition-all duration-300"
                      >
                        {file.type === 'image' ? (
                          <div
                            className="h-36 bg-gray-50 relative overflow-hidden cursor-pointer"
                            onClick={() => setSelectedImage(file)}
                          >
                            <img src={file.url} alt={file.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        ) : file.type === 'video' ? (
                          <div
                            className="h-36 bg-gray-950 relative overflow-hidden flex items-center justify-center cursor-pointer"
                            onClick={() => setActiveVideo(file)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-1"></div>
                            <div className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md p-3.5 z-2 transition-all">
                              <Play className="h-5 w-5 text-white fill-white" />
                            </div>
                            <video src={file.url} className="h-full w-full object-cover opacity-60" muted playsInline />
                          </div>
                        ) : (
                          <div className="h-36 bg-blue-50/10 dark:bg-gray-900/10 flex items-center justify-center border-b border-gray-100 dark:border-gray-900">
                            <FileText className="h-10 w-10 text-red-400" />
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex items-start gap-2.5">
                            {getMediaIcon(file.extension)}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{file.size} • uploaded by {file.uploadedBy}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-900/60 text-[9px] text-gray-400">
                            <span>Uploaded {file.dateAdded}</span>
                            <a
                              href={file.url}
                              download
                              onClick={(e) => {
                                if (file.type === 'document') {
                                  e.preventDefault();
                                  alert(`Prototype Action: Downloading mock file '${file.name}'`);
                                }
                              }}
                              className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                            >
                              Open File <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LIGHTBOX OVERLAYS */}
            {selectedImage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fadeIn" onClick={() => setSelectedImage(null)}>
                <button className="absolute top-4 right-4 rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 transition-all">
                  <X className="h-5 w-5" />
                </button>
                <div className="relative max-w-4xl max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                  <img src={selectedImage.url} alt={selectedImage.name} className="rounded-xl max-w-full max-h-[80vh] object-contain shadow-2xl" />
                  <div className="absolute bottom-4 inset-x-4 bg-black/60 backdrop-blur-md p-3.5 rounded-xl border border-white/10 text-white text-xs">
                    <p className="font-bold">{selectedImage.name}</p>
                    <p className="text-[10px] text-white/70 mt-1">Uploaded by {selectedImage.uploadedBy} on {selectedImage.dateAdded} • {selectedImage.size}</p>
                  </div>
                </div>
              </div>
            )}

            {activeVideo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fadeIn" onClick={() => setActiveVideo(null)}>
                <button className="absolute top-4 right-4 rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 transition-all">
                  <X className="h-5 w-5" />
                </button>
                <div className="relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
                  <video src={activeVideo.url} controls autoPlay className="w-full h-full" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMMENTS & FEED */}
        {activeTab === 'comments' && (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm max-w-3xl">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
              Collaborative Project Feed
            </h3>

            {/* List existing task comments in mock format */}
            <div className="space-y-4 mb-6 max-h-[280px] overflow-y-auto scrollbar-thin">
              {projectTasks.some(t => t.comments.length > 0) ? (
                projectTasks.flatMap(t => t.comments).map((comm) => (
                  <div key={comm.id} className="flex gap-3 items-start">
                    <img src={comm.userAvatar} alt={comm.userName} className="h-8 w-8 rounded-full object-cover" />
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-3 border border-gray-100/60 dark:border-gray-900/20 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-gray-900 dark:text-gray-100">{comm.userName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{comm.timestamp}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{comm.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  No feed messages posted yet. Be the first to coordinate!
                </div>
              )}
            </div>

            {/* Post comment form */}
            <form onSubmit={handleCommentSubmit} className="flex items-start gap-3 border-t border-gray-100 dark:border-gray-900 pt-4">
              <input
                id="comment-input"
                type="text"
                required
                placeholder="Share coordinates, milestones, or brief summaries with the project team..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                id="submit-comment-btn"
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
