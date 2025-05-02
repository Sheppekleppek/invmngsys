import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import Button from '../components/ui/Button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-12">
          <Package size={64} className="mx-auto text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sheppek_Leppek</h1>
          <h2 className="text-xl text-gray-600">Inventory Management System</h2>
        </div>
        
        <Button 
          variant="primary"
          fullWidth
          size="lg"
          onClick={() => navigate('/login')}
          className="animate-pulse hover:animate-none transition-all duration-300"
        >
          Login
        </Button>
        
        <p className="text-gray-500 text-center mt-6 text-sm">
          © 2025 Sheppek_Leppek. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default HomePage;