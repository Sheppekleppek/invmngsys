<script lang="ts">
  import '../app.css';
  import { user, profile } from '$lib/stores/auth';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase';

  let store = null;

  async function loadStore() {
    if ($profile?.store_id) {
      const { data } = await supabase
        .from('stores')
        .select('name, logo_url')
        .eq('id', $profile.store_id)
        .single();
      store = data;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  $: {
    if ($profile?.store_id) {
      loadStore();
    }
  }
</script>

{#if $user && $profile && $page.url.pathname !== '/login' && $page.url.pathname !== '/register' && $page.url.pathname !== '/store-setup'}
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 justify-between">
          <div class="flex">
            <div class="flex flex-shrink-0 items-center">
              {#if store?.logo_url}
                <img src={store.logo_url} alt={store.name} class="h-8 w-8 rounded-full object-cover" />
              {/if}
              <span class="ml-2 text-xl font-bold text-primary-600">{store?.name || 'Loading...'}</span>
            </div>
            <div class="ml-6 flex items-center space-x-4">
              <a href="/" class="px-3 py-2 text-gray-700 hover:text-primary-600">Dashboard</a>
              {#if $profile.role === 'main_manager'}
                <a href="/warehouse" class="px-3 py-2 text-gray-700 hover:text-primary-600">Warehouse</a>
                <a href="/products" class="px-3 py-2 text-gray-700 hover:text-primary-600">Products</a>
                <a href="/branches" class="px-3 py-2 text-gray-700 hover:text-primary-600">Branches</a>
                <a href="/managers" class="px-3 py-2 text-gray-700 hover:text-primary-600">Managers</a>
              {/if}
              <a href="/inventory" class="px-3 py-2 text-gray-700 hover:text-primary-600">Inventory</a>
              <a href="/sales" class="px-3 py-2 text-gray-700 hover:text-primary-600">Sales</a>
              <a href="/transfers" class="px-3 py-2 text-gray-700 hover:text-primary-600">Transfers</a>
              <a href="/reports" class="px-3 py-2 text-gray-700 hover:text-primary-600">Reports</a>
              {#if $profile.role === 'main_manager'}
                <a href="/messages" class="px-3 py-2 text-gray-700 hover:text-primary-600">Messages</a>
              {/if}
            </div>
          </div>
          <div class="flex items-center">
            <span class="mr-4 text-gray-700">{$profile.full_name}</span>
            <button on:click={signOut} class="btn btn-secondary">Sign Out</button>
          </div>
        </div>
      </div>
    </nav>
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
{:else}
  <slot />
{/if}