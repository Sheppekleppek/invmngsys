<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { profile } from '$lib/stores/auth';

  let managers = [];
  let branches = [];
  let loading = false;
  let error = '';

  // Form data
  let showForm = false;
  let editingManager = null;
  let fullName = '';
  let email = '';
  let username = '';
  let password = '';
  let selectedBranchId = '';

  onMount(async () => {
    await Promise.all([
      loadManagers(),
      loadBranches()
    ]);
  });

  async function loadManagers() {
    try {
      loading = true;
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          branches (
            id,
            name
          )
        `)
        .eq('store_id', $profile?.store_id)
        .eq('role', 'branch_manager')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      managers = data;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function loadBranches() {
    const { data } = await supabase
      .from('branches')
      .select('id, name')
      .eq('store_id', $profile?.store_id)
      .order('name');
    branches = data || [];
  }

  async function handleSubmit() {
    try {
      loading = true;
      error = '';

      if (editingManager) {
        // Update existing manager
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            branch_id: selectedBranchId
          })
          .eq('id', editingManager.id);

        if (updateError) throw updateError;

        if (password) {
          // Update password if provided
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            editingManager.id,
            { password }
          );

          if (passwordError) throw passwordError;
        }
      } else {
        // Create new manager
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'branch_manager'
            }
          }
        });

        if (authError) throw authError;

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user?.id,
            full_name: fullName,
            role: 'branch_manager',
            branch_id: selectedBranchId,
            store_id: $profile?.store_id
          }]);

        if (profileError) throw profileError;
      }

      await loadManagers();
      resetForm();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function deleteManager(id) {
    if (!confirm('Are you sure you want to delete this manager?')) return;

    try {
      loading = true;
      error = '';

      const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

      if (deleteError) throw deleteError;

      await loadManagers();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function editManager(manager) {
    editingManager = manager;
    fullName = manager.full_name;
    selectedBranchId = manager.branches?.id || '';
    showForm = true;
  }

  function resetForm() {
    editingManager = null;
    fullName = '';
    email = '';
    username = '';
    password = '';
    selectedBranchId = '';
    showForm = false;
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold text-gray-900">Branch Managers</h1>
    <button class="btn btn-primary" on:click={() => showForm = true}>
      Add New Manager
    </button>
  </div>

  {#if error}
    <div class="rounded-md bg-red-50 p-4">
      <div class="text-sm text-red-700">{error}</div>
    </div>
  {/if}

  {#if showForm}
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-lg font-medium text-gray-900">
        {editingManager ? 'Edit Manager' : 'Add New Manager'}
      </h2>
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            id="fullName"
            bind:value={fullName}
            required
            class="input mt-1 w-full"
          />
        </div>

        {#if !editingManager}
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              bind:value={email}
              required
              class="input mt-1 w-full"
            />
          </div>

          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              bind:value={username}
              required
              class="input mt-1 w-full"
            />
          </div>
        {/if}

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            {editingManager ? 'New Password (leave blank to keep current)' : 'Password'}
          </label>
          <input
            type="password"
            id="password"
            bind:value={password}
            required={!editingManager}
            minlength="6"
            class="input mt-1 w-full"
          />
        </div>

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

        <div class="flex justify-end space-x-3">
          <button type="button" class="btn btn-secondary" on:click={resetForm}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Manager'}
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if loading && !showForm}
    <div class="text-center">
      <div class="text-gray-600">Loading managers...</div>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Manager Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Branch
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each managers as manager}
            <tr>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {manager.full_name}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {manager.branches?.name || '-'}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <button
                  class="text-primary-600 hover:text-primary-900"
                  on:click={() => editManager(manager)}
                >
                  Edit
                </button>
                <button
                  class="ml-4 text-red-600 hover:text-red-900"
                  on:click={() => deleteManager(manager.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>