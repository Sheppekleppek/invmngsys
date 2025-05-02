import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createBranchManager: (
    name: string, 
    branchNumber: string, 
    branchLocation: string, 
    username: string, 
    password: string
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            setUser({
              id: firebaseUser.uid,
              ...userData
            });
          } else {
            // Handle case where Firebase auth exists but no Firestore profile
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Error loading user profile');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      // In a real app, you would first query Firestore to get the email associated with this username
      // For demo purposes, we're assuming username = email
      const email = `${username}@sheppek-leppek.com`;
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // User data should be fetched in the onAuthStateChanged listener
      toast.success('Login successful');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid username or password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
      throw error;
    }
  };

  const createBranchManager = async (
    name: string, 
    branchNumber: string, 
    branchLocation: string, 
    username: string, 
    password: string
  ) => {
    try {
      const email = `${username}@sheppek-leppek.com`;
      
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', uid), {
        username,
        role: 'branch-manager',
        branchId: branchNumber,
        branchName: name,
        branchLocation
      });
      
      // Create branch manager record
      await setDoc(doc(db, 'branchManagers', uid), {
        name,
        branchNumber,
        branchLocation,
        username,
        createdAt: new Date()
      });
      
      toast.success(`Branch manager "${name}" created successfully`);
    } catch (error) {
      console.error('Error creating branch manager:', error);
      toast.error('Failed to create branch manager');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    createBranchManager
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthState = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
};