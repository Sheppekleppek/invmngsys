import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function BranchDashboard() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>لوحة مدير الفرع</Text>
      <Text style={styles.details}>مرحباً {user?.username} 👋</Text>
      <Text style={styles.info}>هذه صفحة مخصصة لإدارة مبيعات الفرع والمخزون.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f6fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10,
  },
  details: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 5,
  },
  info: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
