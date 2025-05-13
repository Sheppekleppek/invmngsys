<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { profile } from '$lib/stores/auth';

  let branches = [];
  let loading = false;
  let error = '';

  // Form data
  let showForm = false;
  let editingBranch = null;
  let name = '';
  let location = '';

  onMount(async () => {
    await loadBranches();
  });

  async function loadBranches() {
    try {
      loading = true;
      const { data, error: fetchError } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      branches = data;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    try {
      loading = true;
      error = '';

      const branchData = {
        name,
        location
      };

      let result;
      if (editingBranch) {
        result = await supabase
          .from('branches')
          .update(branchData)
          .eq('id', editingBranch.id);
      } else {
        result = await supabase
          .from('branches')
          .insert([branchData]);
      }

      if (result.error) throw result.error;

      await loadBranches();
      resetForm();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function deleteBranch(id) {
  if (!confirm('Are you sure you want to delete this branch? This will also delete all associated inventory and sales data.')) return;

  try {
    loading = true;
    error = '';

    const { error: deleteError } = await supabase
      .from('branches')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await loadBranches();
  } catch (e) {
    error = e.message || 'Something went wrong';
  } finally {
    loading = false;
  }
}


  function editBranch(branch) {
    editingBranch = branch;
    name = branch.name;
    location = branch.location || '';
    showForm = true;
  }

  function resetForm() {
    editingBranch = null;
    name = '';
    location = '';
    showForm = false;
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold text-gray-900">Branches</h1>
    {#if $profile?.role === 'main_manager'}
      <button class="btn btn-primary" on:click={() => showForm = true}>
        Add New Branch
      </button>
    {/if}
  </div>

  {#if error}
    <div class="rounded-md bg-red-50 p-4">
      <div class="text-sm text-red-700">{error}</div>
    </div>
  {/if}

  {#if showForm}
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-lg font-medium text-gray-900">
        {editingBranch ? 'Edit Branch' : 'Add New Branch'}
      </h2>
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Branch Name</label>
          <input
            type="text"
            id="name"
            bind:value={name}
            required
            class="input mt-1 w-full"
          />
        </div>

        <div>
          <label for="location" class="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            id="location"
            bind:value={location}
            class="input mt-1 w-full"
          />
        </div>

        <div class="flex justify-end space-x-3">
          <button type="button" class="btn btn-secondary" on:click={resetForm}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Branch'}
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if loading && !showForm}
    <div class="text-center">
      <div class="text-gray-600">Loading branches...</div>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Branch Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Location
            </th>
            {#if $profile?.role === 'main_manager'}
              <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            {/if}
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each branches as branch}
            <tr>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {branch.name}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {branch.location || '-'}
              </td>
              {#if $profile?.role === 'main_manager'}
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    class="text-primary-600 hover:text-primary-900"
                    on:click={() => editBranch(branch)}
                  >
                    Edit
                  </button>
                  <button
                    class="ml-4 text-red-600 hover:text-red-900"
                    on:click={() => deleteBranch(branch.id)}
                  >
                    Delete
                  </button>
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>