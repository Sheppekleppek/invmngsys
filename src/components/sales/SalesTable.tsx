import React from 'react';
import { Sale } from '../../types';

interface SalesTableProps {
  sales: Sale[];
}

const SalesTable: React.FC<SalesTableProps> = ({ sales }) => {
  // Function to format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Product</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Quantity</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sales.length > 0 ? (
            sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900 font-medium">{sale.productName}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{sale.quantity}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{formatDate(sale.saleDate)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="py-4 px-4 text-center text-gray-500">
                No sales recorded
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SalesTable;