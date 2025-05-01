import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useInventory } from '@/contexts/InventoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart2, TrendingUp, Package, ShoppingCart, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { products, branches, loading } = useInventory();
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState(0);
  const [totalBranches, setTotalBranches] = useState(0);
  
  useEffect(() => {
    if (!loading) {
      setTotalProducts(products.length);
      setLowStockProducts(products.filter(p => p.mainStock < 10).length);
      setTotalBranches(branches.length);
    }
  }, [products, branches, loading]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.username || 'Admin'}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <LinearGradient
              colors={['#0F3460', '#1A4D8C']}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <Package size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.statTitle}>Total Products</Text>
              <Text style={styles.statValue}>{totalProducts}</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <LinearGradient
              colors={['#E94560', '#B02E46']}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <BarChart2 size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.statTitle}>Low Stock</Text>
              <Text style={styles.statValue}>{lowStockProducts}</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <LinearGradient
              colors={['#16213E', '#0F3460']}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <ShoppingCart size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.statTitle}>Branches</Text>
              <Text style={styles.statValue}>{totalBranches}</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        <Animated.View 
          style={styles.activityContainer}
          entering={FadeInDown.delay(400).duration(400)}
        >
          {/* Replace with real data from your inventory context */}
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <TrendingUp size={18} color="#0F3460" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                New stock received - 50 units of "Milk"
              </Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <ShoppingCart size={18} color="#0F3460" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                Branch #1 sold 15 units of "Bread"
              </Text>
              <Text style={styles.activityTime}>5 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Package size={18} color="#0F3460" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                Low stock alert for "Coffee" (5 units left)
              </Text>
              <Text style={styles.activityTime}>Yesterday</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Branch Overview</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={16} color="#0F3460" />
          </TouchableOpacity>
        </View>

        <Animated.View 
          style={styles.branchesContainer}
          entering={FadeInDown.delay(500).duration(400)}
        >
          {branches.length > 0 ? (
            branches.map((branch, index) => (
              <View key={branch.id} style={styles.branchCard}>
                <Text style={styles.branchName}>{branch.name}</Text>
                <Text style={styles.branchLocation}>{branch.location}</Text>
                <View style={styles.branchManager}>
                  <Text style={styles.branchManagerLabel}>Manager:</Text>
                  <Text style={styles.branchManagerName}>{branch.managerName}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No branches found</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#1A202C',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  statCard: {
    width: '30%',
    borderRadius: 12,
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#0F3460',
    marginRight: 4,
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#1A202C',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
  },
  branchesContainer: {
    marginBottom: 24,
  },
  branchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  branchName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
    marginBottom: 4,
  },
  branchLocation: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4A5568',
    marginBottom: 8,
  },
  branchManager: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchManagerLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
    marginRight: 4,
  },
  branchManagerName: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
  },
});