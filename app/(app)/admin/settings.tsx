import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { UserCircle, Building, Plus, Edit, Trash2, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { firestore, auth } from '@/services/firebase';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'branches' | 'managers'>('profile');
  
  // Branch management
  const [branches, setBranches] = useState<any[]>([
    { id: '1', name: 'North Branch', location: 'Northern District', managerName: 'John Doe' },
    { id: '2', name: 'South Branch', location: 'Southern District', managerName: 'Jane Smith' },
  ]);
  
  // Modal states
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  
  // Form states
  const [newBranch, setNewBranch] = useState({
    name: '',
    location: '',
  });
  
  const [editingBranch, setEditingBranch] = useState({
    id: '',
    name: '',
    location: '',
  });
  
  const [newManager, setNewManager] = useState({
    username: '',
    email: '',
    password: '',
    branchId: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle adding a new branch
  const handleAddBranch = async () => {
    try {
      setIsLoading(true);
      
      await addDoc(collection(firestore, 'branches'), {
        name: newBranch.name,
        location: newBranch.location,
        managerId: '',  // Will be set when assigning a manager
        managerName: 'Unassigned',
        createdAt: serverTimestamp()
      });
      
      // Reset form and close modal
      setNewBranch({ name: '', location: '' });
      setShowAddBranchModal(false);
      
      // Refresh branches (in a real app, this would be handled by your inventory context)
      setBranches([
        ...branches,
        { id: Date.now().toString(), name: newBranch.name, location: newBranch.location, managerName: 'Unassigned' }
      ]);
    } catch (error) {
      console.error('Error adding branch:', error);
      Alert.alert('Error', 'Failed to add branch');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle editing a branch
  const handleEditBranch = async () => {
    try {
      setIsLoading(true);
      
      await updateDoc(doc(firestore, 'branches', editingBranch.id), {
        name: editingBranch.name,
        location: editingBranch.location,
      });
      
      // Update local state (in a real app, this would be handled by your inventory context)
      setBranches(branches.map(branch => 
        branch.id === editingBranch.id 
          ? { ...branch, name: editingBranch.name, location: editingBranch.location }
          : branch
      ));
      
      setShowEditBranchModal(false);
    } catch (error) {
      console.error('Error updating branch:', error);
      Alert.alert('Error', 'Failed to update branch');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle deleting a branch
  const handleDeleteBranch = async (branchId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this branch?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, 'branches', branchId));
              
              // Update local state (in a real app, this would be handled by your inventory context)
              setBranches(branches.filter(branch => branch.id !== branchId));
            } catch (error) {
              console.error('Error deleting branch:', error);
              Alert.alert('Error', 'Failed to delete branch');
            }
          }
        }
      ]
    );
  };
  
  // Handle adding a new manager
  const handleAddManager = async () => {
    try {
      setIsLoading(true);
      
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newManager.email,
        newManager.password
      );
      
      // Add user to Firestore
      await addDoc(collection(firestore, 'users'), {
        username: newManager.username,
        email: newManager.email,
        role: 'branch_manager',
        branchId: newManager.branchId,
        createdAt: serverTimestamp()
      });
      
      // Update branch with new manager
      if (newManager.branchId) {
        await updateDoc(doc(firestore, 'branches', newManager.branchId), {
          managerId: userCredential.user.uid,
          managerName: newManager.username
        });
        
        // Update local state (in a real app, this would be handled by your inventory context)
        setBranches(branches.map(branch => 
          branch.id === newManager.branchId 
            ? { ...branch, managerName: newManager.username }
            : branch
        ));
      }
      
      // Reset form and close modal
      setNewManager({ username: '', email: '', password: '', branchId: '' });
      setShowAddManagerModal(false);
      
      Alert.alert('Success', 'Manager account created successfully');
    } catch (error) {
      console.error('Error adding manager:', error);
      Alert.alert('Error', 'Failed to create manager account');
    } finally {
      setIsLoading(false);
    }
  };
  
  const openEditBranchModal = (branch: any) => {
    setEditingBranch({
      id: branch.id,
      name: branch.name,
      location: branch.location
    });
    setShowEditBranchModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <UserCircle size={20} color={activeTab === 'profile' ? '#0F3460' : '#718096'} />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'branches' && styles.activeTab]}
          onPress={() => setActiveTab('branches')}
        >
          <Building size={20} color={activeTab === 'branches' ? '#0F3460' : '#718096'} />
          <Text style={[styles.tabText, activeTab === 'branches' && styles.activeTabText]}>
            Branches
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'managers' && styles.activeTab]}
          onPress={() => setActiveTab('managers')}
        >
          <UserCircle size={20} color={activeTab === 'managers' ? '#0F3460' : '#718096'} />
          <Text style={[styles.tabText, activeTab === 'managers' && styles.activeTabText]}>
            Managers
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {activeTab === 'profile' && (
          <Animated.View 
            style={styles.profileContainer}
            entering={FadeInDown.duration(300)}
          >
            <View style={styles.profileHeader}>
              <View style={styles.profileIconContainer}>
                <UserCircle size={40} color="#0F3460" />
              </View>
              <Text style={styles.profileName}>{user?.username || 'Admin'}</Text>
              <Text style={styles.profileRole}>Main Warehouse Manager</Text>
            </View>
            
            <View style={styles.profileInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Username:</Text>
                <Text style={styles.infoValue}>{user?.username || 'Admin'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user?.email || 'admin@sheppekleppek.com'}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {activeTab === 'branches' && (
          <Animated.View 
            style={styles.branchesContainer}
            entering={FadeInDown.duration(300)}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Manage Branches</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowAddBranchModal(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Branch</Text>
              </TouchableOpacity>
            </View>
            
            {branches.map((branch) => (
              <View key={branch.id} style={styles.branchCard}>
                <View style={styles.branchInfo}>
                  <Text style={styles.branchName}>{branch.name}</Text>
                  <Text style={styles.branchLocation}>{branch.location}</Text>
                  <Text style={styles.branchManager}>Manager: {branch.managerName}</Text>
                </View>
                
                <View style={styles.branchActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => openEditBranchModal(branch)}
                  >
                    <Edit size={20} color="#3182CE" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteBranch(branch.id)}
                  >
                    <Trash2 size={20} color="#E53E3E" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
        
        {activeTab === 'managers' && (
          <Animated.View 
            style={styles.managersContainer}
            entering={FadeInDown.duration(300)}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Manage Branch Managers</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowAddManagerModal(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Manager</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.messageCard}>
              <Text style={styles.messageTitle}>Create Branch Manager Accounts</Text>
              <Text style={styles.messageText}>
                Create accounts for branch managers to provide them access to their respective branch inventory and sales data.
              </Text>
            </View>
            
            {/* Manager list would go here in a real app */}
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                To add a manager, click the "Add Manager" button above.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Add Branch Modal */}
      <Modal
        visible={showAddBranchModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Branch</Text>
              <TouchableOpacity onPress={() => setShowAddBranchModal(false)}>
                <X size={24} color="#1A202C" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Branch Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={newBranch.name}
                  onChangeText={(text) => setNewBranch({...newBranch, name: text})}
                  placeholder="Enter branch name"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  style={styles.formInput}
                  value={newBranch.location}
                  onChangeText={(text) => setNewBranch({...newBranch, location: text})}
                  placeholder="Enter branch location"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddBranch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Branch</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Edit Branch Modal */}
      <Modal
        visible={showEditBranchModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Branch</Text>
              <TouchableOpacity onPress={() => setShowEditBranchModal(false)}>
                <X size={24} color="#1A202C" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Branch Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={editingBranch.name}
                  onChangeText={(text) => setEditingBranch({...editingBranch, name: text})}
                  placeholder="Enter branch name"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  style={styles.formInput}
                  value={editingBranch.location}
                  onChangeText={(text) => setEditingBranch({...editingBranch, location: text})}
                  placeholder="Enter branch location"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleEditBranch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Branch</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Add Manager Modal */}
      <Modal
        visible={showAddManagerModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Branch Manager</Text>
              <TouchableOpacity onPress={() => setShowAddManagerModal(false)}>
                <X size={24} color="#1A202C" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Username</Text>
                <TextInput
                  style={styles.formInput}
                  value={newManager.username}
                  onChangeText={(text) => setNewManager({...newManager, username: text})}
                  placeholder="Enter username"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={newManager.email}
                  onChangeText={(text) => setNewManager({...newManager, email: text})}
                  placeholder="Enter email address"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={newManager.password}
                  onChangeText={(text) => setNewManager({...newManager, password: text})}
                  placeholder="Enter password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Assign to Branch</Text>
                {/* This would be a dropdown in a real app */}
                <TextInput
                  style={styles.formInput}
                  value={newManager.branchId}
                  onChangeText={(text) => setNewManager({...newManager, branchId: text})}
                  placeholder="Enter branch ID"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddManager}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Manager Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0F3460',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#0F3460',
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
  },
  profileInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 24,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#2D3748',
  },
  logoutButton: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#E53E3E',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  branchesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  managersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F3460',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  branchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  branchInfo: {
    flex: 1,
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
    marginBottom: 4,
  },
  branchManager: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
  },
  branchActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageCard: {
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  messageTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#2B6CB0',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#2C5282',
    lineHeight: 22,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
  },
  formContainer: {
    paddingVertical: 8,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4A5568',
    marginBottom: 6,
  },
  formInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#1A202C',
  },
  submitButton: {
    backgroundColor: '#0F3460',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});