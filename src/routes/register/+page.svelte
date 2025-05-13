<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let fullName = '';
  let email = '';
  let phone = '';
  let username = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let error = '';

  async function handleRegister() {
    try {
      if (password !== confirmPassword) {
        error = 'Passwords do not match';
        return;
      }

      if (password.length < 6) {
        error = 'Password must be at least 6 characters';
        return;
      }

      loading = true;
      error = '';

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName
          }
        }
      });

      if (authError) throw authError;

      // Create store admin record
      const { error: adminError } = await supabase
        .from('store_admins')
        .insert([{
          user_id: authData.user?.id,
          full_name: fullName,
          phone,
          username
        }]);

      if (adminError) throw adminError;

      // Redirect to login with success message
      goto('/login?registered=true');
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
        Create your store account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Already have an account?
        <a href="/login" class="font-medium text-primary-600 hover:text-primary-500">
          Sign in
        </a>
      </p>
    </div>

    <form class="mt-8 space-y-6" on:submit|preventDefault={handleRegister}>
      {#if error}
        <div class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">{error}</div>
        </div>
      {/if}

      <div class="space-y-4 rounded-md shadow-sm">
        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            bind:value={fullName}
            required
            class="input mt-1 w-full"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            class="input mt-1 w-full"
          />
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            bind:value={phone}
            required
            class="input mt-1 w-full"
          />
        </div>

        <div>
          <label for="username" class="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            id="username"
            type="text"
            bind:value={username}
            required
            class="input mt-1 w-full"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            minlength="6"
            class="input mt-1 w-full"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={confirmPassword}
            required
            minlength="6"
            class="input mt-1 w-full"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          class="btn btn-primary w-full"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </div>
    </form>
  </div>
</div>