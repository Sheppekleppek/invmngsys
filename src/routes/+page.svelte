<script lang="ts">
  import { user } from '$lib/stores/auth';
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
  <!-- Hero Section -->
  <div class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
        <span class="block">Streamline Your Inventory</span>
        <span class="block text-primary-600">Across All Branches</span>
      </h1>
      <p class="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
        The complete inventory management solution for businesses of all sizes. Manage stock, track sales, and coordinate between branches - all in one place.
      </p>
      <div class="mx-auto mt-5 max-w-md sm:flex sm:justify-center md:mt-8">
        {#if $user}
          <a href="/dashboard" class="btn btn-primary">
            Go to Dashboard
          </a>
        {:else}
          <div class="space-x-4">
            <a href="/login" class="btn btn-primary">
              I already have a store
            </a>
            <a href="/register" class="btn btn-secondary">
              Create your store now
            </a>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Features Section -->
  <div class="bg-white py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <!-- Feature 1 -->
        <div class="text-center">
          <div class="mx-auto h-12 w-12 text-primary-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 class="mt-6 text-lg font-medium text-gray-900">Multi-Branch Management</h3>
          <p class="mt-2 text-base text-gray-500">
            Manage inventory across multiple locations with real-time synchronization and transfer tracking.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="text-center">
          <div class="mx-auto h-12 w-12 text-primary-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="mt-6 text-lg font-medium text-gray-900">Sales Tracking</h3>
          <p class="mt-2 text-base text-gray-500">
            Monitor sales performance across all branches with detailed reports and analytics.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="text-center">
          <div class="mx-auto h-12 w-12 text-primary-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 class="mt-6 text-lg font-medium text-gray-900">Team Management</h3>
          <p class="mt-2 text-base text-gray-500">
            Assign roles, manage permissions, and communicate with branch managers effectively.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>