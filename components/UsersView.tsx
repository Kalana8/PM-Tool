'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  KeyRound,
  Edit2,
  Trash,
  X,
  Phone,
  Mail,
  FolderLock
} from 'lucide-react';
import { User, Department, UserRole } from '../lib/types';

interface UsersViewProps {
  users: User[];
  departments: Department[];
  userRole: 'Admin' | 'Team Leader' | 'Team Member';
  currentUserId?: string;
  onAddUser: (user: Omit<User, 'id' | 'performanceScore'>) => void;
  onToggleUserStatus: (userId: string) => void;
  onResetPassword: (userId: string) => void;
}

export default function UsersView({
  users,
  departments,
  userRole,
  currentUserId,
  onAddUser,
  onToggleUserStatus,
  onResetPassword
}: UsersViewProps) {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Team Member');
  const [departmentId, setDepartmentId] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [teamLeaderId, setTeamLeaderId] = useState('');

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !departmentId || !title.trim()) return;

    onAddUser({
      name,
      email,
      role,
      departmentId,
      status: 'Active',
      avatar: `https://picsum.photos/seed/${name.replace(' ', '')}/100/100`,
      title,
      phone,
      // Optional: a Team Member can be assigned a supervising Team Leader, or left unassigned
      teamLeaderId: role === 'Team Member' && teamLeaderId ? teamLeaderId : undefined
    });

    // Reset fields
    setName('');
    setEmail('');
    setTitle('');
    setPhone('');
    setTeamLeaderId('');
    setIsAddUserOpen(false);
  };

  // Scope the personnel directory by who is viewing it:
  // - Admin sees every Team Leader and Team Member in the org.
  // - A Team Leader sees only the Team Members assigned under them.
  // - A Team Member sees only the Team Leader supervising them.
  const scopedUsers =
    userRole === 'Team Leader' && currentUserId
      ? users.filter((u) => u.teamLeaderId === currentUserId)
      : userRole === 'Team Member' && currentUserId
      ? users.filter((u) => u.id === users.find((me) => me.id === currentUserId)?.teamLeaderId)
      : users;

  const teamLeaderOptions = users.filter(
    (u) => u.role === 'Team Leader' && (!departmentId || u.departmentId === departmentId)
  );

  const directoryTitle =
    userRole === 'Team Leader' ? 'My Team' : userRole === 'Team Member' ? 'My Team Leader' : 'Personnel Directory';
  const directorySubtitle =
    userRole === 'Team Leader'
      ? 'Team Members currently assigned under your supervision.'
      : userRole === 'Team Member'
      ? 'The Team Leader supervising your work.'
      : 'Create, configure, and monitor all organizational Team Leaders and Team Member accounts.';

  const filteredUsers = scopedUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.title.toLowerCase().includes(query.toLowerCase())
  );

  // Team Members cannot add employees; Team Leaders may only add Team Members onto their own team.
  const canAddEmployee = userRole === 'Admin' || userRole === 'Team Leader';
  const currentUserRecord = users.find((u) => u.id === currentUserId);

  const handleOpenAdd = () => {
    if (userRole === 'Team Leader') {
      setRole('Team Member');
      setDepartmentId(currentUserRecord?.departmentId || '');
      setTeamLeaderId(currentUserId || '');
    }
    setIsAddUserOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="users-view-panel">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {directoryTitle}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {directorySubtitle}
          </p>
        </div>

        {canAddEmployee && (
        <button
          id="open-add-user-btn"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-500/10 self-start sm:self-auto"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Add Employee
        </button>
        )}
      </div>

      {/* Directory controls */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              id="user-search-input"
              type="text"
              placeholder="Search personnel directory by name, email, or role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Directory table */}
        <div className="overflow-x-auto" id="personnel-table-view">
          <table className="w-full text-left text-xs text-gray-500">
            <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-900">
              <tr>
                <th className="py-2.5">Staff Employee</th>
                <th className="py-2.5">Business SBU</th>
                <th className="py-2.5">Title & Role</th>
                <th className="py-2.5">Reports To</th>
                <th className="py-2.5">Contact parameters</th>
                <th className="py-2.5 text-center">Status</th>
                <th className="py-2.5 text-right">Account Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {filteredUsers.map((u) => {
                const dept = departments.find((d) => d.id === u.departmentId);
                const supervisor = users.find((s) => s.id === u.teamLeaderId);
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                    {/* User profile details */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt={u.name} className="h-9 w-9 rounded-full object-cover border border-gray-100/60" />
                        <div>
                          <p className="font-bold text-gray-950 dark:text-gray-100 leading-tight">{u.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">UID: {u.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* SBU */}
                    <td className="py-3.5">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{dept?.name}</span>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{dept?.code}</p>
                    </td>

                    {/* Title and role */}
                    <td className="py-3.5">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{u.title}</p>
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-0.5 block">
                        {u.role}
                      </span>
                    </td>

                    {/* Reports To */}
                    <td className="py-3.5">
                      {supervisor ? (
                        <div className="flex items-center gap-1.5">
                          <img src={supervisor.avatar} alt={supervisor.name} className="h-5 w-5 rounded-full object-cover" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">{supervisor.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-700 font-mono text-[10px]">Unassigned</span>
                      )}
                    </td>

                    {/* Contacts */}
                    <td className="py-3.5 text-gray-400 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="font-mono">{u.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 text-center">
                      <button
                        id={`toggle-status-btn-${u.id}`}
                        onClick={() => onToggleUserStatus(u.id)}
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-colors ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/60'
                            : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100/60'
                        }`}
                        title="Click to toggle status"
                      >
                        {u.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`pwd-reset-btn-${u.id}`}
                          onClick={() => onResetPassword(u.id)}
                          className="rounded-lg p-1.5 border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset employee password link"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-sans">
                    No employees matched your search term.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Drawer Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white dark:bg-gray-950 p-6 shadow-2xl border-l border-gray-150 dark:border-gray-850 flex flex-col justify-between">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Add Staff Employee</h3>
                  <p className="text-[10px] text-gray-400">Introduce a new personnel account with departmental permissions.</p>
                </div>
                <button
                  id="close-add-user"
                  onClick={() => setIsAddUserOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-650"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form id="add-user-form" onSubmit={handleAddUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    id="user-name-input"
                    type="text"
                    required
                    placeholder="E.g. Dr. Robert Ford..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Coordinates</label>
                  <input
                    id="user-email-input"
                    type="email"
                    required
                    placeholder="E.g. robert@enterprise.com..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold font-semibold">Security Role</label>
                    <select
                      id="user-role-select"
                      value={role}
                      disabled={userRole === 'Team Leader'}
                      onChange={(e) => {
                        const nextRole = e.target.value as UserRole;
                        setRole(nextRole);
                        if (nextRole !== 'Team Member') setTeamLeaderId('');
                      }}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="Team Member">Team Member</option>
                      <option value="Team Leader">Team Leader</option>
                    </select>
                    {userRole === 'Team Leader' && (
                      <p className="text-[9px] text-gray-400 mt-1">Team Leaders may only add Team Members.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold font-semibold">Department SBU</label>
                    <select
                      id="user-department-select"
                      required
                      value={departmentId}
                      disabled={userRole === 'Team Leader'}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">Select SBU</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {role === 'Team Member' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                      Supervising Team Leader (Optional)
                    </label>
                    <select
                      id="user-teamleader-select"
                      value={teamLeaderId}
                      disabled={userRole === 'Team Leader'}
                      onChange={(e) => setTeamLeaderId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">No Team Leader (Unassigned)</option>
                      {teamLeaderOptions.map((tl) => (
                        <option key={tl.id} value={tl.id}>{tl.name} ({tl.title})</option>
                      ))}
                    </select>
                    {userRole === 'Team Leader' && (
                      <p className="text-[9px] text-gray-400 mt-1">Assigned to you automatically.</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">Designated Title</label>
                  <input
                    id="user-title-input"
                    type="text"
                    required
                    placeholder="E.g. Senior Backend Architect..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Direct Phone Contact (Optional)</label>
                  <input
                    id="user-phone-input"
                    type="text"
                    placeholder="E.g. +1 (555) 019-2231..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-900 pt-4">
              <button
                id="cancel-create-user-btn"
                onClick={() => setIsAddUserOpen(false)}
                className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
              <button
                id="submit-create-user-btn"
                onClick={handleAddUserSubmit}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-blue-500/10"
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
