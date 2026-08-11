// Local calendar date (YYYY-MM-DD) for "today" — used to match against
// pm.attendance.date and similar date-keyed lookups. A single shared source
// so every dashboard agrees on what "today" means (previously each
// dashboard hardcoded a fixed demo date independently, causing checked-in
// state and today-scoped data to never match the real date).
export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}
