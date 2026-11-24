import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { NavView, Priority, UserSettings } from '../types/task';

export const DEFAULT_CATEGORIES = [
  'Work',
  'Product',
  'Design',
  'Engineering',
  'Personal',
  'Finance',
];

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Alex',
  defaultPriority: 'Medium',
  defaultView: 'dashboard',
  categories: DEFAULT_CATEGORIES,
};

const VALID_VIEWS: NavView[] = [
  'dashboard',
  'all',
  'today',
  'upcoming',
  'completed',
  'settings',
];

const VALID_PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export function extractSettingsFromUser(user: User | null): UserSettings {
  if (!user) return DEFAULT_SETTINGS;

  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const emailFallback = user.email ? user.email.split('@')[0] : DEFAULT_SETTINGS.userName;

  const userName =
    typeof meta.full_name === 'string' && meta.full_name.trim()
      ? meta.full_name.trim()
      : emailFallback;

  const defaultPriority = VALID_PRIORITIES.includes(meta.default_priority as Priority)
    ? (meta.default_priority as Priority)
    : DEFAULT_SETTINGS.defaultPriority;

  const defaultView = VALID_VIEWS.includes(meta.default_view as NavView)
    ? (meta.default_view as NavView)
    : DEFAULT_SETTINGS.defaultView;

  const categories =
    Array.isArray(meta.categories) && meta.categories.length > 0
      ? meta.categories.filter(
          (c): c is string => typeof c === 'string' && c.trim().length > 0
        )
      : DEFAULT_SETTINGS.categories;

  return {
    userName,
    defaultPriority,
    defaultView,
    categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES,
  };
}

export async function saveSettingsToSupabase(settings: UserSettings): Promise<UserSettings> {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: settings.userName,
      default_priority: settings.defaultPriority,
      default_view: settings.defaultView,
      categories: settings.categories,
    },
  });

  if (error) {
    throw error;
  }

  return extractSettingsFromUser(data.user);
}
