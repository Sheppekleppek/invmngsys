<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { profile } from '$lib/stores/auth';

  let inventory = [];
  let products = [];
  let branches = [];
  let loading = false;
  let error = '';

  // Form data
  let showForm = false;
  let editingInventory = null;
  let selectedProductId = '';
  let selectedBranchId = '';
  let quantity = 0;
  let minStockLevel = 10;

  onMount(async () => {
    await Promise.all([
      loadInventory(),
      loadProducts(),
      loadBranches()
    ]);
  });

  async function loadInventory() {
    try {
      loading = true;
      let query = supabase
        .from('branch_inventory')
        .select(`
          id,
          quantity,
          min_stock_level,
          products (
            id,
            product_code,
            name_en,
            name_ar
          ),
          branches (
            id,
            name,
            location
          )
        `)
        .order('created_at', { ascending: false });

      // If branch manager, only show their branch inventory
      if ($profile?.role === 'branch_manager' && $profile?.branch_id) {
        query = query.eq('branch_id', $profile.branch_id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      inventory = data;
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
      .order('name_en');
    products = data || [];
  }

  async function loadBranches() {
    const { data } = await supabase
      .from('branches')
      .select('id, name')
      .order('name');
    branches = data || [];
  }

  async function handleSubmit() {
    try {
      loading = true;
      error = '';

      const inventoryData = {
        product_id: selectedProductId,
        branch_id: selectedBranchId,
        quantity,
        min_stock_level: minStockLevel
      };

      let result;
      if (editingInventory) {
        result = await supabase
          .from('branch_inventory')
          .update(inventoryData)
          .eq('id', editingInventory.id);
      } else {
        result = await supabase
          .from('branch_inventory')
          .insert([inventoryData]);
      }

      if (result.error) throw result.error;

      await loadInventory();
      resetForm();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function editInventoryItem(item) {
    editingInventory = item;
    selectedProductId = item.products.id;
    selectedBranchId = item.branches.id;
    quantity = item.quantity;
    minStockLevel = item.min_stock_level;
    showForm = true;
  }

  function resetForm() {
    editingInventory = null;
    selectedProductId = '';
    selectedBranchId = '';
    quantity = 0;
    minStockLevel = 10;
    showForm = false;
  }

  function getStockStatus(quantity, minStockLevel) {
    if (quantity === 0) {
      return { color: 'text-red-600', text: 'Out of Stock' };
    } else if (quantity <= minStockLevel) {
      return { color: 'text-yellow-600', text: 'Low Stock' };
    }
    return { color: 'text-green-600', text: 'In Stock' };
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold text-gray-900">Inventory Management</h1>
    {#if $profile?.role === 'main_manager'}
      <button class="btn btn-primary" on:click={() => showForm = true}>
        Add New Inventory
      </button>
    {/if}
  </div>

  {#if error}
    <div class="rounded-md bg-red-50 p-4">
      <div class="text-sm text-red-700">{error}</div>
    </div>
  {/if}

  {#if showForm && $profile?.role === 'main_manager'}
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-lg font-medium text-gray-900">
        {editingInventory ? 'Edit Inventory' : 'Add New Inventory'}
      </h2>
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
          <label for="quantity" class="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            id="quantity"
            bind:value={quantity}
            min="0"
            required
            class="input mt-1 w-full"
          />
        </div>

        <div>
          <label for="minStockLevel" class="block text-sm font-medium text-gray-700">
            Minimum Stock Level
          </label>
          <input
            type="number"
            id="minStockLevel"
            bind:value={minStockLevel}
            min="0"
            required
            class="input mt-1 w-full"
          />
        </div>

        <div class="flex justify-end space-x-3">
          <button type="button" class="btn btn-secondary" on:click={resetForm}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Inventory'}
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if loading && !showForm}
    <div class="text-center">
      <div class="text-gray-600">Loading inventory...</div>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Product
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Branch
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Quantity
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            {#if $profile?.role === 'main_manager'}
              <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            {/if}
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each inventory as item}
            <tr>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                <div>{item.products.name_en}</div>
                <div class="text-xs text-gray-500">{item.products.product_code}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                <div>{item.branches.name}</div>
                <div class="text-xs text-gray-500">{item.branches.location || '-'}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {item.quantity}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm">
                {#if true}
                  {@const status = getStockStatus(item.quantity, item.min_stock_level)}
                  <span class={status.color}>{status.text}</span>
                  {#if item.quantity <= item.min_stock_level}
                    <div class="text-xs text-gray-500">
                      Minimum stock level: {item.min_stock_level}
                    </div>
                  {/if}
                {/if}
              </td>
              {#if $profile?.role === 'main_manager'}
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    class="text-primary-600 hover:text-primary-900"
                    on:click={() => editInventoryItem(item)}
                  >
                    Edit
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