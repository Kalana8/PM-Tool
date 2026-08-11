import { User } from './types';

// Admin (base_level, not a delegable permission) implicitly has every page
// and action — mirrors the RLS-side pm.current_app_has_action() bypass, so
// the UI and the database never disagree about what an Admin can do.
export function hasPage(user: Pick<User, 'baseLevel' | 'permissions'>, page: string): boolean {
  return user.baseLevel === 'admin' || user.permissions.pages.includes(page);
}

export function hasAction(user: Pick<User, 'baseLevel' | 'permissions'>, action: string): boolean {
  return user.baseLevel === 'admin' || user.permissions.actions.includes(action);
}
