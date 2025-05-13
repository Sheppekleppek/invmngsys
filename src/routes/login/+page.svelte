<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let username = '';
  let password = '';
  let selectedStore = '';
  let loading = false;
  let error = '';
  let stores = [];
  let justRegistered = false;

  async function loadStores() {
    const { data } = await supabase
      .from('stores')
      .select('id, name')
      .order('name');
    stores = data || [];
  }

  $: {
    justRegistered = $page.url.searchParams.get('registered') === 'true';
    loadStores();
  }

  async function handleLogin() {
    try {
      loading = true;
      error = '';

      // Get user by username
      const { data: adminData, error: adminError } = await supabase
        .from('store_admins')
        .select('user_id, store_id')
        .eq('username', username)
        .eq('store_id', selectedStore)
        .single();

      if (adminError || !adminData) {
        error = 'Invalid credentials';
        return;
      }

      // Sign in with email/password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: username, // Using username as email for now
        password
      });

      if (signInError) throw signInError;

      // Check if store setup is needed
      if (!adminData.store_id) {
        goto('/store-setup');
      } else {
        goto('/');
      }
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="w-full max-w-md space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Sign in to your account
      </h2>
      {#if justRegistered}
        <div class="mt-2 rounded-md bg-green-50 p-4">
          <p class="text-sm text-green-700">
            Registration successful! Please check your email for verification before signing in.
          </p>
        </div>
      {/if}
    </div>

    <form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
      {#if error}
        <div class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">{error}</div>
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label for="store" class="block text-sm font-medium text-gray-700">Store</label>
          <select
            id="store"
            bind:value={selectedStore}
            required
            class="input mt-1 w-full"
          >
            <option value="">Select a store</option>
            {#each stores as store}
              <option value={store.id}>{store.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
          <input
            id="username"
            type="text"
            bind:value={username}
            required
            class="input mt-1 w-full"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            class="input mt-1 w-full"
          />
        </div>
      </div>

      <button type="submit" disabled={loading} class="btn btn-primary w-full">
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <div class="text-center">
        <p class="text-sm text-gray-600">
          Don't have an account?
          <a href="/register" class="font-medium text-primary-600 hover:text-primary-500">
            Register here
          </a>
        </p>
      </div>
    </form>
  </div>
</div>