import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import { AppState, Platform } from 'react-native';

// Types
type UserRole = 'admin' | 'branch_manager';

export interface User {
  uid: string;
  email: string;
  username: string;
  role: UserRole;
  branchId?: string;
  branchName?: string;
}

interface AuthContextType {
  user: User | null;
  initializing: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  initializing: true,
  signIn: async () => {},
  signOut: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Hardcoded admin credentials mapping (for initial setup)
const ADMIN_CREDENTIALS = {
  'Mr.B': {
    email: 'admin@sheppekleppek.com',
    password: 'Moon_LighT033023'
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('📡 onAuthStateChanged Triggered');
      
      if (firebaseUser) {
        console.log('✅ Firebase user found:', firebaseUser.uid);
  
        try {
          const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'uid'>;
            const fullUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              ...userData,
            };
            
            setUser(fullUser);
            console.log('🎯 تم تحميل بيانات المستخدم من Firestore:', fullUser);
          } else {
            console.error('❌ User document does not exist in Firestore');
            await firebaseSignOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error('❌ Error fetching user data from Firestore:', error);
          setUser(null);
        }
      } else {
        console.warn('ℹ️ No user is currently signed in');
        setUser(null);
      }
  
      setInitializing(false);
    });

    // Add event listener for app state changes
    const handleAppStateChange = async (nextAppState: string) => {
      console.log('📱 App state changed to:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('🔒 Signing out due to app state change');
        try {
          await firebaseSignOut(auth);
          setUser(null);
        } catch (error) {
          console.error('❌ Error during auto sign out:', error);
        }
      }
    };

    // Subscribe to app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Add visibility change listener for web
    if (Platform.OS === 'web') {
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'hidden') {
          console.log('🔒 Signing out due to page visibility change');
          try {
            await firebaseSignOut(auth);
            setUser(null);
          } catch (error) {
            console.error('❌ Error during auto sign out:', error);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Add beforeunload event listener
      const handleBeforeUnload = async () => {
        console.log('🔒 Signing out due to page unload');
        try {
          await firebaseSignOut(auth);
          setUser(null);
        } catch (error) {
          console.error('❌ Error during auto sign out:', error);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
  
      return () => {
        unsubscribe();
        appStateSubscription.remove();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  
    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, []);
  


  // Sign in function
  const signIn = async (username: string, password: string) => {
    // Check if it's the admin with hardcoded credentials first
    if (username === 'Mr.B' && password === 'Moon_LighT033023') {
      try {
        // Use the mapped email for Firebase authentication
        const { email } = ADMIN_CREDENTIALS['Mr.B'];
        await signInWithEmailAndPassword(auth, email, password);
        // User data will be set by the onAuthStateChanged listener
      } catch (error: any) {
        console.error('Admin login error:', error);
        throw new Error('Invalid credentials');
      }
    } else {
      try {
        // For branch managers, lookup username in Firestore to get email
        // For simplicity in demo, we'll assume username = email for branch managers
        await signInWithEmailAndPassword(auth, `${username}@sheppekleppek.com`, password);
      } catch (error: any) {
        console.error('Login error:', error);
        throw new Error('Invalid credentials');
      }
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    initializing,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}