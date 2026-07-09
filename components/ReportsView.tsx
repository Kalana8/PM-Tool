'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Briefcase,
  Users,
  Award,
  ArrowUpRight,
  TrendingDown,
  Calendar,
  Layers,
  FileCheck2
} from 'lucide-react';
import { Department, User, Project, Task } from '../lib/types';

interface ReportsViewProps {
  departments: Department[];
  users: User[];
  projects: Project[];
  tasks: Task[];
}

export default function ReportsView({
  departments,
  users,
  projects,
  tasks
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<'performance' | 'attendance' | 'projects'>('performance');

  // Calculate report metrics
  const webMembers = users.filter((u) => u.departmentId === 'dept-webdev');
  const designMembers = users.filter((u) => u.departmentId === 'dept-uiux');
  const qaMembers = users.filter((u) => u.departmentId === 'dept-qa');
  const marketingMembers = users.filter((u) => u.departmentId === 'dept-marketing');

  const getAvgScore = (members: User[]) => {
    if (members.length === 0) return 0;
    const sum = members.reduce((acc, curr) => acc + curr.performanceScore, 0);
    return Math.round(sum / members.length);
  };

  const performanceReports = [
    { name: 'Web Development SBU', code: 'WEBDEV', score: getAvgScore(webMembers), target: 90, color: 'bg-indigo-500' },
    { name: 'UI/UX Design SBU', code: 'UIUX', score: getAvgScore(designMembers), target: 95, color: 'bg-amber-500' },
    { name: 'QA Testing SBU', code: 'QA', score: getAvgScore(qaMembers), target: 88, color: 'bg-rose-500' },
    { name: 'Digital Marketing SBU', code: 'MKT', score: getAvgScore(marketingMembers), target: 85, color: 'bg-emerald-500' }
  ];

  // Render SVG Performance comparisons
  const renderPerformanceChart = () => {
    const height = 180;
    const width = 500;
    const paddingLeft = 100;
    const paddingRight = 40;
    const paddingTop = 10;
    const paddingBottom = 20;

    const graphHeight = height - paddingTop - paddingBottom;
    const graphWidth = width - paddingLeft - paddingRight;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Horizontal bars */}
        {performanceReports.map((item, idx) => {
          const y = paddingTop + (idx / performanceReports.length) * graphHeight;
          const barWidth = (item.score / 100) * graphWidth;
          const targetX = paddingLeft + (item.target / 100) * graphWidth;

          return (
            <g key={idx} className="group/bar">
              {/* SBU Label */}
              <text
                x={paddingLeft - 12}
                y={y + 14}
                textAnchor="end"
                className="text-[10px] font-bold fill-gray-600 dark:fill-gray-400"
              >
                {item.code}
              </text>

              {/* Bar track */}
              <rect
                x={paddingLeft}
                y={y + 4}
                width={graphWidth}
                height={12}
                rx={3}
                className="fill-gray-100 dark:fill-gray-900"
              />

              {/* Active Bar */}
              <rect
                x={paddingLeft}
                y={y + 4}
                width={barWidth}
                height={12}
                rx={3}
                className={`fill-blue-600 dark:fill-blue-500 transition-all duration-500`}
              />

              {/* Target threshold indicator */}
              <line
                x1={targetX}
                y1={y}
                x2={targetX}
                y2={y + 20}
                stroke="currentColor"
                strokeWidth={1}
                className="text-red-500/80 stroke-dasharray-[2,2]"
              />

              {/* Value Text */}
              <text
                x={paddingLeft + barWidth + 8}
                y={y + 13}
                className="text-[9px] font-mono font-bold fill-gray-900 dark:fill-gray-100"
              >
                {item.score}%
              </text>
            </g>
          );
        })}

        {/* X-Axis labels */}
        {[0, 25, 50, 75, 100].map((val, idx) => {
          const x = paddingLeft + (val / 100) * graphWidth;
          return (
            <text
              key={idx}
              x={x}
              y={height - 2}
              textAnchor="middle"
              className="text-[8px] fill-gray-400 font-mono"
            >
              {val}%
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="reports-main-analytics">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Enterprise Analytics Console
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Review detailed organizational performance metrics, attendance parameters, and project status trackers.
          </p>
        </div>

        {/* Report tab controls */}
        <div className="flex rounded-xl bg-gray-50 dark:bg-gray-900 p-1 border border-gray-100 dark:border-gray-900 text-[10px] font-bold self-start sm:self-auto">
          <button
            id="report-tab-performance"
            onClick={() => setActiveTab('performance')}
            className={`rounded-lg px-3.5 py-1.5 transition-colors ${
              activeTab === 'performance'
                ? 'bg-white dark:bg-gray-950 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            SBU Output
          </button>
          <button
            id="report-tab-attendance"
            onClick={() => setActiveTab('attendance')}
            className={`rounded-lg px-3.5 py-1.5 transition-colors ${
              activeTab === 'attendance'
                ? 'bg-white dark:bg-gray-950 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Presence Audit
          </button>
        </div>
      </div>

      {/* Primary Analytical Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Visual Chart Card */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm md:col-span-2">
          <div className="border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {activeTab === 'performance' ? 'Departmental Performance Indices' : 'Staff Attendance Audits (Sprint Loop)'}
            </h3>
            <p className="text-[10px] text-gray-400">
              {activeTab === 'performance'
                ? 'Calculated average score of SBU direct deliverables.'
                : 'Weekly presence and on-time performance charts.'}
            </p>
          </div>

          <div className="h-56 flex items-center justify-center">
            {activeTab === 'performance' ? (
              renderPerformanceChart()
            ) : (
              /* Attendance SVG column stats */
              <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
                {[0, 25, 50, 75, 100].map((val, idx) => {
                  const y = 10 + (1 - val / 100) * 140;
                  return (
                    <g key={idx} className="opacity-30">
                      <line x1={40} y1={y} x2={480} y2={y} stroke="currentColor" strokeWidth={0.5} className="text-gray-300 dark:text-gray-700" strokeDasharray="4 4" />
                      <text x={30} y={y + 4} textAnchor="end" className="text-[8px] font-mono fill-gray-400">{val}%</text>
                    </g>
                  );
                })}

                {/* Vertical column bars */}
                {[
                  { label: 'Web Dev', pct: 94, color: 'fill-indigo-500' },
                  { label: 'UI/UX', pct: 98, color: 'fill-amber-500' },
                  { label: 'QA Team', pct: 90, color: 'fill-rose-500' },
                  { label: 'Marketing', pct: 88, color: 'fill-emerald-500' }
                ].map((col, idx) => {
                  const x = 70 + idx * 110;
                  const barHeight = (col.pct / 100) * 140;
                  const y = 150 - barHeight;

                  return (
                    <g key={idx}>
                      <rect x={x} y={y} width={34} height={barHeight} rx={4} className={`${col.color} opacity-90`} />
                      <text x={x + 17} y={y - 6} textAnchor="middle" className="text-[9px] font-mono font-bold fill-gray-900 dark:fill-gray-100">{col.pct}%</text>
                      <text x={x + 17} y={166} textAnchor="middle" className="text-[9px] font-bold fill-gray-500">{col.label}</text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Right side stats: Leaders Honor Roll */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm flex flex-col justify-between">
          <div className="border-b border-gray-100 dark:border-gray-900 pb-2.5 mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Performance Honor Roll</h3>
            <p className="text-[10px] text-gray-400">Direct reports showing stellar sprint score velocities.</p>
          </div>

          <div className="space-y-4 flex-1">
            {users.filter(u => u.role === 'Team Member').slice(0, 3).map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                    #{idx + 1}
                  </div>
                  <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">{user.name}</p>
                    <p className="text-[9px] text-gray-400">{user.title}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100/40">
                  {user.performanceScore}%
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-900 pt-3.5 mt-4 text-[10px] text-gray-400 flex items-center gap-1">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Target base score is 85% for organizational sprints.</span>
          </div>
        </div>
      </div>

      {/* Row 2: Comprehensive SBU Table */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
        <div className="border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Department Performance Grid</h3>
          <p className="text-[10px] text-gray-400">Performance ratings and completed project archives by unit.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-500">
            <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-900">
              <tr>
                <th className="py-2.5">Department SBU</th>
                <th className="py-2.5">Code</th>
                <th className="py-2.5 text-center">Headcount</th>
                <th className="py-2.5 text-center">Active Initiatives</th>
                <th className="py-2.5 text-center">Completed Tasks</th>
                <th className="py-2.5 text-right">Avg Performance Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {performanceReports.map((item) => {
                const deptObj = departments.find(d => d.code === item.code);
                const deptUsers = users.filter((u) => u.departmentId === deptObj?.id);
                const deptProjects = projects.filter((p) => p.departmentId === deptObj?.id);
                const deptTasks = tasks.filter((t) => t.departmentId === deptObj?.id);
                const completedCount = deptTasks.filter((t) => t.status === 'Completed').length;

                return (
                  <tr key={item.code} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                    <td className="py-3 font-bold text-gray-900 dark:text-gray-100">{item.name}</td>
                    <td className="py-3 font-mono font-semibold text-gray-400">{item.code}</td>
                    <td className="py-3 text-center font-mono">{deptUsers.length} headcount</td>
                    <td className="py-3 text-center font-mono">{deptProjects.length} projects</td>
                    <td className="py-3 text-center font-mono">{completedCount} vetting</td>
                    <td className="py-3 text-right">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {item.score}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
