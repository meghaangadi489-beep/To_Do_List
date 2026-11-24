export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCurrentFullDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function isTodayDate(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr === getTodayISO();
}

export function isUpcomingDate(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr > getTodayISO();
}

export function isOverdueDate(dateStr: string, completed: boolean): boolean {
  if (!dateStr || completed) return false;
  return dateStr < getTodayISO();
}

export function formatDueDateLabel(dateStr: string): string {
  if (!dateStr) return 'No due date';

  const today = getTodayISO();
  const tomorrow = addDaysISO(1);
  const yesterday = addDaysISO(-1);

  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  if (dateStr === yesterday) return 'Yesterday';

  const [year, month, day] = dateStr.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  const currentYear = new Date().getFullYear();

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(year !== currentYear ? { year: 'numeric' } : {}),
  }).format(parsed);
}
