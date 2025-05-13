<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { profile } from '$lib/stores/auth';

  let sales = [];
  let products = [];
  let branches = [];
  let loading = false;
  let error = '';

  // Form data
  let showForm = false;
  let selectedProductId = '';
  let selectedBranchId = '';
  let quantity = 1;

  // Inventory data
  let currentInventory = null;

  onMount(async () => {
    await Promise.all([
      loadSales(),
      loadProducts(),
      loadBranches()
    ]);
  });

  async function loadSales() {
    try {
      loading = true;
      let query = supabase
        .from('sales')
        .select(`
          id,
          quantity,
          sale_date,
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

      // If branch manager, only show their branch sales
      if ($profile?.role === 'branch_manager' && $profile?.branch_id) {
        query = query.eq('branch_id', $profile.branch_id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      sales = data;
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

  async function checkInventory() {
    if (!selectedProductId || !selectedBranchId) {
      currentInventory = null;
      return;
    }

    const { data } = await supabase
      .from('branch_inventory')
      .select('quantity')
      .eq('product_id', selectedProductId)
      .eq('branch_id', selectedBranchId)
      .single();

    currentInventory = data;
  }

  async function handleSubmit() {
    try {
      if (!currentInventory || currentInventory.quantity < quantity) {
        error = 'Insufficient inventory for this sale';
        return;
      }

      loading = true;
      error = '';

      const saleData = {
        product_id: selectedProductId,
        branch_id: selectedBranchId,
        quantity,
        sale_date: new Date().toISOString().split('T')[0]
      };

      const { error: insertError } = await supabase
        .from('sales')
        .insert([saleData]);

      if (insertError) throw insertError;

      await loadSales();
      resetForm();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function resetForm() {
    selectedProductId = '';
    selectedBranchId = '';
    quantity = 1;
    currentInventory = null;
    showForm = false;
  }

  // Set branch ID when profile changes
  $: if ($profile?.branch_id && $profile?.role === 'branch_manager') {
    selectedBranchId = $profile.branch_id;
  }

  $: {
    if (selectedProductId && selectedBranchId) {
      checkInventory();
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold text-gray-900">Sales Management</h1>
    <button class="btn btn-primary" on:click={() => showForm = true}>
      Record New Sale
    </button>
  </div>

  {#if error}
    <div class="rounded-md bg-red-50 p-4">
      <div class="text-sm text-red-700">{error}</div>
    </div>
  {/if}

  {#if showForm}
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-lg font-medium text-gray-900">Record New Sale</h2>
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

        {#if $profile?.role === 'main_manager'}
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
        {/if}

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

        {#if currentInventory !== null}
          <div class="rounded-md bg-gray-50 p-4">
            <p class="text-sm text-gray-700">
              Current inventory: <strong>{currentInventory.quantity}</strong>
            </p>
            {#if currentInventory.quantity < quantity}
              <p class="mt-1 text-sm text-red-600">
                Warning: Insufficient inventory for this sale
              </p>
            {/if}
          </div>
        {/if}

        <div class="flex justify-end space-x-3">
          <button type="button" class="btn btn-secondary" on:click={resetForm}>
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={loading || !currentInventory || currentInventory.quantity < quantity}
          >
            {loading ? 'Recording...' : 'Record Sale'}
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if loading && !showForm}
    <div class="text-center">
      <div class="text-gray-600">Loading sales...</div>
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
              Branch
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Quantity
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each sales as sale}
            <tr>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {new Date(sale.sale_date).toLocaleDateString()}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                <div>{sale.products.name_en}</div>
                <div class="text-xs text-gray-500">{sale.products.product_code}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                <div>{sale.branches.name}</div>
                <div class="text-xs text-gray-500">{sale.branches.location || '-'}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {sale.quantity}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>