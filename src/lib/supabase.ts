import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://xeqdvptzikkmdzgsxnpb.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xVM7yaJs9Fch_C0NswHFsw_efsc2G9s';

function resolveSupabaseUrl(rawValue: unknown): string {
  const raw = typeof rawValue === 'string' ? rawValue.trim() : '';

  if (/^https?:\/\/.+/i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return raw;
      }
    } catch {
      // Fall through to project ref / default URL resolution
    }
  }

  if (/^[a-z0-9]{15,30}$/i.test(raw)) {
    return `https://${raw}.supabase.co`;
  }

  return DEFAULT_SUPABASE_URL;
}

function resolveSupabaseKey(rawValue: unknown): string {
  const raw = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (raw && !raw.startsWith('MY_')) {
    return raw;
  }
  return DEFAULT_SUPABASE_PUBLISHABLE_KEY;
}

const SUPABASE_URL = resolveSupabaseUrl(import.meta.env?.VITE_SUPABASE_URL);
const SUPABASE_PUBLISHABLE_KEY = resolveSupabaseKey(
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
