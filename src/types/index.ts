export interface User {
  id: string;
  username: string;
  role: 'main-manager' | 'branch-manager';
  branchId?: string;
  branchName?: string;
  branchLocation?: string;
}

export interface Product {
  id: string;
  serialNumber: number;
  name: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchManager {
  id: string;
  name: string;
  branchNumber: string;
  branchLocation: string;
  username: string;
  password: string; // This would be hashed and stored securely in a real app
  createdAt: Date;
}

export interface BranchInventory {
  branchId: string;
  productId: string;
  quantity: number;
}

export interface Sale {
  id: string;
  branchId: string;
  productId: string;
  productName: string;
  quantity: number;
  saleDate: Date;
}

export interface SalesReport {
  branchId: string;
  month: number;
  year: number;
  totalSales: number;
  details: Sale[];
}