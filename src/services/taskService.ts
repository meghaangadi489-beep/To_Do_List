import type { PostgrestError, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Priority, Task, TaskFormData } from '../types/task';
import { addDaysISO, getTodayISO } from '../utils/date';

interface DbTaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  category: string;
  completed: boolean;
  created_at: string;
}

function logAndThrowSupabaseError(
  operation: string,
  error: PostgrestError | { code?: string; message: string; details?: string | null; hint?: string | null }
): never {
  const code = error.code || 'UNKNOWN';
  console.error(`[TaskFlow Supabase Error] ${operation} | code=${code} | message=${error.message}`, {
    code,
    message: error.message,
    details: error.details ?? null,
    hint: error.hint ?? null,
  });
  const suffix = error.details ? ` (${error.details})` : '';
  throw new Error(error.code ? `[${error.code}] ${error.message}${suffix}` : `${error.message}${suffix}`);
}

async function requireAuthenticatedUser(expectedUserId?: string): Promise<User> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    const code = sessionError?.code || 'NO_SESSION';
    const message =
      sessionError?.message || 'No active authentication session. Please sign in again.';
    console.error(`[TaskFlow Session Error] code=${code} | message=${message}`, sessionError);
    throw new Error(`[${code}] ${message}`);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const code = error?.code || 'AUTH_REQUIRED';
    const message = error?.message || 'User is not authenticated. Please sign in again.';
    console.error(`[TaskFlow Auth Error] code=${code} | message=${message}`, error);
    throw new Error(`[${code}] ${message}`);
  }

  if (expectedUserId && user.id !== expectedUserId) {
    console.error(
      `[TaskFlow Auth Mismatch] Authenticated user (${user.id}) does not match requested user (${expectedUserId}).`
    );
    throw new Error('Authenticated user mismatch. Please refresh and sign in again.');
  }

  return user;
}

function normalizeDueDate(dueDate: string): string | null {
  const trimmed = dueDate.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}

function mapRowToTask(row: DbTaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? '',
    dueDate: row.due_date ?? '',
    priority: row.priority,
    category: row.category || 'Work',
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  };
}

export async function fetchUserTasks(userId: string): Promise<Task[]> {
  const authUser = await requireAuthenticatedUser(userId);

  const { data, error } = await supabase
    .from('tasks')
    .select('id, user_id, title, description, due_date, priority, category, completed, created_at')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    logAndThrowSupabaseError('fetchUserTasks', error);
  }

  return ((data as DbTaskRow[]) || []).map(mapRowToTask);
}

export async function createTaskForUser(
  userId: string,
  formData: TaskFormData
): Promise<Task> {
  const authUser = await requireAuthenticatedUser(userId);

  const payload = {
    user_id: authUser.id,
    title: formData.title.trim(),
    description: formData.description.trim(),
    due_date: normalizeDueDate(formData.dueDate),
    priority: formData.priority,
    category: formData.category || 'Work',
    completed: false,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select('id, user_id, title, description, due_date, priority, category, completed, created_at')
    .single();

  if (error) {
    logAndThrowSupabaseError('createTaskForUser', error);
  }

  if (!data) {
    throw new Error('Task insert did not return a saved record.');
  }

  return mapRowToTask(data as DbTaskRow);
}

export async function restoreTaskForUser(userId: string, task: Task): Promise<Task> {
  const authUser = await requireAuthenticatedUser(userId);

  const payload = {
    id: task.id,
    user_id: authUser.id,
    title: task.title,
    description: task.description,
    due_date: normalizeDueDate(task.dueDate),
    priority: task.priority,
    category: task.category || 'Work',
    completed: task.completed,
    created_at: task.createdAt,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select('id, user_id, title, description, due_date, priority, category, completed, created_at')
    .single();

  if (error) {
    logAndThrowSupabaseError('restoreTaskForUser', error);
  }

  if (!data) {
    throw new Error('Task restore did not return a saved record.');
  }

  return mapRowToTask(data as DbTaskRow);
}

export async function updateTaskForUser(
  userId: string,
  taskId: string,
  formData: TaskFormData
): Promise<Task> {
  const authUser = await requireAuthenticatedUser(userId);

  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: formData.title.trim(),
      description: formData.description.trim(),
      due_date: normalizeDueDate(formData.dueDate),
      priority: formData.priority,
      category: formData.category || 'Work',
    })
    .eq('id', taskId)
    .eq('user_id', authUser.id)
    .select('id, user_id, title, description, due_date, priority, category, completed, created_at')
    .single();

  if (error) {
    logAndThrowSupabaseError('updateTaskForUser', error);
  }

  if (!data) {
    throw new Error('Task update did not return an updated record.');
  }

  return mapRowToTask(data as DbTaskRow);
}

export async function toggleTaskCompletionForUser(
  userId: string,
  taskId: string,
  completed: boolean
): Promise<Task> {
  const authUser = await requireAuthenticatedUser(userId);

  const { data, error } = await supabase
    .from('tasks')
    .update({
      completed,
    })
    .eq('id', taskId)
    .eq('user_id', authUser.id)
    .select('id, user_id, title, description, due_date, priority, category, completed, created_at')
    .single();

  if (error) {
    logAndThrowSupabaseError('toggleTaskCompletionForUser', error);
  }

  return mapRowToTask(data as DbTaskRow);
}

export async function deleteTaskForUser(userId: string, taskId: string): Promise<void> {
  const authUser = await requireAuthenticatedUser(userId);

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', authUser.id);

  if (error) {
    logAndThrowSupabaseError('deleteTaskForUser', error);
  }
}

export async function clearCompletedTasksForUser(userId: string): Promise<void> {
  const authUser = await requireAuthenticatedUser(userId);

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', authUser.id)
    .eq('completed', true);

  if (error) {
    logAndThrowSupabaseError('clearCompletedTasksForUser', error);
  }
}

export async function deleteAllTasksForUser(userId: string): Promise<void> {
  const authUser = await requireAuthenticatedUser(userId);

  const { error } = await supabase.from('tasks').delete().eq('user_id', authUser.id);

  if (error) {
    logAndThrowSupabaseError('deleteAllTasksForUser', error);
  }
}

export async function insertSampleTasksForUser(userId: string): Promise<Task[]> {
  const authUser = await requireAuthenticatedUser(userId);

  const today = getTodayISO();
  const tomorrow = addDaysISO(1);
  const inTwoDays = addDaysISO(2);
  const inFiveDays = addDaysISO(5);
  const yesterday = addDaysISO(-1);

  const samples = [
    {
      user_id: authUser.id,
      title: 'Finalize Q4 product roadmap presentation',
      description:
        'Align key engineering milestones, customer retention targets, and resource allocations for executive review.',
      due_date: today,
      priority: 'High',
      category: 'Product',
      completed: false,
    },
    {
      user_id: authUser.id,
      title: 'Review design system glassmorphism tokens',
      description:
        'Audit backdrop blur levels, border contrast ratios, and dark-navy surface elevation across dashboard views.',
      due_date: today,
      priority: 'Medium',
      category: 'Design',
      completed: false,
    },
    {
      user_id: authUser.id,
      title: 'Resolve OAuth token refresh edge case',
      description:
        'Ensure silent session renewal queues concurrent API requests rather than triggering duplicate refresh calls.',
      due_date: yesterday,
      priority: 'High',
      category: 'Engineering',
      completed: false,
    },
    {
      user_id: authUser.id,
      title: 'Prepare monthly cloud infrastructure cost breakdown',
      description:
        'Export compute and database usage metrics and flag any idle staging instances for teardown.',
      due_date: tomorrow,
      priority: 'Medium',
      category: 'Finance',
      completed: false,
    },
    {
      user_id: authUser.id,
      title: 'Schedule 1:1 sync with frontend platform lead',
      description:
        'Discuss Vite bundle splitting improvements and upcoming accessibility audit checklist.',
      due_date: inTwoDays,
      priority: 'Low',
      category: 'Work',
      completed: false,
    },
    {
      user_id: authUser.id,
      title: 'Book annual dental checkup & lab screening',
      description: 'Check morning availability for next Thursday before 10:00 AM.',
      due_date: inFiveDays,
      priority: 'Low',
      category: 'Personal',
      completed: false,
    },
    {
      user_id: authUser.id,
      title: 'Ship onboarding checklist analytics events',
      description:
        'Verified event payloads in staging and confirmed funnel conversion chart updates properly.',
      due_date: today,
      priority: 'High',
      category: 'Engineering',
      completed: true,
    },
  ];

  const { data, error } = await supabase
    .from('tasks')
    .insert(samples)
    .select('id, user_id, title, description, due_date, priority, category, completed, created_at');

  if (error) {
    logAndThrowSupabaseError('insertSampleTasksForUser', error);
  }

  return ((data as DbTaskRow[]) || []).map(mapRowToTask);
}
