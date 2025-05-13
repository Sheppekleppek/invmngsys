import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
  const isAuthRoute = url.pathname === '/login';
  
  // Allow access to login page without session
  if (isAuthRoute) {
    return {};
  }

  // All other routes require authentication
  throw redirect(303, '/login');
};