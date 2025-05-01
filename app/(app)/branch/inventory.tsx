import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useInventory, Product } from '@/contexts/InventoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ShoppingCart, X, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function BranchInventory() {
  const { user } = useAuth();
  const { products, branchStock, branches, loading, recordSale } = useInventory();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current branch ID from user
  const branchId = user?.branchId || '';
  
  // Get all branch IDs except current one
  const otherBranchIds = branches
    .filter(branch => branch.id !== branchId)
    .map(branch => branch.id);
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.serialNumber.includes(searchQuery)
  );
  
  // Get branch stock for a product
  const getBranchStock = (productId: string): number => {
    const stock = branchStock.find(
      item => item.productId === productId && item.branchId === branchId
    );
    return stock ? stock.quantity : 0;
  };
  
  // Get other branches' stock for a product
  const getOtherBranchesStock = (productId: string): Array<{branchId: string, branchName: string, quantity: number}> => {
    return otherBranchIds.map(id => {
      const stock = branchStock.find(
        item => item.productId === productId && item.branchId === id
      );
      
      const branch = branches.find(b => b.id === id);
      return {
        branchId: id,
        branchName: branch?.name || 'Unknown Branch',
        quantity: stock ? stock.quantity : 0
      };
    });
  };
  
  // Handle recording a sale
  const handleRecordSale = async () => {
    if (!selectedProduct) return;
    
    try {
      setError(null);
      setIsRecording(true);
      
      const saleQuantity = parseInt(quantity, 10);
      if (isNaN(saleQuantity) || saleQuantity <= 0) {
        setError('Please enter a valid quantity');
        setIsRecording(false);
        return;
      }
      
      const currentStock = getBranchStock(selectedProduct.id);
      if (currentStock < saleQuantity) {
        setError('Insufficient stock in your branch');
        setIsRecording(false);
        return;
      }
      
      await recordSale(branchId, [
        {
          productId: selectedProduct.id,
          quantity: saleQuantity
        }
      ]);
      
      // Reset and close modal
      setQuantity('1');
      setShowSaleModal(false);
      setSelectedProduct(null);
    } catch (err: any) {
      setError(err.message || 'Failed to record sale');
    } finally {
      setIsRecording(false);
    }
  };
  
  // Open sale modal
  const openSaleModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity('1');
    setError(null);
    setShowSaleModal(true);
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => {
    const branchStock = getBranchStock(item.id);
    const otherBranchesStock = getOtherBranchesStock(item.id);
    const mainStock = item.mainStock;
    const isOutOfStock = branchStock <= 0;
    
    return (
      <Animated.View 
        style={styles.productItem}
        entering={FadeInDown.duration(300)}
      >
        <View style={styles.productInfo}>
          <Text style={styles.serialNumber}>{item.serialNumber}</Text>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          
          <View style={styles.stockContainer}>
            <Text style={[
              styles.branchStock,
              isOutOfStock ? styles.outOfStock : null
            ]}>
              Your Stock: {branchStock} {item.unit}
            </Text>
            
            {isOutOfStock && (
              <View style={styles.alternateStockContainer}>
                <Text style={styles.alternateStockLabel}>Available at:</Text>
                
                {mainStock > 0 && (
                  <Text style={styles.alternateStockItem}>
                    • Main Warehouse: {mainStock} {item.unit}
                  </Text>
                )}
                
                {otherBranchesStock.map((branch, idx) => (
                  branch.quantity > 0 ? (
                    <Text key={idx} style={styles.alternateStockItem}>
                      • {branch.branchName}: {branch.quantity} {item.unit}
                    </Text>
                  ) : null
                ))}
                
                {mainStock <= 0 && otherBranchesStock.every(b => b.quantity <= 0) && (
                  <Text style={styles.noStockAnywhere}>
                    No stock available anywhere
                  </Text>
                )}
              </View>
            )}
          </View>
          
          <Text style={styles.productPrice}>${item.price.toFixed(2)} / {item.unit}</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.saleButton,
            isOutOfStock ? styles.disabledButton : null
          ]} 
          onPress={() => !isOutOfStock && openSaleModal(item)}
          disabled={isOutOfStock}
        >
          <ShoppingCart size={20} color={isOutOfStock ? '#A0AEC0' : '#FFFFFF'} />
          <Text style={[
            styles.saleButtonText,
            isOutOfStock ? styles.disabledButtonText : null
          ]}>
            Sell
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
        <Text style={styles.headerTitle}>Branch Inventory</Text>
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
      
      <FlatList
        data={filteredProducts}
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
      
      {/* Record Sale Modal */}
      <Modal
        visible={showSaleModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Sale</Text>
              <TouchableOpacity onPress={() => setShowSaleModal(false)}>
                <X size={24} color="#1A202C" />
              </TouchableOpacity>
            </View>
            
            {selectedProduct && (
              <View style={styles.formContainer}>
                <Text style={styles.productTitle}>{selectedProduct.name}</Text>
                <Text style={styles.productSubtitle}>
                  ${selectedProduct.price.toFixed(2)} per {selectedProduct.unit}
                </Text>
                
                <View style={styles.availableStock}>
                  <Text style={styles.availableStockText}>
                    Available: {getBranchStock(selectedProduct.id)} {selectedProduct.unit}
                  </Text>
                </View>
                
                {error && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={18} color="#E53E3E" style={{ marginRight: 8 }} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Quantity to Sell</Text>
                  <TextInput
                    style={styles.formInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="Enter quantity"
                    keyboardType="number-pad"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>
                
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalValue}>
                    ${(selectedProduct.price * parseInt(quantity || '0', 10)).toFixed(2)}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleRecordSale}
                  disabled={isRecording}
                >
                  {isRecording ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Record Sale</Text>
                  )}
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
  productList: {
    padding: 16,
  },
  productItem: {
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
    marginBottom: 12,
  },
  serialNumber: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#718096',
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4A5568',
    marginBottom: 12,
  },
  stockContainer: {
    marginBottom: 12,
  },
  branchStock: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#38A169',
    marginBottom: 4,
  },
  outOfStock: {
    color: '#E53E3E',
  },
  alternateStockContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3182CE',
  },
  alternateStockLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#2D3748',
    marginBottom: 4,
  },
  alternateStockItem: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4A5568',
    marginBottom: 4,
  },
  noStockAnywhere: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#E53E3E',
    fontStyle: 'italic',
  },
  productPrice: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#2D3748',
  },
  saleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F3460',
    borderRadius: 8,
    paddingVertical: 12,
  },
  disabledButton: {
    backgroundColor: '#E2E8F0',
  },
  saleButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  disabledButtonText: {
    color: '#A0AEC0',
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
  productTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1A202C',
    marginBottom: 4,
  },
  productSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4A5568',
    marginBottom: 16,
  },
  availableStock: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38A169',
  },
  availableStockText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#2F855A',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E53E3E',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#E53E3E',
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#4A5568',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#1A202C',
  },
  submitButton: {
    backgroundColor: '#0F3460',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
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