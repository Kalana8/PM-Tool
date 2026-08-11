'use client';

import React, { useState } from 'react';
import { ShieldCheck, Plus, Edit2, Trash, X, Users as UsersIcon } from 'lucide-react';
import { Role, RoleBaseLevel, RolePermissions, User, PAGE_KEYS, ACTION_KEYS } from '../lib/types';

const ACTION_LABELS: Record<string, string> = {
  'users.add': 'Add employees',
  'users.edit': 'Edit employee accounts',
  'users.delete': 'Delete employee accounts',
  'users.manage_login': 'Manage employee logins (password / reset)',
  'departments.manage': 'Create, edit, and delete departments',
  'projects.manage': 'Create, edit, and delete projects',
  'tasks.edit_progress': 'Edit task and subtask progress',
  'attendance.manage': "Manage other employees' attendance"
};

const BASE_LEVEL_LABELS: Record<RoleBaseLevel, string> = {
  admin: 'Admin',
  team_leader: 'Team Leader',
  team_member: 'Team Member'
};

interface RolesViewProps {
  roles: Role[];
  users: User[];
  onAddRole: (role: Omit<Role, 'id' | 'isSystem'>) => void;
  onUpdateRole: (roleId: string, updates: { name: string; permissions: RolePermissions }) => void;
  onDeleteRole: (roleId: string) => void;
}

const EMPTY_PERMISSIONS: RolePermissions = { pages: [], actions: [] };

export default function RolesView({ roles, users, onAddRole, onUpdateRole, onDeleteRole }: RolesViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [baseLevel, setBaseLevel] = useState<RoleBaseLevel>('team_member');
  const [permissions, setPermissions] = useState<RolePermissions>(EMPTY_PERMISSIONS);

  const userCount = (roleId: string) => users.filter((u) => u.roleId === roleId).length;

  const togglePage = (page: string) => {
    setPermissions((prev) => ({
      ...prev,
      pages: prev.pages.includes(page) ? prev.pages.filter((p) => p !== page) : [...prev.pages, page]
    }));
  };

  const toggleAction = (action: string) => {
    setPermissions((prev) => ({
      ...prev,
      actions: prev.actions.includes(action) ? prev.actions.filter((a) => a !== action) : [...prev.actions, action]
    }));
  };

  const openAdd = () => {
    setName('');
    setBaseLevel('team_member');
    setPermissions(EMPTY_PERMISSIONS);
    setIsAddOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRoleId(role.id);
    setName(role.name);
    setBaseLevel(role.baseLevel);
    setPermissions(role.permissions);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddRole({ name, baseLevel, permissions });
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleId || !name.trim()) return;
    onUpdateRole(editingRoleId, { name, permissions });
    setEditingRoleId(null);
  };

  const editingRole = roles.find((r) => r.id === editingRoleId);

  const renderPermissionEditor = (level: RoleBaseLevel) =>
    level === 'admin' ? (
      <p className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        Admin-tier roles always have full access to every page and action — this can&apos;t be narrowed.
      </p>
    ) : (
      <>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Visible Pages</label>
          <div className="grid grid-cols-2 gap-2">
            {PAGE_KEYS.map((page) => (
              <label key={page} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.pages.includes(page)}
                  onChange={() => togglePage(page)}
                  className="accent-blue-600"
                />
                {page}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Allowed Actions</label>
          <div className="space-y-2">
            {ACTION_KEYS.map((action) => (
              <label key={action} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.actions.includes(action)}
                  onChange={() => toggleAction(action)}
                  className="accent-blue-600"
                />
                {ACTION_LABELS[action] ?? action}
              </label>
            ))}
          </div>
        </div>
      </>
    );

  return (
    <div className="space-y-6 animate-fadeIn" id="roles-view-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">User Roles</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Create custom roles and control which pages and actions each one can access.
          </p>
        </div>
        <button
          id="open-add-role-btn"
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-500/10 self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Role
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm">
        <div className="overflow-x-auto" id="roles-table-view">
          <table className="w-full text-left text-xs text-gray-500">
            <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-900">
              <tr>
                <th className="py-2.5">Role</th>
                <th className="py-2.5">Base Level</th>
                <th className="py-2.5">Pages</th>
                <th className="py-2.5">Actions</th>
                <th className="py-2.5">Users</th>
                <th className="py-2.5 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-500" />
                      <span className="font-bold text-gray-950 dark:text-gray-100">{role.name}</span>
                      {role.isSystem && (
                        <span className="rounded-full bg-gray-100 dark:bg-gray-900 text-gray-500 text-[9px] font-bold px-2 py-0.5">System</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5">{BASE_LEVEL_LABELS[role.baseLevel]}</td>
                  <td className="py-3.5">{role.baseLevel === 'admin' ? 'All' : `${role.permissions.pages.length} / ${PAGE_KEYS.length}`}</td>
                  <td className="py-3.5">{role.baseLevel === 'admin' ? 'All' : `${role.permissions.actions.length} / ${ACTION_KEYS.length}`}</td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                      <UsersIcon className="h-3.5 w-3.5" />
                      {userCount(role.id)}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        id={`edit-role-btn-${role.id}`}
                        onClick={() => openEdit(role)}
                        className="rounded-lg p-1.5 border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit role"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        id={`delete-role-btn-${role.id}`}
                        onClick={() => {
                          if (window.confirm(`Delete role "${role.name}"?`)) onDeleteRole(role.id);
                        }}
                        disabled={role.isSystem || userCount(role.id) > 0}
                        title={role.isSystem ? 'System roles cannot be deleted' : userCount(role.id) > 0 ? 'Reassign users before deleting' : 'Delete role'}
                        className="rounded-lg p-1.5 border border-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white dark:bg-gray-950 p-6 shadow-2xl border-l border-gray-150 dark:border-gray-850 flex flex-col justify-between">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Create Role</h3>
                  <p className="text-[10px] text-gray-400">Name the role, pick a base level, then choose its permissions.</p>
                </div>
                <button
                  id="close-add-role"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-650"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form id="add-role-form" onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role Name</label>
                  <input
                    id="role-name-input"
                    type="text"
                    required
                    placeholder="E.g. HR Assistant..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Base Level</label>
                  <select
                    id="role-base-level-select"
                    value={baseLevel}
                    onChange={(e) => setBaseLevel(e.target.value as RoleBaseLevel)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="team_member">Team Member — sees only their own work</option>
                    <option value="team_leader">Team Leader — sees their own department</option>
                    <option value="admin">Admin — full access, sees everything</option>
                  </select>
                  <p className="text-[9px] text-gray-400 mt-1">
                    Controls the dashboard layout and department scoping this role gets, on top of the pages/actions below.
                  </p>
                </div>

                {renderPermissionEditor(baseLevel)}
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-900 pt-4">
              <button
                id="cancel-add-role-btn"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
              <button
                id="submit-add-role-btn"
                onClick={handleAddSubmit}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-blue-500/10"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRoleId && editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white dark:bg-gray-950 p-6 shadow-2xl border-l border-gray-150 dark:border-gray-850 flex flex-col justify-between">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Edit Role</h3>
                  <p className="text-[10px] text-gray-400">Base level is fixed after creation.</p>
                </div>
                <button
                  id="close-edit-role"
                  onClick={() => setEditingRoleId(null)}
                  className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-650"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form id="edit-role-form" onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role Name</label>
                  <input
                    id="edit-role-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Base Level</label>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{BASE_LEVEL_LABELS[editingRole.baseLevel]}</p>
                </div>

                {renderPermissionEditor(editingRole.baseLevel)}
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-900 pt-4">
              <button
                id="cancel-edit-role-btn"
                onClick={() => setEditingRoleId(null)}
                className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
              <button
                id="submit-edit-role-btn"
                onClick={handleEditSubmit}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-blue-500/10"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
