import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SplashScreen } from 'expo-router';
import { InventoryProvider } from '@/contexts/InventoryContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(app)';

    if (!user && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (user && !inAuthGroup) {
      // Redirect to admin dashboard if authenticated
      router.replace('/(app)/admin');
    }
  }, [user, initializing, segments]);

  return null;
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <InventoryProvider>
          <AuthGuard />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </InventoryProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}