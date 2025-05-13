import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import { supabase } from '$lib/supabase';

export const user = writable<User | null>(null);
export const profile = writable<any>(null);

// Initialize the store with the current session
supabase.auth.getSession().then(({ data: { session } }) => {
  user.set(session?.user ?? null);
  if (session?.user) {
    loadProfile(session.user.id);
  }
});

// Listen for auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  user.set(session?.user ?? null);
  if (session?.user) {
    loadProfile(session.user.id);
  } else {
    profile.set(null);
  }
});

async function loadProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!error && data) {
    profile.set(data);
  }
}