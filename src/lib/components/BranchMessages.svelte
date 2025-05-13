<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { profile } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  let messages = [];
  let loading = false;
  let error = '';

  async function loadMessages() {
    try {
      loading = true;
      const { data, error: fetchError } = await supabase
        .from('admin_messages')
        .select(`
          id,
          message,
          created_at,
          from_admin:store_admins!admin_messages_from_admin_id_fkey (
            full_name
          )
        `)
        .eq('to_branch_id', $profile?.branch_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      messages = data;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if ($profile?.branch_id) {
      loadMessages();
    }
  });
</script>

<div class="rounded-lg bg-white p-6 shadow">
  <h2 class="text-lg font-medium text-gray-900">Messages from Admin</h2>

  {#if error}
    <div class="mt-4 rounded-md bg-red-50 p-4">
      <div class="text-sm text-red-700">{error}</div>
    </div>
  {/if}

  {#if loading}
    <div class="mt-4 text-center text-gray-600">Loading messages...</div>
  {:else if messages.length === 0}
    <p class="mt-4 text-gray-500">No messages yet</p>
  {:else}
    <div class="mt-4 space-y-4">
      {#each messages as message}
        <div class="rounded-lg bg-gray-50 p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-900">
              From: {message.from_admin.full_name}
            </span>
            <span class="text-xs text-gray-500">
              {new Date(message.created_at).toLocaleString()}
            </span>
          </div>
          <p class="mt-2 text-gray-700">{message.message}</p>
        </div>
      {/each}
    </div>
  {/if}
</div>