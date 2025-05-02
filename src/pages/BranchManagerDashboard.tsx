import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, LogOut, ShoppingCart, Database } from 'lucide-react';
import { useAuthState } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import Button from '../components/ui/Button';
import ProductTable from '../components/inventory/ProductTable';
import SalesForm from '../components/sales/SalesForm';
import SalesTable from '../components/sales/SalesTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const BranchManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { branchId } = useParams<{ branchId: string }>();
  const { user, logout } = useAuthState();
  const { products, branchInventory, sales, loading, recordSale } = useInventory();
  
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory');
  const [showAddSale, setShowAddSale] = useState(false);

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRecordSale = async (productId: string, productName: string, quantity: number) => {
    if (!branchId) return;
    
    await recordSale(branchId, productId, productName, quantity);
    setShowAddSale(false);
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
              <h1 className="text-xl font-bold text-gray-900">Branch Inventory</h1>
              <p className="text-sm text-gray-600">{user?.branchName || `Branch ${branchId}`}</p>
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
            Branch Inventory
          </button>
          <button
            className={`py-3 px-6 font-medium flex items-center ${
              activeTab === 'sales'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('sales')}
          >
            <ShoppingCart size={18} className="mr-2" />
            Sales
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Branch Inventory</h2>
              <p className="text-sm text-gray-600 mt-1">
                View current inventory levels at your branch.
              </p>
            </div>
            
            <div className="p-6">
              <ProductTable 
                products={branchProducts} 
                onEdit={() => {}} 
                onDelete={() => {}}
                isReadOnly={true}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'sales' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Sales Records</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Track sales and manage inventory.
                </p>
              </div>
              <Button 
                variant="primary"
                onClick={() => setShowAddSale(true)}
              >
                Record New Sale
              </Button>
            </div>
            
            <div className="p-6">
              {showAddSale ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Record New Sale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SalesForm 
                      products={branchProducts}
                      onSubmit={handleRecordSale}
                    />
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddSale(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <SalesTable sales={sales} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BranchManagerDashboard;