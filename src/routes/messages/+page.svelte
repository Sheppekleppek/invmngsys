<script lang="ts">
  import AdminMessage from '$lib/components/AdminMessage.svelte';
  import { profile } from '$lib/stores/auth';
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-semibold text-gray-900">Branch Messages</h1>

  {#if $profile?.role === 'main_manager'}
    <AdminMessage />
  {/if}
</div>