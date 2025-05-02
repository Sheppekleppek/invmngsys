import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { Package, LogOut, Users, Database } from 'lucide-react';
import { db } from '../firebase/config';
import { useAuthState } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import { Product, BranchManager } from '../types';
import Button from '../components/ui/Button';
import ProductTable from '../components/inventory/ProductTable';
import ProductForm from '../components/inventory/ProductForm';
import BranchManagerList from '../components/branchManagers/BranchManagerList';
import BranchManagerForm from '../components/branchManagers/BranchManagerForm';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const MainManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, createBranchManager } = useAuthState();
  const { products, loading, addProduct, updateProduct, deleteProduct } = useInventory();
  
  const [activeTab, setActiveTab] = useState<'inventory' | 'managers'>('inventory');
  const [branchManagers, setBranchManagers] = useState<BranchManager[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddManager, setShowAddManager] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingManager, setEditingManager] = useState<BranchManager | null>(null);

  // Load branch managers
  useEffect(() => {
    const fetchBranchManagers = async () => {
      try {
        const branchManagersRef = collection(db, 'branchManagers');
        const snapshot = await getDocs(branchManagersRef);
        
        const managersList: BranchManager[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          managersList.push({
            id: doc.id,
            name: data.name,
            branchNumber: data.branchNumber,
            branchLocation: data.branchLocation,
            username: data.username,
            password: '', // We don't retrieve passwords
            createdAt: data.createdAt.toDate()
          });
        });
        
        setBranchManagers(managersList);
      } catch (error) {
        console.error('Error fetching branch managers:', error);
      }
    };
    
    fetchBranchManagers();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAddProduct = async (name: string, quantity: number) => {
    await addProduct(name, quantity);
    setShowAddProduct(false);
  };

  const handleUpdateProduct = async (name: string, quantity: number) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, name, quantity);
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(productId);
    }
  };

  const handleAddManager = async (
    name: string, 
    branchNumber: string, 
    branchLocation: string, 
    username: string, 
    password: string
  ) => {
    await createBranchManager(name, branchNumber, branchLocation, username, password);
    setShowAddManager(false);
  };

  const handleUpdateManager = async (
    name: string, 
    branchNumber: string, 
    branchLocation: string, 
    username: string, 
    password: string
  ) => {
    // This would need to be implemented with Firebase
    console.log('Update manager not implemented yet');
    setEditingManager(null);
  };

  const handleDeleteManager = async (managerId: string) => {
    if (confirm('Are you sure you want to delete this branch manager?')) {
      // This would need to be implemented with Firebase
      console.log('Delete manager not implemented yet');
    }
  };

  const handleViewBranch = (branchId: string) => {
    navigate(`/branch-inventory/${branchId}`);
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
            <h1 className="text-xl font-bold text-gray-900">Inventory Management System</h1>
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
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 font-medium flex items-center ${
              activeTab === 'inventory'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('inventory')}
          >
            <Database size={18} className="mr-2" />
            Main Warehouse Inventory
          </button>
          <button
            className={`py-3 px-6 font-medium flex items-center ${
              activeTab === 'managers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('managers')}
          >
            <Users size={18} className="mr-2" />
            Branch Managers
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Main Warehouse Inventory</h2>
              <Button 
                variant="primary"
                onClick={() => {
                  setShowAddProduct(true);
                  setEditingProduct(null);
                }}
              >
                Add New Product
              </Button>
            </div>
            
            <div className="p-6">
              {showAddProduct || editingProduct ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProductForm 
                      product={editingProduct || undefined}
                      onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
                      onCancel={() => {
                        setShowAddProduct(false);
                        setEditingProduct(null);
                      }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <ProductTable 
                  products={products} 
                  onEdit={(product) => {
                    setEditingProduct(product);
                    setShowAddProduct(false);
                  }}
                  onDelete={handleDeleteProduct}
                />
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'managers' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Branch Managers</h2>
              <Button 
                variant="primary"
                onClick={() => {
                  setShowAddManager(true);
                  setEditingManager(null);
                }}
              >
                Add New Branch Manager
              </Button>
            </div>
            
            <div className="p-6">
              {showAddManager || editingManager ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingManager ? 'Edit Branch Manager' : 'Add New Branch Manager'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BranchManagerForm 
                      branchManager={editingManager || undefined}
                      onSubmit={editingManager ? handleUpdateManager : handleAddManager}
                      onCancel={() => {
                        setShowAddManager(false);
                        setEditingManager(null);
                      }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <BranchManagerList 
                  branchManagers={branchManagers}
                  onEdit={(manager) => {
                    setEditingManager(manager);
                    setShowAddManager(false);
                  }}
                  onDelete={handleDeleteManager}
                  onViewBranch={handleViewBranch}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MainManagerDashboard;