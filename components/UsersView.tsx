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
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { User, Department, Role, RoleBaseLevel, PendingUser } from '../lib/types';
import { hasAction } from '../lib/permissions';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

interface UsersViewProps {
  users: User[];
  departments: Department[];
  roles: Role[];
  userRole: RoleBaseLevel;
  currentUser: User;
  currentUserId?: string;
  onAddUser: (user: Omit<User, 'id' | 'performanceScore' | 'roleName' | 'baseLevel' | 'permissions'>) => void;
  onToggleUserStatus: (userId: string) => void;
  pendingUsers?: PendingUser[];
  onCategorizeUser?: (
    pendingUserId: string,
    updates: { roleId: string; departmentId: string; title: string; teamLeaderId?: string }
  ) => void;
  onDeclineUser?: (pendingUserId: string) => void;
  onEditUser?: (
    userId: string,
    updates: { name: string; title: string; roleId: string; departmentId: string; teamLeaderId?: string }
  ) => void;
  onSendPasswordReset?: (email: string) => void;
  onResetPassword?: (userId: string, newPassword: string) => Promise<boolean>;
  onAddUserWithPassword?: (
    user: Omit<User, 'id' | 'performanceScore' | 'roleName' | 'baseLevel' | 'permissions'>,
    password: string
  ) => void;
  onDeleteUser?: (userId: string) => void;
  credentialUserIds: string[];
  onViewCredentials?: (userId: string) => Promise<{ email: string; password: string } | null>;
  businessSlug: string | null;
  onSendTaskSummaryEmail?: (userId: string) => Promise<boolean>;
}

export default function UsersView({
  users,
  departments,
  roles,
  userRole,
  currentUser,
  currentUserId,
  onAddUser,
  onToggleUserStatus,
  pendingUsers = [],
  onCategorizeUser,
  onDeclineUser,
  onEditUser,
  onSendPasswordReset,
  onResetPassword,
  onAddUserWithPassword,
  onDeleteUser,
  credentialUserIds,
  onViewCredentials,
  businessSlug,
  onSendTaskSummaryEmail
}: UsersViewProps) {
  const loginUrl = SITE_URL && businessSlug ? `${SITE_URL}/${businessSlug}/user-login` : null;
  const canSendTaskEmail = userRole === 'admin' || userRole === 'team_leader';
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [viewingCredsUserId, setViewingCredsUserId] = useState<string | null>(null);
  const [credsLoading, setCredsLoading] = useState(false);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'link' | 'email' | 'password' | 'both' | null>(null);
  const [sendingEmailUserId, setSendingEmailUserId] = useState<string | null>(null);

  const handleSendTaskEmail = async (userId: string) => {
    setSendingEmailUserId(userId);
    await onSendTaskSummaryEmail?.(userId);
    setSendingEmailUserId(null);
  };

  const openCredentials = async (userId: string) => {
    setViewingCredsUserId(userId);
    setCredsLoading(true);
    setCreds(null);
    const result = (await onViewCredentials?.(userId)) ?? null;
    setCreds(result);
    setCredsLoading(false);
  };

  const closeCredentials = () => {
    setViewingCredsUserId(null);
    setCreds(null);
    setCopiedField(null);
  };

  const copyToClipboard = (field: 'link' | 'email' | 'password' | 'both', value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField((prev) => (prev === field ? null : prev)), 1500);
  };
  const [query, setQuery] = useState('');
  const [categorizingId, setCategorizingId] = useState<string | null>(null);
  const [catRoleId, setCatRoleId] = useState('');
  const [catDepartmentId, setCatDepartmentId] = useState('');
  const [catTitle, setCatTitle] = useState('');
  const [catTeamLeaderId, setCatTeamLeaderId] = useState('');

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editTeamLeaderId, setEditTeamLeaderId] = useState('');
  const [resetPasswordDraft, setResetPasswordDraft] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [password, setPassword] = useState('');

  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const canManageLogin = hasAction(currentUser, 'users.manage_login');

  // A Team Leader may only add Team Member-tier roles onto their own team;
  // nobody picks an Admin-tier role from this drawer (Categorize/Edit are
  // the only Admin-only flows that can grant one — see below).
  const addRoleOptions = roles.filter((r) =>
    userRole === 'team_leader' ? r.baseLevel === 'team_member' : r.baseLevel !== 'admin'
  );
  const selectedAddRole = roles.find((r) => r.id === roleId);

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !departmentId || !title.trim() || !roleId) return;
    if (canManageLogin && password.length < 6) return;

    const newUser = {
      name,
      email,
      roleId,
      departmentId,
      status: 'Active' as const,
      avatar: `https://picsum.photos/seed/${name.replace(' ', '')}/100/100`,
      title,
      phone,
      // Optional: a Team Member can be assigned a supervising Team Leader, or left unassigned
      teamLeaderId: selectedAddRole?.baseLevel === 'team_member' && teamLeaderId ? teamLeaderId : undefined
    };

    // Admins (or any role with users.manage_login) set a password up front, which immediately
    // creates a real login for the new employee. Everyone else keeps the profile-only flow.
    if (canManageLogin && onAddUserWithPassword) {
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
    userRole === 'team_leader' && currentUserId
      ? users.filter((u) => u.teamLeaderId === currentUserId)
      : userRole === 'team_member' && currentUserId
      ? users.filter((u) => u.id === users.find((me) => me.id === currentUserId)?.teamLeaderId)
      : users;

  const teamLeaderOptions = users.filter(
    (u) => u.baseLevel === 'team_leader' && (!departmentId || u.departmentId === departmentId)
  );

  const catTeamLeaderOptions = users.filter(
    (u) => u.baseLevel === 'team_leader' && (!catDepartmentId || u.departmentId === catDepartmentId)
  );

  const openCategorize = (pendingUserId: string) => {
    setCategorizingId(pendingUserId);
    setCatRoleId(roles.find((r) => r.baseLevel === 'team_member')?.id || roles[0]?.id || '');
    setCatDepartmentId('');
    setCatTitle('');
    setCatTeamLeaderId('');
  };

  const selectedCatRole = roles.find((r) => r.id === catRoleId);

  const handleCategorizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categorizingId || !catDepartmentId || !catTitle.trim() || !catRoleId || !onCategorizeUser) return;

    onCategorizeUser(categorizingId, {
      roleId: catRoleId,
      departmentId: catDepartmentId,
      title: catTitle,
      teamLeaderId: selectedCatRole?.baseLevel === 'team_member' && catTeamLeaderId ? catTeamLeaderId : undefined
    });
    setCategorizingId(null);
  };

  const editTeamLeaderOptions = users.filter(
    (u) => u.baseLevel === 'team_leader' && u.id !== editingUserId && (!editDepartmentId || u.departmentId === editDepartmentId)
  );

  const selectedEditRole = roles.find((r) => r.id === editRoleId);

  const openEdit = (targetUser: User) => {
    setEditingUserId(targetUser.id);
    setEditName(targetUser.name);
    setEditTitle(targetUser.title);
    setEditRoleId(targetUser.roleId);
    setEditDepartmentId(targetUser.departmentId);
    setEditTeamLeaderId(targetUser.teamLeaderId || '');
    setResetPasswordDraft('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editName.trim() || !editDepartmentId || !editTitle.trim() || !editRoleId || !onEditUser) return;

    onEditUser(editingUserId, {
      name: editName,
      title: editTitle,
      roleId: editRoleId,
      departmentId: editDepartmentId,
      teamLeaderId: selectedEditRole?.baseLevel === 'team_member' && editTeamLeaderId ? editTeamLeaderId : undefined
    });
    setEditingUserId(null);
  };

  const directoryTitle =
    userRole === 'team_leader' ? 'My Team' : userRole === 'team_member' ? 'My Team Leader' : 'Personnel Directory';
  const directorySubtitle =
    userRole === 'team_leader'
      ? 'Team Members currently assigned under your supervision.'
      : userRole === 'team_member'
      ? 'The Team Leader supervising your work.'
      : 'Create, configure, and monitor all organizational Team Leaders and Team Member accounts.';

  const filteredUsers = scopedUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.title.toLowerCase().includes(query.toLowerCase())
  );

  const canAddEmployee = hasAction(currentUser, 'users.add');
  const canEditUsers = hasAction(currentUser, 'users.edit');
  const canDeleteUsers = hasAction(currentUser, 'users.delete');
  const currentUserRecord = users.find((u) => u.id === currentUserId);

  const handleOpenAdd = () => {
    if (userRole === 'team_leader') {
      setRoleId(addRoleOptions.find((r) => r.baseLevel === 'team_member')?.id || '');
      setDepartmentId(currentUserRecord?.departmentId || '');
      setTeamLeaderId(currentUserId || '');
    } else {
      setRoleId(addRoleOptions[0]?.id || '');
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
      {userRole === 'admin' && pendingUsers.length > 0 && (
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
                <th className="py-2.5">Department</th>
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
                          {u.employeeCode && <p className="text-[10px] text-gray-400 mt-0.5">Employee Code: {u.employeeCode}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{dept?.name}</span>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{dept?.code}</p>
                    </td>

                    {/* Title and role */}
                    <td className="py-3.5">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{u.title}</p>
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-0.5 block">
                        {u.roleName}
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
                        {canSendTaskEmail && (
                          <button
                            id={`send-task-email-btn-${u.id}`}
                            onClick={() => handleSendTaskEmail(u.id)}
                            disabled={sendingEmailUserId === u.id}
                            className="rounded-lg p-1.5 border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                            title="Email task summary to this employee"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}
                        {credentialUserIds.includes(u.id) && canManageLogin && (
                          <button
                            id={`view-credentials-btn-${u.id}`}
                            onClick={() => openCredentials(u.id)}
                            className="rounded-lg p-1.5 border border-gray-100 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View login credentials"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                        )}
                        {canEditUsers && (
                          <button
                            id={`edit-user-btn-${u.id}`}
                            onClick={() => openEdit(u)}
                            className="rounded-lg p-1.5 border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit employee account"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteUsers && (
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

                {canManageLogin && (
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
                      value={roleId}
                      disabled={userRole === 'team_leader'}
                      onChange={(e) => {
                        const nextRoleId = e.target.value;
                        setRoleId(nextRoleId);
                        const nextRole = roles.find((r) => r.id === nextRoleId);
                        if (nextRole?.baseLevel !== 'team_member') setTeamLeaderId('');
                      }}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {addRoleOptions.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    {userRole === 'team_leader' && (
                      <p className="text-[9px] text-gray-400 mt-1">Team Leaders may only add Team Members.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold font-semibold">Department</label>
                    <select
                      id="user-department-select"
                      required
                      value={departmentId}
                      disabled={userRole === 'team_leader'}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedAddRole?.baseLevel === 'team_member' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                      Supervising Team Leader (Optional)
                    </label>
                    <select
                      id="user-teamleader-select"
                      value={teamLeaderId}
                      disabled={userRole === 'team_leader'}
                      onChange={(e) => setTeamLeaderId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">No Team Leader (Unassigned)</option>
                      {teamLeaderOptions.map((tl) => (
                        <option key={tl.id} value={tl.id}>{tl.name} ({tl.title})</option>
                      ))}
                    </select>
                    {userRole === 'team_leader' && (
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
                      value={catRoleId}
                      onChange={(e) => {
                        const nextRoleId = e.target.value;
                        setCatRoleId(nextRoleId);
                        const nextRole = roles.find((r) => r.id === nextRoleId);
                        if (nextRole?.baseLevel !== 'team_member') setCatTeamLeaderId('');
                      }}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department</label>
                    <select
                      id="categorize-department-select"
                      required
                      value={catDepartmentId}
                      onChange={(e) => setCatDepartmentId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedCatRole?.baseLevel === 'team_member' && (
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
                        value={editRoleId}
                        onChange={(e) => {
                          const nextRoleId = e.target.value;
                          setEditRoleId(nextRoleId);
                          const nextRole = roles.find((r) => r.id === nextRoleId);
                          if (nextRole?.baseLevel !== 'team_member') setEditTeamLeaderId('');
                        }}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department</label>
                      <select
                        id="edit-department-select"
                        required
                        value={editDepartmentId}
                        onChange={(e) => setEditDepartmentId(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedEditRole?.baseLevel === 'team_member' && (
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

                {editingUser && canManageLogin && (
                  <div className="rounded-xl border border-gray-100 dark:border-gray-900 p-4 space-y-3">
                    <div className="space-y-2">
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

                    <div className="space-y-2 border-t border-gray-100 dark:border-gray-900 pt-3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reset Password Directly</label>
                      <p className="text-[9px] text-gray-400">Sets a temporary password immediately — the employee must set their own on next login.</p>
                      <div className="flex items-center gap-2">
                        <input
                          id="reset-password-input"
                          type="password"
                          minLength={6}
                          placeholder="New temporary password"
                          value={resetPasswordDraft}
                          onChange={(e) => setResetPasswordDraft(e.target.value)}
                          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          id="reset-password-btn"
                          type="button"
                          disabled={resettingPassword || resetPasswordDraft.trim().length < 6}
                          onClick={async () => {
                            setResettingPassword(true);
                            const ok = await onResetPassword?.(editingUser.id, resetPasswordDraft.trim());
                            setResettingPassword(false);
                            if (ok) setResetPasswordDraft('');
                          }}
                          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-xs font-bold disabled:opacity-60"
                        >
                          {resettingPassword ? 'Resetting...' : 'Reset'}
                        </button>
                      </div>
                    </div>
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
                    <p className="text-[10px] text-blue-600 font-semibold">{viewedUser.roleName}</p>
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
                {viewedUser.employeeCode && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400 font-semibold">Employee Code</dt>
                    <dd className="text-gray-800 dark:text-gray-200 font-mono text-right">{viewedUser.employeeCode}</dd>
                  </div>
                )}
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

      {/* View Login Credentials Modal */}
      {viewingCredsUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-2xl border border-gray-100 dark:border-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Login Credentials</h3>
              </div>
              <button
                id="close-credentials-btn"
                onClick={closeCredentials}
                className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-650"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {credsLoading && <p className="text-xs text-gray-400 text-center py-4">Loading...</p>}

            {!credsLoading && !creds && (
              <p className="text-xs text-gray-400 text-center py-4">Failed to load credentials.</p>
            )}

            {!credsLoading && creds && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Login Link</label>
                  {loginUrl ? (
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2">
                      <a
                        href={loginUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs text-blue-600 hover:underline truncate"
                      >
                        {loginUrl}
                      </a>
                      <button
                        id="copy-link-btn"
                        onClick={() => copyToClipboard('link', loginUrl)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Copy login link"
                      >
                        {copiedField === 'link' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">Not available yet (this business has no login slug configured).</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2">
                    <span className="flex-1 text-xs text-gray-900 dark:text-gray-100 truncate">{creds.email}</span>
                    <button
                      id="copy-email-btn"
                      onClick={() => copyToClipboard('email', creds.email)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Copy email"
                    >
                      {copiedField === 'email' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2">
                    <span className="flex-1 text-xs font-mono text-gray-900 dark:text-gray-100 truncate">{creds.password}</span>
                    <button
                      id="copy-password-btn"
                      onClick={() => copyToClipboard('password', creds.password)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Copy password"
                    >
                      {copiedField === 'password' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  id="copy-both-btn"
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      'both',
                      `${loginUrl ? `Login Link: ${loginUrl}\n` : ''}Email: ${creds.email}\nPassword: ${creds.password}`
                    )
                  }
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 py-2 text-xs font-bold"
                >
                  {copiedField === 'both' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Copied All
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy All
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex justify-end pt-5">
              <button
                id="close-credentials-btn-footer"
                onClick={closeCredentials}
                className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
