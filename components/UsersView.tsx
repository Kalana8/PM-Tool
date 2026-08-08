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
  Eye,
  X,
  Phone,
  Mail,
  FolderLock,
  UserCheck,
  Clock
} from 'lucide-react';
import { User, Department, UserRole, PendingUser } from '../lib/types';

interface UsersViewProps {
  users: User[];
  departments: Department[];
  userRole: 'Admin' | 'Team Leader' | 'Team Member';
  currentUserId?: string;
  onAddUser: (user: Omit<User, 'id' | 'performanceScore'>) => void;
  onToggleUserStatus: (userId: string) => void;
  pendingUsers?: PendingUser[];
  onCategorizeUser?: (
    pendingUserId: string,
    updates: { role: UserRole; departmentId: string; title: string; teamLeaderId?: string }
  ) => void;
  onDeclineUser?: (pendingUserId: string) => void;
  onEditUser?: (
    userId: string,
    updates: { name: string; title: string; role: UserRole; departmentId: string; teamLeaderId?: string }
  ) => void;
  onSendPasswordReset?: (email: string) => void;
  onAddUserWithPassword?: (user: Omit<User, 'id' | 'performanceScore'>, password: string) => void;
  onDeleteUser?: (userId: string) => void;
}

export default function UsersView({
  users,
  departments,
  userRole,
  currentUserId,
  onAddUser,
  onToggleUserStatus,
  pendingUsers = [],
  onCategorizeUser,
  onDeclineUser,
  onEditUser,
  onSendPasswordReset,
  onAddUserWithPassword,
  onDeleteUser
}: UsersViewProps) {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categorizingId, setCategorizingId] = useState<string | null>(null);
  const [catRole, setCatRole] = useState<UserRole>('Team Member');
  const [catDepartmentId, setCatDepartmentId] = useState('');
  const [catTitle, setCatTitle] = useState('');
  const [catTeamLeaderId, setCatTeamLeaderId] = useState('');

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Team Member');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editTeamLeaderId, setEditTeamLeaderId] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Team Member');
  const [departmentId, setDepartmentId] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [password, setPassword] = useState('');

  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !departmentId || !title.trim()) return;
    if (userRole === 'Admin' && password.length < 6) return;

    const newUser = {
      name,
      email,
      role,
      departmentId,
      status: 'Active' as const,
      avatar: `https://picsum.photos/seed/${name.replace(' ', '')}/100/100`,
      title,
      phone,
      // Optional: a Team Member can be assigned a supervising Team Leader, or left unassigned
      teamLeaderId: role === 'Team Member' && teamLeaderId ? teamLeaderId : undefined
    };

    // Admins set a password up front, which immediately creates a real login for the new
    // employee. Team Leaders keep the existing profile-only flow (no login created yet).
    if (userRole === 'Admin' && onAddUserWithPassword) {
      onAddUserWithPassword(newUser, password);
    } else {
      onAddUser(newUser);
    }

    // Reset fields
    setName('');
    setEmail('');
    setTitle('');
    setPhone('');
    setTeamLeaderId('');
    setPassword('');
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

  const catTeamLeaderOptions = users.filter(
    (u) => u.role === 'Team Leader' && (!catDepartmentId || u.departmentId === catDepartmentId)
  );

  const openCategorize = (pendingUserId: string) => {
    setCategorizingId(pendingUserId);
    setCatRole('Team Member');
    setCatDepartmentId('');
    setCatTitle('');
    setCatTeamLeaderId('');
  };

  const handleCategorizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categorizingId || !catDepartmentId || !catTitle.trim() || !onCategorizeUser) return;

    onCategorizeUser(categorizingId, {
      role: catRole,
      departmentId: catDepartmentId,
      title: catTitle,
      teamLeaderId: catRole === 'Team Member' && catTeamLeaderId ? catTeamLeaderId : undefined
    });
    setCategorizingId(null);
  };

  const editTeamLeaderOptions = users.filter(
    (u) => u.role === 'Team Leader' && u.id !== editingUserId && (!editDepartmentId || u.departmentId === editDepartmentId)
  );

  const openEdit = (targetUser: User) => {
    setEditingUserId(targetUser.id);
    setEditName(targetUser.name);
    setEditTitle(targetUser.title);
    setEditRole(targetUser.role);
    setEditDepartmentId(targetUser.departmentId);
    setEditTeamLeaderId(targetUser.teamLeaderId || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editName.trim() || !editDepartmentId || !editTitle.trim() || !onEditUser) return;

    onEditUser(editingUserId, {
      name: editName,
      title: editTitle,
      role: editRole,
      departmentId: editDepartmentId,
      teamLeaderId: editRole === 'Team Member' && editTeamLeaderId ? editTeamLeaderId : undefined
    });
    setEditingUserId(null);
  };

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

      {/* Pending Approvals: new signups awaiting an Admin to assign their role/department */}
      {userRole === 'Admin' && pendingUsers.length > 0 && (
        <div id="pending-approvals-panel" className="rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Pending Approvals</h3>
            <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5">{pendingUsers.length}</span>
          </div>
          <div className="space-y-2">
            {pendingUsers.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-100/70 dark:border-amber-900/30 bg-white dark:bg-gray-950 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={p.avatar} alt={p.name} className="h-9 w-9 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-950 dark:text-gray-100 text-xs truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{p.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id={`categorize-btn-${p.id}`}
                    onClick={() => openCategorize(p.id)}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-[11px] font-bold"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Categorize
                  </button>
                  <button
                    id={`decline-btn-${p.id}`}
                    onClick={() => onDeclineUser?.(p.id)}
                    className="rounded-lg p-1.5 border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-red-600 transition-colors"
                    title="Decline this signup"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                          id={`view-user-btn-${u.id}`}
                          onClick={() => setViewingUserId(u.id)}
                          className="rounded-lg p-1.5 border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View employee details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {userRole === 'Admin' && (
                          <button
                            id={`edit-user-btn-${u.id}`}
                            onClick={() => openEdit(u)}
                            className="rounded-lg p-1.5 border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit employee account"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {userRole === 'Admin' && (
                          <button
                            id={`delete-user-btn-${u.id}`}
                            onClick={() => {
                              if (window.confirm(`Delete ${u.name}? This permanently removes their profile and login.`)) {
                                onDeleteUser?.(u.id);
                              }
                            }}
                            className="rounded-lg p-1.5 border border-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete employee account"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
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

                {userRole === 'Admin' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Login Password</label>
                    <input
                      id="user-password-input"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-[9px] text-gray-400 mt-1">This creates a real login for the employee immediately.</p>
                  </div>
                )}

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

      {/* Categorize Pending Signup Drawer Modal */}
      {categorizingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white dark:bg-gray-950 p-6 shadow-2xl border-l border-gray-150 dark:border-gray-850 flex flex-col justify-between">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Categorize Account</h3>
                  <p className="text-[10px] text-gray-400">Assign this signup a role, department, and title to grant workspace access.</p>
                </div>
                <button
                  id="close-categorize-btn"
                  onClick={() => setCategorizingId(null)}
                  className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-650"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form id="categorize-form" onSubmit={handleCategorizeSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Security Role</label>
                    <select
                      id="categorize-role-select"
                      value={catRole}
                      onChange={(e) => {
                        const nextRole = e.target.value as UserRole;
                        setCatRole(nextRole);
                        if (nextRole !== 'Team Member') setCatTeamLeaderId('');
                      }}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Team Member">Team Member</option>
                      <option value="Team Leader">Team Leader</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department SBU</label>
                    <select
                      id="categorize-department-select"
                      required
                      value={catDepartmentId}
                      onChange={(e) => setCatDepartmentId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select SBU</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {catRole === 'Team Member' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                      Supervising Team Leader (Optional)
                    </label>
                    <select
                      id="categorize-teamleader-select"
                      value={catTeamLeaderId}
                      onChange={(e) => setCatTeamLeaderId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">No Team Leader (Unassigned)</option>
                      {catTeamLeaderOptions.map((tl) => (
                        <option key={tl.id} value={tl.id}>{tl.name} ({tl.title})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">Designated Title</label>
                  <input
                    id="categorize-title-input"
                    type="text"
                    required
                    placeholder="E.g. Senior Backend Architect..."
                    value={catTitle}
                    onChange={(e) => setCatTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-900 pt-4">
              <button
                id="cancel-categorize-btn"
                onClick={() => setCategorizingId(null)}
                className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
              <button
                id="submit-categorize-btn"
                onClick={handleCategorizeSubmit}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-blue-500/10"
              >
                Grant Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Drawer Modal */}
      {editingUserId && (() => {
        const editingUser = users.find((u) => u.id === editingUserId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md h-full bg-white dark:bg-gray-950 p-6 shadow-2xl border-l border-gray-150 dark:border-gray-850 flex flex-col justify-between">
              <div className="space-y-6 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Edit Account</h3>
                    <p className="text-[10px] text-gray-400">Update this employee&apos;s profile, role, and reporting line.</p>
                  </div>
                  <button
                    id="close-edit-btn"
                    onClick={() => setEditingUserId(null)}
                    className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-650"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <form id="edit-user-form" onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      id="edit-name-input"
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Security Role</label>
                      <select
                        id="edit-role-select"
                        value={editRole}
                        onChange={(e) => {
                          const nextRole = e.target.value as UserRole;
                          setEditRole(nextRole);
                          if (nextRole !== 'Team Member') setEditTeamLeaderId('');
                        }}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Team Member">Team Member</option>
                        <option value="Team Leader">Team Leader</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department SBU</label>
                      <select
                        id="edit-department-select"
                        required
                        value={editDepartmentId}
                        onChange={(e) => setEditDepartmentId(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select SBU</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {editRole === 'Team Member' && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                        Supervising Team Leader (Optional)
                      </label>
                      <select
                        id="edit-teamleader-select"
                        value={editTeamLeaderId}
                        onChange={(e) => setEditTeamLeaderId(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">No Team Leader (Unassigned)</option>
                        {editTeamLeaderOptions.map((tl) => (
                          <option key={tl.id} value={tl.id}>{tl.name} ({tl.title})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">Designated Title</label>
                    <input
                      id="edit-title-input"
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </form>

                {editingUser && (
                  <div className="rounded-xl border border-gray-100 dark:border-gray-900 p-4 space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
                    <p className="text-[10px] text-gray-400">{editingUser.email}</p>
                    <button
                      id="send-password-reset-btn"
                      type="button"
                      onClick={() => onSendPasswordReset?.(editingUser.email)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 py-2 text-xs font-bold"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Send Password Reset Email
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-900 pt-4">
                <button
                  id="cancel-edit-btn"
                  onClick={() => setEditingUserId(null)}
                  className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  id="submit-edit-btn"
                  onClick={handleEditSubmit}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-blue-500/10"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* View Employee Details Modal */}
      {viewingUserId && (() => {
        const viewedUser = users.find((u) => u.id === viewingUserId);
        if (!viewedUser) return null;
        const dept = departments.find((d) => d.id === viewedUser.departmentId);
        const supervisor = users.find((s) => s.id === viewedUser.teamLeaderId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-2xl border border-gray-100 dark:border-gray-900">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <img src={viewedUser.avatar} alt={viewedUser.name} className="h-11 w-11 rounded-full object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{viewedUser.name}</h3>
                    <p className="text-[10px] text-blue-600 font-semibold">{viewedUser.role}</p>
                  </div>
                </div>
                <button
                  id="close-view-btn"
                  onClick={() => setViewingUserId(null)}
                  className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-650"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <dl className="space-y-3 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400 font-semibold">Title</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right">{viewedUser.title}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400 font-semibold">Department</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right">{dept?.name ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400 font-semibold">Reports To</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right">{supervisor?.name ?? 'Unassigned'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400 font-semibold">Email</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right">{viewedUser.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400 font-semibold">Phone</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right">{viewedUser.phone || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400 font-semibold">Status</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right">{viewedUser.status}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400 font-semibold">Performance Score</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right">{viewedUser.performanceScore}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400 font-semibold">UID</dt>
                  <dd className="text-gray-400 font-mono text-right">{viewedUser.id}</dd>
                </div>
              </dl>

              <div className="flex justify-end pt-5">
                <button
                  id="close-view-btn-footer"
                  onClick={() => setViewingUserId(null)}
                  className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
