<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { profile } from '$lib/stores/auth';

  let products = [];
  let loading = false;
  let error = '';

  // Form data
  let showForm = false;
  let editingProduct = null;
  let productCode = '';
  let nameEn = '';
  let nameAr = '';
  let description = '';

  onMount(async () => {
    await loadProducts();
  });

  async function loadProducts() {
    try {
      loading = true;
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      products = data;
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

      const productData = {
        product_code: productCode,
        name_en: nameEn,
        name_ar: nameAr,
        description
      };

      let result;
      if (editingProduct) {
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
      } else {
        result = await supabase
          .from('products')
          .insert([productData]);
      }

      if (result.error) throw result.error;

      await loadProducts();
      resetForm();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      loading = true;
      error = '';

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await loadProducts();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function editProduct(product) {
    editingProduct = product;
    productCode = product.product_code;
    nameEn = product.name_en;
    nameAr = product.name_ar;
    description = product.description || '';
    showForm = true;
  }

  function resetForm() {
    editingProduct = null;
    productCode = '';
    nameEn = '';
    nameAr = '';
    description = '';
    showForm = false;
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold text-gray-900">Products</h1>
    {#if $profile?.role === 'main_manager'}
      <button class="btn btn-primary" on:click={() => showForm = true}>
        Add New Product
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
        {editingProduct ? 'Edit Product' : 'Add New Product'}
      </h2>
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
          <label for="productCode" class="block text-sm font-medium text-gray-700">Product Code</label>
          <input
            type="text"
            id="productCode"
            bind:value={productCode}
            required
            class="input mt-1 w-full"
          />
        </div>

        <div>
          <label for="nameEn" class="block text-sm font-medium text-gray-700">Name (English)</label>
          <input
            type="text"
            id="nameEn"
            bind:value={nameEn}
            required
            class="input mt-1 w-full"
          />
        </div>

        <div>
          <label for="nameAr" class="block text-sm font-medium text-gray-700">Name (Arabic)</label>
          <input
            type="text"
            id="nameAr"
            bind:value={nameAr}
            required
            class="input mt-1 w-full"
            dir="rtl"
          />
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            bind:value={description}
            rows="3"
            class="input mt-1 w-full"
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3">
          <button type="button" class="btn btn-secondary" on:click={resetForm}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if loading && !showForm}
    <div class="text-center">
      <div class="text-gray-600">Loading products...</div>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Product Code
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Name (English)
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Name (Arabic)
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Description
            </th>
            {#if $profile?.role === 'main_manager'}
              <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            {/if}
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each products as product}
            <tr>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {product.product_code}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {product.name_en}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900" dir="rtl">
                {product.name_ar}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {product.description || '-'}
              </td>
              {#if $profile?.role === 'main_manager'}
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    class="text-primary-600 hover:text-primary-900"
                    on:click={() => editProduct(product)}
                  >
                    Edit
                  </button>
                  <button
                    class="ml-4 text-red-600 hover:text-red-900"
                    on:click={() => deleteProduct(product.id)}
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