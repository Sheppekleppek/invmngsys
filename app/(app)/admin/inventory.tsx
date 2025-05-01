import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useInventory, Product } from '@/contexts/InventoryContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Edit, ArrowDown, ArrowUp, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function AdminInventory() {
  const { products, addProduct, updateProduct, loading } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form state for new product
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    unit: '',
    mainStock: '',
  });
  
  // Form state for editing product
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    price: '',
    unit: '',
    mainStock: '',
  });
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.serialNumber.includes(searchQuery)
  );
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      return sortOrder === 'asc'
        ? a.mainStock - b.mainStock
        : b.mainStock - a.mainStock;
    }
  });
  
  // Toggle sort order
  const toggleSort = (field: 'name' | 'stock') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Handle adding a new product
  const handleAddProduct = async () => {
    try {
      await addProduct({
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        unit: newProduct.unit,
        mainStock: parseInt(newProduct.mainStock, 10),
      });
      
      // Reset form and close modal
      setNewProduct({
        name: '',
        category: '',
        price: '',
        unit: '',
        mainStock: '',
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding product:', error);
      // Handle error (show alert, etc.)
    }
  };
  
  // Handle editing a product
  const handleEditProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      await updateProduct(selectedProduct.id, {
        name: editForm.name,
        category: editForm.category,
        price: parseFloat(editForm.price),
        unit: editForm.unit,
        mainStock: parseInt(editForm.mainStock, 10),
      });
      
      // Close modal
      setShowEditModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      // Handle error (show alert, etc.)
    }
  };
  
  // Open edit modal with selected product
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      unit: product.unit,
      mainStock: product.mainStock.toString(),
    });
    setShowEditModal(true);
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <Animated.View 
      style={styles.productItem}
      entering={FadeInDown.duration(300)}
    >
      <View style={styles.productInfo}>
        <Text style={styles.serialNumber}>{item.serialNumber}</Text>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <View style={styles.productDetails}>
          <Text style={styles.productPrice}>${item.price.toFixed(2)} / {item.unit}</Text>
          <Text style={[
            styles.productStock, 
            item.mainStock < 10 ? styles.lowStock : null
          ]}>
            Stock: {item.mainStock}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.editButton} 
        onPress={() => openEditModal(item)}
      >
        <Edit size={20} color="#0F3460" />
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F3460" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#718096" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#718096"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#718096" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        
        <TouchableOpacity 
          style={[
            styles.sortButton, 
            sortBy === 'name' ? styles.activeSortButton : {}
          ]}
          onPress={() => toggleSort('name')}
        >
          <Text style={[
            styles.sortButtonText,
            sortBy === 'name' ? styles.activeSortButtonText : {}
          ]}>
            Name
          </Text>
          {sortBy === 'name' && (
            sortOrder === 'asc' ? 
              <ArrowUp size={16} color="#0F3460" /> : 
              <ArrowDown size={16} color="#0F3460" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.sortButton, 
            sortBy === 'stock' ? styles.activeSortButton : {}
          ]}
          onPress={() => toggleSort('stock')}
        >
          <Text style={[
            styles.sortButtonText,
            sortBy === 'stock' ? styles.activeSortButtonText : {}
          ]}>
            Stock
          </Text>
          {sortBy === 'stock' && (
            sortOrder === 'asc' ? 
              <ArrowUp size={16} color="#0F3460" /> : 
              <ArrowDown size={16} color="#0F3460" />
          )}
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={sortedProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No products match your search' : 'No products found'}
            </Text>
          </View>
        }
      />
      
      {/* Add Product Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#1A202C" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Product Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({...newProduct, name: text})}
                  placeholder="Enter product name"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Category</Text>
                <TextInput
                  style={styles.formInput}
                  value={newProduct.category}
                  onChangeText={(text) => setNewProduct({...newProduct, category: text})}
                  placeholder="Enter category"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Price</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newProduct.price}
                    onChangeText={(text) => setNewProduct({...newProduct, price: text})}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>
                
                <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>Unit</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newProduct.unit}
                    onChangeText={(text) => setNewProduct({...newProduct, unit: text})}
                    placeholder="e.g. kg, pcs"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Initial Stock</Text>
                <TextInput
                  style={styles.formInput}
                  value={newProduct.mainStock}
                  onChangeText={(text) => setNewProduct({...newProduct, mainStock: text})}
                  placeholder="Enter quantity"
                  keyboardType="number-pad"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddProduct}
              >
                <Text style={styles.submitButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Edit Product Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Product</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color="#1A202C" />
              </TouchableOpacity>
            </View>
            
            {selectedProduct && (
              <View style={styles.formContainer}>
                <View style={styles.serialNumberDisplay}>
                  <Text style={styles.serialNumberLabel}>Serial Number:</Text>
                  <Text style={styles.serialNumberValue}>{selectedProduct.serialNumber}</Text>
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Product Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.name}
                    onChangeText={(text) => setEditForm({...editForm, name: text})}
                    placeholder="Enter product name"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Category</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.category}
                    onChangeText={(text) => setEditForm({...editForm, category: text})}
                    placeholder="Enter category"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>
                
                <View style={styles.formRow}>
                  <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.formLabel}>Price</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editForm.price}
                      onChangeText={(text) => setEditForm({...editForm, price: text})}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                  
                  <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.formLabel}>Unit</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editForm.unit}
                      onChangeText={(text) => setEditForm({...editForm, unit: text})}
                      placeholder="e.g. kg, pcs"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Main Warehouse Stock</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.mainStock}
                    onChangeText={(text) => setEditForm({...editForm, mainStock: text})}
                    placeholder="Enter quantity"
                    keyboardType="number-pad"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleEditProduct}
                >
                  <Text style={styles.submitButtonText}>Update Product</Text>
                </TouchableOpacity>
              </View>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F3460',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#1A202C',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sortLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
    marginRight: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F1F5F9',
  },
  activeSortButton: {
    backgroundColor: '#E6F0FF',
  },
  sortButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4A5568',
    marginRight: 4,
  },
  activeSortButtonText: {
    color: '#0F3460',
    fontFamily: 'Poppins-SemiBold',
  },
  productList: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  productInfo: {
    flex: 1,
  },
  serialNumber: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4A5568',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#2D3748',
  },
  productStock: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#38A169',
  },
  lowStock: {
    color: '#E53E3E',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
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
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
  serialNumberDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  serialNumberLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4A5568',
    marginRight: 8,
  },
  serialNumberValue: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#0F3460',
  },
});