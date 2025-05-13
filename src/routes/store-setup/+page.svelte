<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';

  let storeName = '';
  let logoFile = null;
  let loading = false;
  let error = '';
  let showConfirmModal = false;

  async function handleSetup() {
    try {
      loading = true;
      error = '';

      // Check if store name is unique
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('name', storeName)
        .single();

      if (existingStore) {
        error = 'Store name is already taken';
        return;
      }

      let logoUrl = '';
      
      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('store-logos')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('store-logos')
          .getPublicUrl(fileName);
          
        logoUrl = publicUrl;
      }

      // Create store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert([{
          name: storeName,
          logo_url: logoUrl
        }])
        .select()
        .single();

      if (storeError) throw storeError;

      // Update store admin with store_id
      const { error: adminError } = await supabase
        .from('store_admins')
        .update({ store_id: store.id })
        .eq('user_id', $user?.id);

      if (adminError) throw adminError;

      // Redirect to dashboard
      goto('/');
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
      showConfirmModal = false;
    }
  }

  function handleLogoChange(event) {
    const input = event.target;
    if (input.files?.length) {
      logoFile = input.files[0];
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="w-full max-w-md space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Set up your store
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        This information will be permanent once saved
      </p>
    </div>

    <form class="mt-8 space-y-6" on:submit|preventDefault={() => showConfirmModal = true}>
      {#if error}
        <div class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">{error}</div>
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label for="storeName" class="block text-sm font-medium text-gray-700">
            Store Name
          </label>
          <input
            id="storeName"
            type="text"
            bind:value={storeName}
            required
            class="input mt-1 w-full"
            placeholder="Enter your store name"
          />
        </div>

        <div>
          <label for="logo" class="block text-sm font-medium text-gray-700">
            Store Logo
          </label>
          <input
            id="logo"
            type="file"
            accept="image/*"
            on:change={handleLogoChange}
            class="mt-1 w-full"
          />
          <p class="mt-1 text-sm text-gray-500">
            Recommended size: 200x200 pixels
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        class="btn btn-primary w-full"
      >
        {loading ? 'Setting up...' : 'Save and Continue'}
      </button>
    </form>
  </div>
</div>

{#if showConfirmModal}
  <div class="fixed inset-0 z-10 overflow-y-auto">
    <div class="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <div class="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
        <div>
          <h3 class="text-lg font-medium leading-6 text-gray-900">
            Confirm Store Setup
          </h3>
          <div class="mt-2">
            <p class="text-sm text-gray-500">
              Once saved, you won't be able to change the store name or logo later. Are you sure you want to continue?
            </p>
          </div>
        </div>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            class="btn btn-primary"
            on:click={handleSetup}
          >
            Confirm
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            on:click={() => showConfirmModal = false}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}