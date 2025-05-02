import React, { useState, useEffect } from 'react';
import { BranchManager } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface BranchManagerFormProps {
  branchManager?: BranchManager;
  onSubmit: (name: string, branchNumber: string, branchLocation: string, username: string, password: string) => void;
  onCancel: () => void;
}

const BranchManagerForm: React.FC<BranchManagerFormProps> = ({ 
  branchManager, 
  onSubmit, 
  onCancel 
}) => {
  const [name, setName] = useState(branchManager?.name || '');
  const [branchNumber, setBranchNumber] = useState(branchManager?.branchNumber || '');
  const [branchLocation, setBranchLocation] = useState(branchManager?.branchLocation || '');
  const [username, setUsername] = useState(branchManager?.username || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (branchManager) {
      setName(branchManager.name);
      setBranchNumber(branchManager.branchNumber);
      setBranchLocation(branchManager.branchLocation);
      setUsername(branchManager.username);
      // Password is not prefilled for security reasons
    }
  }, [branchManager]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !branchNumber.trim() || !branchLocation.trim() || !username.trim()) {
      setError('All fields are required');
      return;
    }
    
    // Only require password for new branch managers
    if (!branchManager && !password) {
      setError('Password is required for new branch managers');
      return;
    }
    
    onSubmit(name, branchNumber, branchLocation, username, password);
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
          label="Branch Manager Name"
          id="managerName"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder="Enter manager name"
          fullWidth
          required
        />
      </div>
      
      <div>
        <Input
          label="Branch Number"
          id="branchNumber"
          value={branchNumber}
          onChange={(e) => {
            setBranchNumber(e.target.value);
            setError('');
          }}
          placeholder="Enter branch number"
          fullWidth
          required
        />
      </div>
      
      <div>
        <Input
          label="Branch Location"
          id="branchLocation"
          value={branchLocation}
          onChange={(e) => {
            setBranchLocation(e.target.value);
            setError('');
          }}
          placeholder="Enter branch location"
          fullWidth
          required
        />
      </div>
      
      <div>
        <Input
          label="Username"
          id="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError('');
          }}
          placeholder="Enter username"
          fullWidth
          required
        />
      </div>
      
      <div>
        <Input
          label={branchManager ? 'New Password (leave blank to keep current)' : 'Password'}
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          placeholder={branchManager ? 'Enter new password (optional)' : 'Enter password'}
          fullWidth
          required={!branchManager}
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {branchManager ? 'Update Branch Manager' : 'Add Branch Manager'}
        </Button>
      </div>
    </form>
  );
};

export default BranchManagerForm;