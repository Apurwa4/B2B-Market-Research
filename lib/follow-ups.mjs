// Date-only follow-ups use the visitor's local calendar date, avoiding UTC day shifts.
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function followUpState(value, today = localDateKey()) {
  if (!value) return 'none';
  return value < today ? 'overdue' : value === today ? 'today' : 'upcoming';
}
export function formatFollowUp(value) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}
