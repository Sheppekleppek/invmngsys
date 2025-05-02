import React, { useState } from 'react';
import { Product } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface SalesFormProps {
  products: Product[];
  onSubmit: (productId: string, productName: string, quantity: number) => void;
}

const SalesForm: React.FC<SalesFormProps> = ({ products, onSubmit }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductId) {
      setError('Please select a product');
      return;
    }
    
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError('Please enter a valid quantity (greater than 0)');
      return;
    }
    
    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) {
      setError('Invalid product selected');
      return;
    }
    
    onSubmit(selectedProductId, selectedProduct.name, parsedQuantity);
    
    // Reset form
    setSelectedProductId('');
    setQuantity('1');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 mb-4">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => {
            setSelectedProductId(e.target.value);
            setError('');
          }}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} (Available: {product.quantity})
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <Input
          label="Quantity Sold"
          id="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            setError('');
          }}
          placeholder="Enter quantity sold"
          fullWidth
          required
        />
      </div>
      
      <div className="flex justify-end pt-4">
        <Button type="submit" variant="primary">
          Record Sale
        </Button>
      </div>
    </form>
  );
};

export default SalesForm;