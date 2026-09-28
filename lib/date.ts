// Local calendar date (YYYY-MM-DD) for "today" — used to match against
// pm.attendance.date and similar date-keyed lookups. A single shared source
// so every dashboard agrees on what "today" means (previously each
// dashboard hardcoded a fixed demo date independently, causing checked-in
// state and today-scoped data to never match the real date).
export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

// today + N days, as a local calendar date — used for date-input defaults
// (add-task/add-project forms) so the native picker opens on the current
// month instead of a fixed demo date baked into the initial state.
export function addDaysISODate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
