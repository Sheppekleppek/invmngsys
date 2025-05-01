import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout() {
  const { user, initializing } = useAuth();

  // Show loading indicator while checking authentication
  if (initializing) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect href="/" />;
  }

  return (
    <Stack>
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="branch" options={{ headerShown: false }} />
    </Stack>
  );
}