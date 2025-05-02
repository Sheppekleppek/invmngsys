import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ProductFormProps {
  product?: Product;
  onSubmit: (name: string, quantity: number) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  onSubmit, 
  onCancel 
}) => {
  const [name, setName] = useState(product?.name || '');
  const [quantity, setQuantity] = useState(product?.quantity.toString() || '0');
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setQuantity(product.quantity.toString());
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      setError('Please enter a valid quantity (0 or greater)');
      return;
    }
    
    onSubmit(name, parsedQuantity);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 mb-4">
          {error}
        </div>
      )}
      
      <div>
        <Input
          label="Product Name"
          id="productName"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder="Enter product name"
          fullWidth
          required
        />
      </div>
      
      <div>
        <Input
          label="Quantity"
          id="quantity"
          type="number"
          min="0"
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            setError('');
          }}
          placeholder="Enter quantity"
          fullWidth
          required
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {product ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;