<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { profile } from '$lib/stores/auth';

  let message = '';
  let selectedBranchId = '';
  let branches = [];
  let loading = false;
  let error = '';

  async function loadBranches() {
    const { data } = await supabase
      .from('branches')
      .select('id, name')
      .eq('store_id', $profile?.store_id)
      .order('name');
    branches = data || [];
  }

  async function sendMessage() {
    try {
      loading = true;
      error = '';

      const { error: sendError } = await supabase
        .from('admin_messages')
        .insert([{
          store_id: $profile?.store_id,
          from_admin_id: $profile?.id,
          to_branch_id: selectedBranchId,
          message
        }]);

      if (sendError) throw sendError;

      message = '';
      selectedBranchId = '';
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  $: {
    if ($profile?.store_id) {
      loadBranches();
    }
  }
</script>

<div class="rounded-lg bg-white p-6 shadow">
  <h2 class="text-lg font-medium text-gray-900">Send Message to Branch</h2>

  {#if error}
    <div class="mt-4 rounded-md bg-red-50 p-4">
      <div class="text-sm text-red-700">{error}</div>
    </div>
  {/if}

  <form on:submit|preventDefault={sendMessage} class="mt-4 space-y-4">
    <div>
      <label for="branch" class="block text-sm font-medium text-gray-700">Branch</label>
      <select
        id="branch"
        bind:value={selectedBranchId}
        required
        class="input mt-1 w-full"
      >
        <option value="">Select a branch</option>
        {#each branches as branch}
          <option value={branch.id}>{branch.name}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="message" class="block text-sm font-medium text-gray-700">Message</label>
      <textarea
        id="message"
        bind:value={message}
        required
        rows="3"
        class="input mt-1 w-full"
      ></textarea>
    </div>

    <button
      type="submit"
      disabled={loading}
      class="btn btn-primary"
    >
      {loading ? 'Sending...' : 'Send Message'}
    </button>
  </form>
</div>