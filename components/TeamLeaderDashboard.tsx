'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckSquare,
  Clock,
  ThumbsUp,
  XOctagon,
  MessageSquare,
  Briefcase,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  FileCheck2,
  FileClock,
  ArrowRight
} from 'lucide-react';
import { User, Project, Task, Attendance, TaskSubmission } from '../lib/types';

interface TeamLeaderDashboardProps {
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  attendance: Attendance[];
  onApproveSubmission: (taskId: string, submissionId: string, feedback: string) => void;
  onRejectSubmission: (taskId: string, submissionId: string, feedback: string) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onNavigate: (view: string, id?: string) => void;
}

export default function TeamLeaderDashboard({
  currentUser,
  users,
  projects,
  tasks,
  attendance,
  onApproveSubmission,
  onRejectSubmission,
  onCheckIn,
  onCheckOut,
  onNavigate
}: TeamLeaderDashboardProps) {
  const [reviewingTask, setReviewingTask] = useState<{ taskId: string; submission: TaskSubmission } | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Find the Team Members directly supervised by this leader
  const teamMembers = users.filter((u) => u.teamLeaderId === currentUser.id);
  const teamMemberIds = teamMembers.map((m) => m.id);

  // Projects in this leader's department
  const teamProjects = projects.filter((p) => p.departmentId === currentUser.departmentId);

  // Tasks assigned to team members
  const teamTasks = tasks.filter((t) => teamMemberIds.includes(t.assignedTo));
  const completedTasks = teamTasks.filter((t) => t.status === 'Completed');
  const activeTasks = teamTasks.filter((t) => t.status !== 'Completed');

  // Submissions awaiting approval
  const pendingSubmissions: Array<{ task: Task; submission: TaskSubmission }> = [];
  teamTasks.forEach((t) => {
    t.submissions.forEach((sub) => {
      if (sub.status === 'Pending') {
        pendingSubmissions.push({ task: t, submission: sub });
      }
    });
  });

  // Team attendance today (2026-07-07)
  const todayStr = '2026-07-07';
  const myTodayAttendance = attendance.find((a) => a.userId === currentUser.id && a.date === todayStr);
  const teamAttendanceToday = teamMembers.map((member) => {
    const att = attendance.find((a) => a.userId === member.id && a.date === todayStr);
    return {
      member,
      attendance: att
    };
  });

  const presentCount = teamAttendanceToday.filter((a) => a.attendance !== undefined).length;

  const handleApprove = (taskId: string, subId: string) => {
    onApproveSubmission(taskId, subId, feedbackText || 'Work approved and verified. Outstanding completion!');
    setReviewingTask(null);
    setFeedbackText('');
  };

  const handleRequestRevision = (taskId: string, subId: string) => {
    onRejectSubmission(taskId, subId, feedbackText || 'Please review the accent layouts and submit again.');
    setReviewingTask(null);
    setFeedbackText('');
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="leader-dashboard-container">
      {/* Welcome / Workspace Profile Block */}
      <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-gray-950 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-100/60 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
              Workspace Profile
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
              Leader Hub – {currentUser.departmentId === 'dept-webdev' ? 'Web Engineering' : 'Creative UI/UX'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed max-w-xl">
              Oversee your direct reports, approve daily deliverable packages, and manage department velocity.
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 dark:bg-gray-900/60 p-2 border border-gray-100 dark:border-gray-900 text-[11px] font-semibold text-gray-600 dark:text-gray-300 mt-3 w-fit">
              <Users className="h-4 w-4 text-blue-500" />
              <span>Team Size: {teamMembers.length} headcount</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/80 dark:bg-gray-950/80 rounded-2xl border border-gray-100 dark:border-gray-900 p-4 shadow-sm backdrop-blur-sm self-start md:self-auto">
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Clock Ticker</p>
              <p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 tracking-tight mt-0.5">
                {currentTime}
              </p>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-1.5">
              {myTodayAttendance && (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold border ${
                  myTodayAttendance.checkOutTime
                    ? 'bg-gray-100 text-gray-600 border-gray-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-100 dark:border-emerald-900/30'
                }`}>
                  {myTodayAttendance.checkOutTime ? 'Logged Out' : 'Active Duty'}
                </span>
              )}
              {myTodayAttendance && !myTodayAttendance.checkOutTime && (
                <span className="text-[9px] text-gray-400 font-mono">
                  Checked In: {myTodayAttendance.checkInTime.slice(0, 5)}
                </span>
              )}
              {!myTodayAttendance || myTodayAttendance.checkOutTime ? (
                <button
                  id="signin-btn-banner"
                  onClick={onCheckIn}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-500/10 transition-colors"
                >
                  Sign In
                </button>
              ) : (
                <button
                  id="signout-btn-banner"
                  onClick={onCheckOut}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-rose-500/10 transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leader stats overview */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1 */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900/50 bg-white dark:bg-gray-950 p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today Presence</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {presentCount} / {teamMembers.length}
          </p>
          <span className="text-[10px] text-gray-400">Checked in for today&apos;s iteration.</span>
        </div>

        {/* Stat 2 */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900/50 bg-white dark:bg-gray-950 p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Board Tasks</span>
            <CheckSquare className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {activeTasks.length}
          </p>
          <span className="text-[10px] text-gray-400">{completedTasks.length} milestones archived this week.</span>
        </div>

        {/* Stat 3 */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900/50 bg-white dark:bg-gray-950 p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Review Pipeline</span>
            <FileClock className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {pendingSubmissions.length} Pending
          </p>
          <span className="text-[10px] text-gray-400">Deliverables awaiting leadership review.</span>
        </div>

        {/* Stat 4 */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900/50 bg-white dark:bg-gray-950 p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Department Goals</span>
            <Briefcase className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {teamProjects.length} Initiatives
          </p>
          <span className="text-[10px] text-gray-400">Active portfolios inside your SBU.</span>
        </div>
      </div>

      {/* Row: Approval Queue & Attendance Tracker */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Approval Queue */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Work Approval Queue</h3>
              <p className="text-[10px] text-gray-400">Approve deliverables or request revision iterations.</p>
            </div>
            <span className="rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/25 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
              {pendingSubmissions.length} Action Needed
            </span>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-gray-100 dark:border-gray-900 bg-gray-50/20 dark:bg-gray-950/20">
              <FileCheck2 className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Deliverable backlog empty</p>
              <p className="text-[10px] text-gray-400 mt-1">All task completions have been vetted and archived.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map(({ task, submission }) => {
                const isReviewing = reviewingTask?.submission.id === submission.id;
                return (
                  <div
                    key={submission.id}
                    id={`approval-card-${submission.id}`}
                    className={`rounded-xl border p-4 transition-all duration-200 ${
                      isReviewing
                        ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-950/10 shadow-sm'
                        : 'border-gray-100 dark:border-gray-900 hover:border-gray-200 dark:hover:border-gray-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Task Submission • Due {task.dueDate}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                          {task.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono">{submission.date}</span>
                        <span className="text-[10px] font-semibold text-gray-900 dark:text-gray-200 bg-gray-100 dark:bg-gray-950 px-2 py-0.5 rounded border border-gray-200/50 dark:border-gray-800/60">
                          by {submission.userName}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 border border-gray-100/60 dark:border-gray-900/20">
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">Work Done:</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {submission.workDone}
                      </p>
                      {submission.attachments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200/40 dark:border-gray-900/30 flex items-center gap-1.5 overflow-x-auto">
                          <span className="text-[10px] text-gray-400 font-semibold">Attached:</span>
                          {submission.attachments.map((file) => (
                            <span key={file.id} className="inline-flex items-center gap-1 text-[9px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded border border-blue-100/40 dark:border-blue-900/20">
                              {file.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expand Review Form */}
                    {isReviewing ? (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-900 space-y-3">
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Approval / Revision Notes
                        </label>
                        <textarea
                          id={`feedback-textarea-${submission.id}`}
                          placeholder="Provide supportive feedback or write revision guidelines clearly..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="w-full min-h-[60px] rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`cancel-review-${submission.id}`}
                            onClick={() => {
                              setReviewingTask(null);
                              setFeedbackText('');
                            }}
                            className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 px-3.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-150 dark:border-gray-850"
                          >
                            Cancel
                          </button>
                          <button
                            id={`request-revision-btn-${submission.id}`}
                            onClick={() => handleRequestRevision(task.id, submission.id)}
                            className="flex items-center gap-1 rounded-xl bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 text-amber-700 dark:text-amber-400 px-3.5 py-1.5 text-xs font-bold border border-amber-200 dark:border-amber-900/30 transition-colors"
                          >
                            <XOctagon className="h-3.5 w-3.5" />
                            Request Revision
                          </button>
                          <button
                            id={`approve-btn-${submission.id}`}
                            onClick={() => handleApprove(task.id, submission.id)}
                            className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-md shadow-emerald-500/10 transition-colors"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            Approve work
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end mt-3">
                        <button
                          id={`review-btn-${submission.id}`}
                          onClick={() => setReviewingTask({ taskId: task.id, submission })}
                          className="flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors"
                        >
                          Review & Act <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Attendance Card */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Team Active Attendance</h3>
              <p className="text-[10px] text-gray-400">Daily check-in logs for direct reports.</p>
            </div>
            <span className="text-[10px] font-semibold text-gray-500">
              Present Today: {presentCount}/{teamMembers.length}
            </span>
          </div>

          <div className="space-y-3.5">
            {teamAttendanceToday.map(({ member, attendance }) => {
              return (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">
                        {member.name}
                      </p>
                      <p className="text-[9px] text-gray-400">{member.title}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {attendance ? (
                      <>
                        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold border ${
                          attendance.status === 'Late'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-100 dark:border-amber-900/20'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-100 dark:border-emerald-900/20'
                        }`}>
                          {attendance.status}
                        </span>
                        <p className="text-[8px] text-gray-400 mt-0.5 font-mono">In {attendance.checkInTime.slice(0, 5)}</p>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex rounded-full bg-gray-50 dark:bg-gray-900 text-gray-400 border border-gray-150 dark:border-gray-850 px-1.5 py-0.5 text-[8px] font-bold">
                          Not Checked In
                        </span>
                        <p className="text-[8px] text-gray-400 mt-0.5 font-mono">-</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row: Active Initiatives progress */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Initiatives Under SBU</h3>
            <p className="text-[10px] text-gray-400">Direct active project track.</p>
          </div>
          <button
            id="nav-projects-btn"
            onClick={() => onNavigate('Projects')}
            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            All Initiatives
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {teamProjects.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-100 dark:border-gray-900 bg-gray-50/20 dark:bg-gray-900/10 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">PORTFOLIO</span>
                <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold border ${
                  p.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-100' :
                  p.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-100' :
                  'bg-gray-50 dark:bg-gray-900 text-gray-500 border-gray-100'
                }`}>
                  {p.status}
                </span>
              </div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-2 truncate">
                {p.name}
              </h4>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                {p.description}
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-[9px] text-gray-400 mb-1">
                  <span>Development Progress</span>
                  <span className="font-mono">{p.progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p.progress}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-900/60">
                <span className="text-[9px] text-gray-400">Due {p.deadline}</span>
                <button
                  id={`go-proj-detail-${p.id}`}
                  onClick={() => onNavigate('Projects', p.id)}
                  className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 hover:underline"
                >
                  Manage Portfolio <ExternalLink className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
