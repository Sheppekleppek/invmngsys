import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Package, LogOut, ArrowLeft } from 'lucide-react';
import { db } from '../firebase/config';
import { useAuthState } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import { Product } from '../types';
import Button from '../components/ui/Button';
import ProductTable from '../components/inventory/ProductTable';
import ProductForm from '../components/inventory/ProductForm';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const BranchInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { branchId } = useParams<{ branchId: string }>();
  const { user, logout } = useAuthState();
  const { 
    products, 
    branchInventory, 
    loading, 
    addToBranchInventory, 
    updateBranchInventory, 
    removeFromBranchInventory 
  } = useInventory();
  
  const [branchName, setBranchName] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Load branch name
  React.useEffect(() => {
    const fetchBranchName = async () => {
      if (!branchId) return;
      
      try {
        const branchQuery = query(
          collection(db, 'branchManagers'), 
          where('branchNumber', '==', branchId)
        );
        const snapshot = await getDocs(branchQuery);
        
        if (!snapshot.empty) {
          setBranchName(snapshot.docs[0].data().name);
        } else {
          setBranchName(`Branch ${branchId}`);
        }
      } catch (error) {
        console.error('Error fetching branch details:', error);
        setBranchName(`Branch ${branchId}`);
      }
    };
    
    fetchBranchName();
  }, [branchId]);

  // Prepare products with branch inventory quantities
  const branchProducts = products.map(product => {
    const branchQuantity = branchId && branchInventory[branchId] 
      ? branchInventory[branchId][product.id] || 0 
      : 0;
    
    return {
      ...product,
      quantity: branchQuantity
    };
  }).filter(product => product.quantity > 0);

  // Products that can be added to branch inventory
  const availableProducts = products.filter(product => {
    const isAlreadyInBranch = branchId && branchInventory[branchId] && branchInventory[branchId][product.id];
    return product.quantity > 0 && !isAlreadyInBranch;
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleGoBack = () => {
    navigate('/main-dashboard');
  };

  const handleAddToBranch = async () => {
    if (!branchId || !selectedProduct) return;
    
    await addToBranchInventory(branchId, selectedProduct, quantity);
    setShowAddProduct(false);
    setSelectedProduct('');
    setQuantity(1);
  };

  const handleUpdateProduct = async (name: string, newQuantity: number) => {
    if (!branchId || !editingProductId) return;
    
    await updateBranchInventory(branchId, editingProductId, newQuantity);
    setEditingProductId(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!branchId) return;
    
    if (confirm('Are you sure you want to remove this product from the branch inventory?')) {
      await removeFromBranchInventory(branchId, productId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Package size={28} className="text-blue-600 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Branch Inventory Management</h1>
              <p className="text-sm text-gray-600">{branchName}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="mr-4 text-gray-600">Welcome, {user?.username || 'Manager'}!</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center"
            >
              <LogOut size={16} className="mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="flex items-center"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">{branchName} Inventory</h2>
            <Button 
              variant="primary"
              onClick={() => {
                setShowAddProduct(true);
                setEditingProductId(null);
              }}
              disabled={availableProducts.length === 0}
            >
              Add Product to Branch
            </Button>
          </div>
          
          <div className="p-6">
            {showAddProduct ? (
              <Card>
                <CardHeader>
                  <CardTitle>Add Product to Branch</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product
                      </label>
                      <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a product</option>
                        {availableProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} (Available: {product.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddProduct(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="primary"
                        onClick={handleAddToBranch}
                        disabled={!selectedProduct || quantity < 1}
                      >
                        Add to Branch
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : editingProductId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Update Product Quantity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductForm
                    product={branchProducts.find(p => p.id === editingProductId)}
                    onSubmit={(name, quantity) => handleUpdateProduct(name, quantity)}
                    onCancel={() => setEditingProductId(null)}
                  />
                </CardContent>
              </Card>
            ) : (
              <ProductTable 
                products={branchProducts}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BranchInventoryPage;