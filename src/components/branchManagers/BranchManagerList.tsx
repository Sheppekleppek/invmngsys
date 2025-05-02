import React from 'react';
import { BranchManager } from '../../types';
import Button from '../ui/Button';
import { Edit, Trash2, ExternalLink } from 'lucide-react';

interface BranchManagerListProps {
  branchManagers: BranchManager[];
  onEdit: (branchManager: BranchManager) => void;
  onDelete: (branchManagerId: string) => void;
  onViewBranch: (branchId: string) => void;
}

const BranchManagerList: React.FC<BranchManagerListProps> = ({ 
  branchManagers, 
  onEdit, 
  onDelete,
  onViewBranch
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Name</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Branch #</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Location</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Username</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {branchManagers.length > 0 ? (
            branchManagers.map((manager) => (
              <tr key={manager.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                  <button 
                    onClick={() => onViewBranch(manager.branchNumber)}
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    {manager.name}
                    <ExternalLink size={14} className="ml-1" />
                  </button>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">{manager.branchNumber}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{manager.branchLocation}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{manager.username}</td>
                <td className="py-3 px-4 text-sm">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEdit(manager)}
                      className="flex items-center"
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => onDelete(manager.id)}
                      className="flex items-center"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                No branch managers found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BranchManagerList;