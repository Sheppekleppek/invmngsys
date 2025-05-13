<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { profile } from '$lib/stores/auth';

  let transfers = [];
  let products = [];
  let branches = [];
  let loading = false;
  let error = '';

  // Form data
  let showForm = false;
  let selectedProductId = '';
  let fromBranchId = '';
  let toBranchId = '';
  let quantity = 1;
  let notes = '';

  // Source inventory
  let warehouseInventory = null;

  onMount(async () => {
    await Promise.all([
      loadTransfers(),
      loadProducts(),
      loadBranches()
    ]);
  });

  async function loadTransfers() {
    try {
      loading = true;
      let query = supabase
        .from('branch_transfers')
        .select(`
          id,
          quantity,
          status,
          notes,
          created_at,
          products (
            id,
            product_code,
            name_en
          ),
          from_branch:branches!branch_transfers_from_branch_id_fkey (
            id,
            name
          ),
          to_branch:branches!branch_transfers_to_branch_id_fkey (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      // If branch manager, only show transfers involving their branch
      if ($profile?.role === 'branch_manager' && $profile?.branch_id) {
        query = query.or(`from_branch_id.eq.${$profile.branch_id},to_branch_id.eq.${$profile.branch_id}`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      transfers = data;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('id, product_code, name_en')
      .eq('store_id', $profile?.store_id)
      .order('name_en');
    products = data || [];
  }

  async function loadBranches() {
    const { data } = await supabase
      .from('branches')
      .select('id, name')
      .eq('store_id', $profile?.store_id)
      .order('name');
    branches = data || [];
  }

  async function checkWarehouseInventory() {
    if (!selectedProductId) {
      warehouseInventory = null;
      return;
    }

    const { data } = await supabase
      .from('warehouse_inventory')
      .select('quantity')
      .eq('store_id', $profile?.store_id)
      .eq('product_id', selectedProductId)
      .single();

    warehouseInventory = data;
  }

  async function handleSubmit() {
    try {
      if (!warehouseInventory || warehouseInventory.quantity < quantity) {
        error = 'Insufficient warehouse inventory for transfer';
        return;
      }

      loading = true;
      error = '';

      const transferData = {
        product_id: selectedProductId,
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        quantity,
        notes,
        status: 'pending'
      };

      const { error: insertError } = await supabase
        .from('branch_transfers')
        .insert([transferData]);

      if (insertError) throw insertError;

      await loadTransfers();
      resetForm();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function updateTransferStatus(transferId, newStatus) {
    try {
      loading = true;
      error = '';

      const { error: updateError } = await supabase
        .from('branch_transfers')
        .update({ status: newStatus })
        .eq('id', transferId);

      if (updateError) throw updateError;

      await loadTransfers();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function resetForm() {
    selectedProductId = '';
    fromBranchId = '';
    toBranchId = '';
    quantity = 1;
    notes = '';
    warehouseInventory = null;
    showForm = false;
  }

  function getStatusColor(status) {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'approved':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  $: {
    if (selectedProductId) {
      checkWarehouseInventory();
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold text-gray-900">Branch Transfers</h1>
    <button class="btn btn-primary" on:click={() => showForm = true}>
      New Transfer Request
    </button>
  </div>

  {#if error}
    <div class="rounded-md bg-red-50 p-4">
      <div class="text-sm text-red-700">{error}</div>
    </div>
  {/if}

  {#if showForm}
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-lg font-medium text-gray-900">New Transfer Request</h2>
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
          <label for="product" class="block text-sm font-medium text-gray-700">Product</label>
          <select
            id="product"
            bind:value={selectedProductId}
            required
            class="input mt-1 w-full"
          >
            <option value="">Select a product</option>
            {#each products as product}
              <option value={product.id}>
                {product.name_en} ({product.product_code})
              </option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="fromBranch" class="block text-sm font-medium text-gray-700">From Branch</label>
            <select
              id="fromBranch"
              bind:value={fromBranchId}
              required
              class="input mt-1 w-full"
            >
              <option value="">Select source branch</option>
              {#each branches as branch}
                <option value={branch.id}>{branch.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="toBranch" class="block text-sm font-medium text-gray-700">To Branch</label>
            <select
              id="toBranch"
              bind:value={toBranchId}
              required
              class="input mt-1 w-full"
            >
              <option value="">Select destination branch</option>
              {#each branches as branch}
                {#if branch.id !== fromBranchId}
                  <option value={branch.id}>{branch.name}</option>
                {/if}
              {/each}
            </select>
          </div>
        </div>

        <div>
          <label for="quantity" class="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            id="quantity"
            bind:value={quantity}
            min="1"
            required
            class="input mt-1 w-full"
          />
        </div>

        {#if warehouseInventory !== null}
          <div class="rounded-md bg-gray-50 p-4">
            <p class="text-sm text-gray-700">
              Available in warehouse: <strong>{warehouseInventory.quantity}</strong>
            </p>
            {#if warehouseInventory.quantity < quantity}
              <p class="mt-1 text-sm text-red-600">
                Warning: Insufficient warehouse inventory for transfer
              </p>
            {/if}
          </div>
        {/if}

        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            id="notes"
            bind:value={notes}
            rows="3"
            class="input mt-1 w-full"
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3">
          <button type="button" class="btn btn-secondary" on:click={resetForm}>
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={loading || !warehouseInventory || warehouseInventory.quantity < quantity}
          >
            {loading ? 'Creating...' : 'Create Transfer Request'}
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if loading && !showForm}
    <div class="text-center">
      <div class="text-gray-600">Loading transfers...</div>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Product
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              From
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              To
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Quantity
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each transfers as transfer}
            <tr>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {new Date(transfer.created_at).toLocaleDateString()}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                <div>{transfer.products.name_en}</div>
                <div class="text-xs text-gray-500">{transfer.products.product_code}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {transfer.from_branch.name}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {transfer.to_branch.name}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {transfer.quantity}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm">
                <span class={getStatusColor(transfer.status)}>
                  {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right text-sm">
                {#if transfer.status === 'pending' && (
                  $profile?.role === 'main_manager' ||
                  $profile?.branch_id === transfer.to_branch.id
                )}
                  <button
                    class="text-blue-600 hover:text-blue-900"
                    on:click={() => updateTransferStatus(transfer.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    class="ml-3 text-red-600 hover:text-red-900"
                    on:click={() => updateTransferStatus(transfer.id, 'rejected')}
                  >
                    Reject
                  </button>
                {:else if transfer.status === 'approved' && (
                  $profile?.role === 'main_manager' ||
                  $profile?.branch_id === transfer.from_branch.id
                )}
                  <button
                    class="text-green-600 hover:text-green-900"
                    on:click={() => updateTransferStatus(transfer.id, 'completed')}
                  >
                    Complete
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>