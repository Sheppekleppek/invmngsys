import React, { useState } from 'react';
import { Product } from '../../types';
import Button from '../ui/Button';
import { Edit, Trash2, AlertCircle } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  isReadOnly?: boolean;
}

const ProductTable: React.FC<ProductTableProps> = ({ 
  products, 
  onEdit, 
  onDelete,
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredProducts = products.filter((product) => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.includes(searchTerm)
  );

  return (
    <div className="w-full">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by product name or ID..."
          className="w-full p-2 border border-gray-300 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Serial #</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Product ID</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Quantity</th>
              {!isReadOnly && (
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-500">{product.serialNumber}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{product.id.substring(0, 8)}...</td>
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                    <div className="flex items-center">
                      {product.name}
                      {product.quantity === 0 && (
                        <span className="ml-2">
                          <AlertCircle size={16} className="text-red-500" />
                        </span>
                      )}
                      {product.quantity > 0 && product.quantity <= 5 && (
                        <span className="ml-2">
                          <AlertCircle size={16} className="text-amber-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{product.quantity}</td>
                  {!isReadOnly && (
                    <td className="py-3 px-4 text-sm">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onEdit(product)}
                          className="flex items-center"
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => onDelete(product.id)}
                          className="flex items-center"
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isReadOnly ? 4 : 5} className="py-4 px-4 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;