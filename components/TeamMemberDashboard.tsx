'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Briefcase,
  CheckCircle,
  FileText,
  AlertCircle,
  UploadCloud,
  FileCheck,
  Calendar,
  Send,
  Loader2,
  Image as ImageIcon,
  PlaySquare,
  FileSpreadsheet
} from 'lucide-react';
import { User, Project, Task, Attendance, DailyWorkLog, MediaFile } from '../lib/types';

interface TeamMemberDashboardProps {
  currentUser: User;
  projects: Project[];
  tasks: Task[];
  attendance: Attendance[];
  onCheckIn: () => void;
  onCheckOut: () => void;
  onSubmitDailyLog: (log: Omit<DailyWorkLog, 'id' | 'userId' | 'userName' | 'date'>) => void;
  onSubmitTaskWork: (taskId: string, workDone: string, notes: string, attachments: MediaFile[]) => void;
  onNavigate: (view: string, id?: string) => void;
}

export default function TeamMemberDashboard({
  currentUser,
  projects,
  tasks,
  attendance,
  onCheckIn,
  onCheckOut,
  onSubmitDailyLog,
  onSubmitTaskWork,
  onNavigate
}: TeamMemberDashboardProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isSubmitLogOpen, setIsSubmitLogOpen] = useState(false);
  const [tasksDoneText, setTasksDoneText] = useState('');
  const [problemsText, setProblemsText] = useState('');
  const [notesText, setNotesText] = useState('');

  // Simulating uploads
  const [uploadingTask, setUploadingTask] = useState<string | null>(null);
  const [taskWorkText, setTaskWorkText] = useState('');
  const [taskNotesText, setTaskNotesText] = useState('');
  const [simulatedFiles, setSimulatedFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter tasks assigned to current member
  const myTasks = tasks.filter((t) => t.assignedTo === currentUser.id);
  const pendingTasks = myTasks.filter((t) => t.status !== 'Completed');

  // Today's attendance
  const todayStr = '2026-07-07';
  const todayAttendance = attendance.find(
    (a) => a.userId === currentUser.id && a.date === todayStr
  );

  // User's attendance history
  const myAttendanceHistory = attendance.filter((a) => a.userId === currentUser.id).reverse();

  // Handle mock file upload
  const handleMockUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video' | 'document') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsUploading(true);
    setTimeout(() => {
      const newFile: MediaFile = {
        id: `mock-upload-${Date.now()}`,
        name: file.name,
        type: fileType,
        url: fileType === 'video' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : 'https://picsum.photos/seed/upload/800/600',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        extension: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        uploadedBy: currentUser.name,
        dateAdded: todayStr
      };

      setSimulatedFiles((prev) => [...prev, newFile]);
      setIsUploading(false);
    }, 1500);
  };

  const handleDailyLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasksDoneText.trim()) return;

    onSubmitDailyLog({
      tasksDone: tasksDoneText,
      problems: problemsText,
      notes: notesText,
      attachments: simulatedFiles
    });

    setTasksDoneText('');
    setProblemsText('');
    setNotesText('');
    setSimulatedFiles([]);
    setIsSubmitLogOpen(false);
    alert('Daily work log submitted successfully! Captured on supervisor feed.');
  };

  const handleTaskSubmit = (taskId: string) => {
    if (!taskWorkText.trim()) {
      alert('Please state what work has been completed.');
      return;
    }

    onSubmitTaskWork(taskId, taskWorkText, taskNotesText, simulatedFiles);
    setTaskWorkText('');
    setTaskNotesText('');
    setSimulatedFiles([]);
    setUploadingTask(null);
    alert('Task submission sent to your Team Leader review queue.');
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="member-dashboard-container">
      {/* Welcome banner */}
      <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-gray-950 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-100/60 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
              Workspace Profile
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
              Welcome back, {currentUser.name}!
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed max-w-xl">
              You are assigned to the <span className="font-semibold text-gray-800 dark:text-gray-200">Web Development</span> SBU. Review your direct deadlines, log your presence timestamps, and push your daily deliverables.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/80 dark:bg-gray-950/80 rounded-2xl border border-gray-100 dark:border-gray-900 p-4 shadow-sm backdrop-blur-sm self-start md:self-auto">
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Clock Ticker</p>
              <p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 tracking-tight mt-0.5">
                {currentTime}
              </p>
            </div>
            {todayAttendance ? (
              <div className="flex flex-col items-center sm:items-end">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold border ${
                  todayAttendance.checkOutTime
                    ? 'bg-gray-100 text-gray-600 border-gray-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-100 dark:border-emerald-900/30'
                }`}>
                  {todayAttendance.checkOutTime ? 'Logged Out' : 'Active Duty'}
                </span>
                <span className="text-[9px] text-gray-400 mt-1 font-mono">
                  Checked In: {todayAttendance.checkInTime.slice(0, 5)}
                </span>
              </div>
            ) : (
              <button
                id="checkin-btn-banner"
                onClick={onCheckIn}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-500/10 transition-colors"
              >
                In-Check
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row: Attendance Control Card & Daily Assigned Tasks */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attendance Stamp Desk */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm flex flex-col justify-between">
          <div className="border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Attendance Stamper</h3>
            <p className="text-[10px] text-gray-400">Timestamp your clock in and clock out boundaries.</p>
          </div>

          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/10 shadow-inner">
              <Clock className="h-6 w-6" />
            </div>

            {todayAttendance ? (
              todayAttendance.checkOutTime ? (
                <div>
                  <p className="text-xs font-bold text-emerald-600">Timestamp Loop Completed</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Check In: {todayAttendance.checkInTime} | Out: {todayAttendance.checkOutTime}
                  </p>
                  <p className="text-[11px] font-mono font-bold text-gray-800 dark:text-gray-200 mt-2">
                    Duty Hours: {todayAttendance.workingHours?.toFixed(2)} hrs
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-blue-600">In-Duty Timestamp Logged</p>
                  <p className="text-[10px] text-gray-400">Checked in today at {todayAttendance.checkInTime}.</p>
                  <button
                    id="checkout-btn"
                    onClick={onCheckOut}
                    className="w-full rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-700 dark:text-rose-400 py-2.5 text-xs font-bold border border-rose-200 dark:border-rose-900/30 transition-colors"
                  >
                    Log Out-Check
                  </button>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500">Not Checked In Today</p>
                <p className="text-[10px] text-gray-400">Timestamp your shift entrance.</p>
                <button
                  id="checkin-btn"
                  onClick={onCheckIn}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold shadow-md shadow-blue-500/10 transition-colors"
                >
                  Log In-Check
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-900 pt-3 text-[10px] text-gray-400 flex items-center gap-1.5 justify-center">
            <Calendar className="h-3.5 w-3.5" />
            <span>Operational Hours: Mon - Fri (09:00 - 18:00)</span>
          </div>
        </div>

        {/* Assigned tasks */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Direct Assigned Tasks</h3>
              <p className="text-[10px] text-gray-400">Tasks assigned in your current portfolio.</p>
            </div>
            <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              {pendingTasks.length} Active
            </span>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-gray-100 dark:border-gray-900 bg-gray-50/20">
              <CheckCircle className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">All tasks completed!</p>
              <p className="text-[10px] text-gray-400 mt-1">Excellent speed. You are cleared of immediate backlogs.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin">
              {pendingTasks.map((task) => {
                const isSubmitting = uploadingTask === task.id;
                return (
                  <div key={task.id} className="rounded-xl border border-gray-100 dark:border-gray-900 p-4 hover:shadow-sm transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider border ${
                            task.priority === 'High' ? 'bg-red-50 dark:bg-red-950/40 text-red-600 border-red-100' :
                            task.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-100' :
                            'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-100'
                          }`}>
                            {task.priority} Priority
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono">Due: {task.dueDate}</span>
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-1.5">{task.name}</h4>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{task.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-start">
                        {task.submissions.length > 0 && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-100/60">
                            Awaiting Vetting
                          </span>
                        )}
                        <button
                          id={`btn-submit-work-${task.id}`}
                          onClick={() => setUploadingTask(isSubmitting ? null : task.id)}
                          className="rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-600 dark:text-blue-400 px-3 py-1 text-[10px] font-bold border border-blue-100 dark:border-blue-900/30 transition-all"
                        >
                          Submit Work
                        </button>
                      </div>
                    </div>

                    {/* Expand Submit Work Interface */}
                    {isSubmitting && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-900 space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Work Done Statement</label>
                          <textarea
                            id={`textarea-workdone-${task.id}`}
                            placeholder="Explain the results and files built..."
                            value={taskWorkText}
                            onChange={(e) => setTaskWorkText(e.target.value)}
                            className="w-full min-h-[60px] rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* File upload simulator */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Simulate File Uploads</label>
                          <div className="grid grid-cols-3 gap-2">
                            {/* Images */}
                            <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 p-2.5 cursor-pointer transition-colors">
                              <ImageIcon className="h-4.5 w-4.5 text-gray-400" />
                              <span className="text-[9px] font-semibold text-gray-500 mt-1">Image</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMockUpload(e, 'image')} />
                            </label>
                            {/* Videos */}
                            <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 p-2.5 cursor-pointer transition-colors">
                              <PlaySquare className="h-4.5 w-4.5 text-gray-400" />
                              <span className="text-[9px] font-semibold text-gray-500 mt-1">Video</span>
                              <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMockUpload(e, 'video')} />
                            </label>
                            {/* Documents */}
                            <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 p-2.5 cursor-pointer transition-colors">
                              <FileSpreadsheet className="h-4.5 w-4.5 text-gray-400" />
                              <span className="text-[9px] font-semibold text-gray-500 mt-1">Doc</span>
                              <input type="file" accept=".pdf,.doc,.docx,.xlsx" className="hidden" onChange={(e) => handleMockUpload(e, 'document')} />
                            </label>
                          </div>

                          {isUploading && (
                            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-blue-500 font-semibold">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Simulating cloud upload payload...</span>
                            </div>
                          )}

                          {simulatedFiles.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Uploaded Documents:</p>
                              {simulatedFiles.map((f) => (
                                <div key={f.id} className="flex items-center justify-between text-[10px] bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/40 dark:border-blue-900/10 rounded-lg p-1.5 px-2">
                                  <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{f.name}</span>
                                  <span className="font-mono text-gray-400 text-[8px]">{f.size}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-900">
                          <button
                            id={`cancel-task-submit-${task.id}`}
                            onClick={() => {
                              setUploadingTask(null);
                              setSimulatedFiles([]);
                            }}
                            className="rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-3.5 py-1.5 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            id={`btn-push-deliverable-${task.id}`}
                            onClick={() => handleTaskSubmit(task.id)}
                            className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors"
                          >
                            <Send className="h-3 w-3" />
                            Push Deliverable
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row: Submitting Daily Work Log */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Daily Deliverable Report</h3>
            <p className="text-[10px] text-gray-400">Transmit a full summary of today&apos;s accomplishments directly to leader feeds.</p>
          </div>
          <button
            id="toggle-submit-log-btn"
            onClick={() => setIsSubmitLogOpen(!isSubmitLogOpen)}
            className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-bold border border-gray-150"
          >
            {isSubmitLogOpen ? 'Hide Form' : 'Generate Report'}
          </button>
        </div>

        {isSubmitLogOpen && (
          <form onSubmit={handleDailyLogSubmit} className="space-y-4 animate-fadeIn">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Today accomplishments</label>
                <textarea
                  id="worklog-done-input"
                  required
                  placeholder="List today\'s milestones and tasks finalized..."
                  value={tasksDoneText}
                  onChange={(e) => setTasksDoneText(e.target.value)}
                  className="w-full min-h-[100px] rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-3 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Blockers / Complications (Optional)</label>
                  <input
                    id="worklog-problems-input"
                    type="text"
                    placeholder="E.g. API delays, environment configuration issues..."
                    value={problemsText}
                    onChange={(e) => setProblemsText(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-3 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Ancillary Notes (Optional)</label>
                  <input
                    id="worklog-notes-input"
                    type="text"
                    placeholder="E.g. plan for tomorrow, testing schedule..."
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-3 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="submit-worklog-btn"
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-blue-500/15"
              >
                <Send className="h-4 w-4" />
                Submit Daily Work Log
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Row: Attendance History */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
        <div className="border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">My Attendance History</h3>
          <p className="text-[10px] text-gray-400">Your documented attendance and work hour bounds.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {myAttendanceHistory.map((h) => (
            <div key={h.id} className="rounded-xl border border-gray-150 dark:border-gray-850 p-3 bg-gray-50/20">
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                <span className="font-mono">{h.date}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold border ${
                  h.status === 'Late' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {h.status}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Check In: <span className="font-mono text-[11px] font-normal">{h.checkInTime}</span>
                </p>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Check Out: <span className="font-mono text-[11px] font-normal">{h.checkOutTime || 'Active'}</span>
                </p>
                {h.workingHours && (
                  <p className="text-[10px] text-gray-400 mt-2 font-mono pt-1.5 border-t border-gray-100/60">
                    Duration: {h.workingHours.toFixed(2)} hrs
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
