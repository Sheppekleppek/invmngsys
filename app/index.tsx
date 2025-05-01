import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { SplashScreen } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export default function HomeScreen() {
  const { user, initializing, signOut } = useAuth();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const handleTabClose = async () => {
      try {
        await signOut();
      } catch (e) {
        console.log('Sign out error on tab close:', e);
      }
    };
    window.addEventListener('unload', handleTabClose);
    return () => window.removeEventListener('unload', handleTabClose);
  }, [signOut]);

  useEffect(() => {
    if (user && !initializing) {
      router.replace(`/(app)/${user.role === 'admin' ? 'admin' : 'branch'}/dashboard`);
    }
  }, [user, initializing]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0F3460', '#162955']} style={styles.background} />

      <Animated.View style={styles.logoContainer} entering={FadeIn.duration(1000)}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/5531004/pexels-photo-5531004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={styles.contentContainer} entering={FadeInDown.delay(300).duration(800)}>
        <Text style={styles.title}>sheppek leppek</Text>
        <Text style={styles.subtitle}>Inventory Management System</Text>

        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#fff',
  },
  contentContainer: {
    alignItems: 'center',
    width: '80%',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 48,
  },
  loginButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
});
