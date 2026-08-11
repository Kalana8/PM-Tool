'use client';

import React, { useState } from 'react';
import {
  Users,
  Clock,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  FolderDot,
  Calendar,
  ArrowUpRight,
  UserCheck,
  AlertTriangle,
  History,
  Activity
} from 'lucide-react';
import { User, Project, Task, Attendance, Department } from '../lib/types';
import { todayISODate } from '../lib/date';

interface AdminDashboardProps {
  users: User[];
  projects: Project[];
  tasks: Task[];
  attendance: Attendance[];
  departments: Department[];
  pendingUserCount?: number;
  onNavigate: (view: string, id?: string) => void;
}

export default function AdminDashboard({
  users,
  projects,
  tasks,
  attendance,
  departments,
  pendingUserCount = 0,
  onNavigate
}: AdminDashboardProps) {
  const [selectedChartTab, setSelectedChartTab] = useState<'attendance' | 'tasks'>('attendance');

  // Basic stats calculators
  const totalEmployees = users.filter(u => u.baseLevel === 'team_member').length;
  const activeLeaders = users.filter(u => u.baseLevel === 'team_leader').length;
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
  const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Attendance stats for today
  const todayStr = todayISODate();
  const checkedInToday = attendance.filter(a => a.date === todayStr);
  const presentCount = checkedInToday.length;
  const lateCount = checkedInToday.filter(a => a.status === 'Late').length;
  const attendancePercentage = totalEmployees ? Math.round((presentCount / totalEmployees) * 100) : 0;

  // Custom Chart Data: Weekly Attendance Breakdown (July 1 - July 7)
  const chartData = [
    { label: 'Mon 07/01', present: 5, target: 5, tasks: 4 },
    { label: 'Tue 07/02', present: 4, target: 5, tasks: 6 },
    { label: 'Wed 07/03', present: 5, target: 5, tasks: 5 },
    { label: 'Thu 07/04', present: 5, target: 5, tasks: 8 },
    { label: 'Fri 07/05', present: 3, target: 5, tasks: 9 },
    { label: 'Mon 07/06', present: 4, target: 5, tasks: 7 },
    { label: 'Tue 07/07', present: presentCount, target: 5, tasks: completedTasks }
  ];

  const maxVal = selectedChartTab === 'attendance' ? 6 : 10;

  // Custom SVG Chart helper
  const renderSVGChart = () => {
    const height = 180;
    const width = 500;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 10;
    const paddingBottom = 25;

    const graphHeight = height - paddingTop - paddingBottom;
    const graphWidth = width - paddingLeft - paddingRight;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + graphHeight * (1 - ratio);
          const val = Math.round(ratio * maxVal);
          return (
            <g key={idx} className="opacity-40 dark:opacity-20">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeWidth={0.5}
                className="text-gray-200 dark:text-gray-800"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[9px] fill-gray-400 font-mono"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bar & Lines */}
        {chartData.map((data, idx) => {
          const x = paddingLeft + (idx / (chartData.length - 1)) * graphWidth;
          const val = selectedChartTab === 'attendance' ? data.present : data.tasks;
          const barHeight = (val / maxVal) * graphHeight;
          const y = paddingTop + graphHeight - barHeight;

          // Target line coordinates for attendance
          const targetY = paddingTop + graphHeight - (data.target / maxVal) * graphHeight;

          return (
            <g key={idx} className="group/chart">
              {/* Tooltip background trigger */}
              <rect
                x={x - 20}
                y={paddingTop}
                width={40}
                height={graphHeight}
                fill="transparent"
                className="hover:fill-gray-500/5 cursor-pointer"
              />

              {/* Dynamic Bars for Attendance */}
              {selectedChartTab === 'attendance' ? (
                <rect
                  x={x - 8}
                  y={y}
                  width={16}
                  height={Math.max(barHeight, 2)}
                  rx={3}
                  className="fill-blue-500 dark:fill-blue-600 transition-all duration-300"
                />
              ) : (
                /* Dynamic Polyline and Dot for Tasks */
                <>
                  <circle
                    cx={x}
                    cy={y}
                    r={5}
                    className="fill-emerald-500 stroke-white dark:stroke-gray-950 stroke-2 transition-all duration-300"
                  />
                  {idx > 0 && (
                    <line
                      x1={paddingLeft + ((idx - 1) / (chartData.length - 1)) * graphWidth}
                      y1={paddingTop + graphHeight - (chartData[idx - 1].tasks / maxVal) * graphHeight}
                      x2={x}
                      y2={y}
                      stroke="currentColor"
                      strokeWidth={2}
                      className="text-emerald-500"
                    />
                  )}
                </>
              )}

              {/* X-Axis labels */}
              <text
                x={x}
                y={height - 5}
                textAnchor="middle"
                className="text-[9px] fill-gray-400 dark:fill-gray-500 font-medium"
              >
                {data.label.split(' ')[0]}
              </text>

              {/* Tooltip Hover Value */}
              <g className="opacity-0 group-hover/chart:opacity-100 transition-opacity duration-150">
                <rect
                  x={x - 24}
                  y={y - 22}
                  width={48}
                  height={16}
                  rx={4}
                  fill="currentColor"
                  className="text-gray-950 dark:text-gray-100"
                />
                <text
                  x={x}
                  y={y - 11}
                  textAnchor="middle"
                  className="text-[9px] fill-white dark:fill-gray-900 font-bold"
                >
                  {val} {selectedChartTab === 'attendance' ? 'Pres.' : 'Tasks'}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="admin-dashboard-container">
      {/* Title block */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Operations Console
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time corporate analytics, active departments, and system-wide task statistics.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 p-1.5 border border-gray-100 dark:border-gray-900 self-start md:self-auto">
          <Calendar className="h-4 w-4 text-gray-400 ml-1.5" />
          <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 pr-2">
            Today: Tuesday, July 7, 2026
          </span>
        </div>
      </div>

      {/* Pending Approvals banner */}
      {pendingUserCount > 0 && (
        <button
          id="pending-approvals-banner"
          onClick={() => onNavigate('Users')}
          className="w-full flex items-center justify-between rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-5 py-3.5 text-left hover:bg-amber-100/60 dark:hover:bg-amber-950/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {pendingUserCount} pending approval{pendingUserCount === 1 ? '' : 's'}
            </span>
            <span className="text-[11px] text-amber-600/80 dark:text-amber-500/70">
              New signups need a role and department assigned.
            </span>
          </div>
          <ArrowUpRight className="h-4 w-4 text-amber-600" />
        </button>
      )}

      {/* Grid: Main KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="relative rounded-2xl border border-gray-100 dark:border-gray-900/50 bg-white dark:bg-gray-950 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Staff Presence
            </span>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-2 text-blue-600 dark:text-blue-400">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {presentCount}/{totalEmployees}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
              {attendancePercentage}% Active
            </span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
            {lateCount} late check-ins recorded today.
          </p>
        </div>

        {/* KPI 2 */}
        <div className="relative rounded-2xl border border-gray-100 dark:border-gray-900/50 bg-white dark:bg-gray-950 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Total Portfolios
            </span>
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-2 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalProjects}
            </span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/30">
              {activeProjects} In Progress
            </span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
            {completedProjects} projects achieved archive success.
          </p>
        </div>

        {/* KPI 3 */}
        <div className="relative rounded-2xl border border-gray-100 dark:border-gray-900/50 bg-white dark:bg-gray-950 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Task Completion
            </span>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {taskCompletionRate}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
              {completedTasks}/{totalTasks} Done
            </span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
            {pendingTasks} remaining tasks in progress.
          </p>
        </div>

        {/* KPI 4 */}
        <div className="relative rounded-2xl border border-gray-100 dark:border-gray-900/50 bg-white dark:bg-gray-950 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Operations Lead
            </span>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-2 text-amber-600 dark:text-amber-400">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {activeLeaders} Leads
            </span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30">
              Active
            </span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
            Distributed over {departments.length} departments.
          </p>
        </div>
      </div>

      {/* Row: Interactive Custom Analytics Chart & Department Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Card */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-900 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Enterprise Tickers</h3>
              <p className="text-[11px] text-gray-400">Interactive trends showing daily staff counts and task velocities.</p>
            </div>
            <div className="flex rounded-xl bg-gray-50 dark:bg-gray-900 p-1 border border-gray-100 dark:border-gray-900 text-[10px] font-semibold">
              <button
                id="chart-tab-attendance"
                onClick={() => setSelectedChartTab('attendance')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  selectedChartTab === 'attendance'
                    ? 'bg-white dark:bg-gray-950 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Attendance Analytics
              </button>
              <button
                id="chart-tab-tasks"
                onClick={() => setSelectedChartTab('tasks')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  selectedChartTab === 'tasks'
                    ? 'bg-white dark:bg-gray-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Completed Tasks
              </button>
            </div>
          </div>

          <div className="h-56 flex items-center justify-center">
            {renderSVGChart()}
          </div>
        </div>

        {/* Department Card */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Departments</h3>
              <p className="text-[10px] text-gray-400">Department distribution stats.</p>
            </div>
            <button
              id="view-all-depts-btn"
              onClick={() => onNavigate('Departments')}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              Browse All <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid gap-3">
            {departments.map((dept) => {
              const deptUsers = users.filter(u => u.departmentId === dept.id);
              const deptProjects = projects.filter(p => p.departmentId === dept.id);
              return (
                <div
                  key={dept.id}
                  id={`view-dept-${dept.id}`}
                  onClick={() => onNavigate('Departments')}
                  className="rounded-xl border border-gray-100 dark:border-gray-900 p-3.5 flex items-center justify-between hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`rounded-xl p-2 shrink-0 ${
                      dept.id === 'dept-webdev' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600' :
                      dept.id === 'dept-uiux' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' :
                      dept.id === 'dept-qa' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600' :
                      'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                    }`}>
                      <FolderDot className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{dept.name}</p>
                      <p className="text-[10px] text-gray-400">{deptUsers.length} headcounts • {deptProjects.length} initiatives</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row: Active Initiatives and Immediate Milestones */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Initiatives */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Active Strategic Portfolios</h3>
              <p className="text-[10px] text-gray-400">Initiatives nearing mid-to-high velocity.</p>
            </div>
            <button
              id="view-all-projects-btn"
              onClick={() => onNavigate('Projects')}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Manage Projects
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-500">
              <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-900">
                <tr>
                  <th className="py-2.5">Portfolio Name</th>
                  <th className="py-2.5">Department</th>
                  <th className="py-2.5">Progress</th>
                  <th className="py-2.5">Deadline</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                {projects.slice(0, 3).map((proj) => {
                  const dept = departments.find(d => d.id === proj.departmentId);
                  return (
                    <tr key={proj.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                      <td className="py-3 font-semibold text-gray-900 dark:text-gray-100">{proj.name}</td>
                      <td className="py-3 text-[11px] text-gray-450">{dept?.code}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                              style={{ width: `${proj.progress}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[10px] text-gray-500">{proj.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-gray-400">{proj.deadline}</td>
                      <td className="py-3 text-right">
                        <button
                          id={`view-proj-detail-${proj.id}`}
                          onClick={() => onNavigate('Projects', proj.id)}
                          className="rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-2.5 py-1 text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-100 dark:border-gray-900/60 transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Immediate Milestones & Deadlines */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Critical Milestones</h3>
              <p className="text-[10px] text-gray-400">Deadlines approaching priority bounds.</p>
            </div>
            <button
              id="view-all-tasks-btn"
              onClick={() => onNavigate('Tasks')}
              className="rounded-lg p-1 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').slice(0, 3).map((task) => {
              const assignedUser = users.find(u => u.id === task.assignedTo);
              return (
                <div key={task.id} className="group rounded-xl border border-gray-50 dark:border-gray-900 p-3 hover:border-red-100 dark:hover:border-red-950/20 bg-gray-50/20 dark:bg-gray-900/10 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <span className="rounded bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 text-[8px] font-bold text-red-600 dark:text-red-400 border border-red-100/60 dark:border-red-900/20 uppercase tracking-wider">
                      High Alert
                    </span>
                    <span className="font-mono text-[9px] text-gray-400">{task.dueDate}</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1.5 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {task.name}
                  </h4>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/60 dark:border-gray-900/40 text-[10px] text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <img src={assignedUser?.avatar} alt={assignedUser?.name} className="h-4 w-4 rounded-full object-cover" />
                      <span>{assignedUser?.name}</span>
                    </div>
                    <span>{task.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
