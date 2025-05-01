import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import { useAuth } from './AuthContext';

// Types
export interface Product {
  id: string;
  serialNumber: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  mainStock: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BranchStock {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  updatedAt: Timestamp;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  managerId: string;
  managerName: string;
  createdAt: Timestamp;
}

export interface Sale {
  id: string;
  branchId: string;
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
  saleDate: Timestamp;
  createdBy: string;
}

export interface MonthlySales {
  id: string;
  branchId: string;
  branchName: string;
  month: number;
  year: number;
  totalAmount: number;
  salesCount: number;
  isClosed: boolean;
  closedAt?: Timestamp;
}

interface InventoryContextType {
  products: Product[];
  branches: Branch[];
  branchStock: BranchStock[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id' | 'serialNumber' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  transferStock: (productId: string, toBranchId: string, quantity: number) => Promise<void>;
  recordSale: (branchId: string, items: Array<{productId: string, quantity: number}>) => Promise<void>;
  getProductStock: (productId: string, branchId: string) => number;
  getMonthlySales: (branchId: string, month: number, year: number) => Promise<MonthlySales | null>;
}

// Create context with default values
const InventoryContext = createContext<InventoryContextType>({
  products: [],
  branches: [],
  branchStock: [],
  loading: true,
  error: null,
  addProduct: async () => '',
  updateProduct: async () => {},
  transferStock: async () => {},
  recordSale: async () => {},
  getProductStock: () => 0,
  getMonthlySales: async () => null,
});

// Custom hook to use the inventory context
export const useInventory = () => useContext(InventoryContext);

interface InventoryProviderProps {
  children: ReactNode;
}

export function InventoryProvider({ children }: InventoryProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchStock, setBranchStock] = useState<BranchStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Load initial data when user is authenticated
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setBranches([]);
      setBranchStock([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribeProducts = onSnapshot(
      collection(firestore, 'products'),
      (snapshot) => {
        const productsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsList);
      },
      (err) => {
        console.error('Error loading products:', err);
        setError('Failed to load products data');
      }
    );

    const unsubscribeBranches = onSnapshot(
      collection(firestore, 'branches'),
      (snapshot) => {
        const branchesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Branch[];
        setBranches(branchesList);
      },
      (err) => {
        console.error('Error loading branches:', err);
        setError('Failed to load branch data');
      }
    );

    const unsubscribeStock = onSnapshot(
      collection(firestore, 'branchStock'),
      (snapshot) => {
        const stockList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BranchStock[];
        setBranchStock(stockList);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading stock:', err);
        setError('Failed to load stock data');
        setLoading(false);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeBranches();
      unsubscribeStock();
    };
  }, [user]);

  // Generate next serial number
  const generateSerialNumber = async (): Promise<string> => {
    try {
      const lastProductQuery = query(
        collection(firestore, 'products'),
        // Order by serialNumber in descending order
        // This assumes serialNumber is stored as a string
      );
      
      const snapshot = await getDocs(lastProductQuery);
      let highestSerial = 0;
      
      snapshot.forEach(doc => {
        const serialStr = doc.data().serialNumber;
        if (serialStr) {
          const serialNum = parseInt(serialStr, 10);
          if (!isNaN(serialNum) && serialNum > highestSerial) {
            highestSerial = serialNum;
          }
        }
      });
      
      // Generate next serial number (increment by 1)
      const nextSerial = highestSerial + 1;
      
      // Format with leading zeros to 6 digits
      return nextSerial.toString().padStart(6, '0');
    } catch (err) {
      console.error('Error generating serial number:', err);
      throw new Error('Failed to generate serial number');
    }
  };

  // Add new product
  const addProduct = async (product: Omit<Product, 'id' | 'serialNumber' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const serialNumber = await generateSerialNumber();
      
      const docRef = await addDoc(collection(firestore, 'products'), {
        ...product,
        serialNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (err) {
      console.error('Error adding product:', err);
      throw new Error('Failed to add product');
    }
  };

  // Update product
  const updateProduct = async (id: string, data: Partial<Product>): Promise<void> => {
    try {
      const productRef = doc(firestore, 'products', id);
      await updateDoc(productRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating product:', err);
      throw new Error('Failed to update product');
    }
  };

  // Transfer stock to branch
  const transferStock = async (productId: string, toBranchId: string, quantity: number): Promise<void> => {
    try {
      // Get product
      const productRef = doc(firestore, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        throw new Error('Product not found');
      }
      
      const productData = productSnap.data() as Product;
      
      if (productData.mainStock < quantity) {
        throw new Error('Insufficient stock in main warehouse');
      }
      
      // Check if branch stock record exists
      const branchStockQuery = query(
        collection(firestore, 'branchStock'),
        where('productId', '==', productId),
        where('branchId', '==', toBranchId)
      );
      
      const branchStockSnap = await getDocs(branchStockQuery);
      
      // Update or create branch stock
      if (!branchStockSnap.empty) {
        // Update existing record
        const stockDoc = branchStockSnap.docs[0];
        const currentQuantity = stockDoc.data().quantity || 0;
        
        await updateDoc(doc(firestore, 'branchStock', stockDoc.id), {
          quantity: currentQuantity + quantity,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new record
        await addDoc(collection(firestore, 'branchStock'), {
          productId,
          branchId: toBranchId,
          quantity,
          updatedAt: serverTimestamp()
        });
      }
      
      // No need to update main stock as it's only deducted when items are sold
    } catch (err) {
      console.error('Error transferring stock:', err);
      throw new Error('Failed to transfer stock');
    }
  };

  // Record a sale
  const recordSale = async (branchId: string, items: Array<{productId: string, quantity: number}>): Promise<void> => {
    try {
      // For each item in the sale
      for (const item of items) {
        const { productId, quantity } = item;
        
        // Get product details
        const productRef = doc(firestore, 'products', productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
          throw new Error(`Product with ID ${productId} not found`);
        }
        
        const productData = productSnap.data() as Product;
        
        // Check if branch has enough stock
        const branchStockQuery = query(
          collection(firestore, 'branchStock'),
          where('productId', '==', productId),
          where('branchId', '==', branchId)
        );
        
        const branchStockSnap = await getDocs(branchStockQuery);
        
        if (branchStockSnap.empty) {
          throw new Error(`Product ${productData.name} is not available in this branch`);
        }
        
        const stockDoc = branchStockSnap.docs[0];
        const currentBranchQuantity = stockDoc.data().quantity || 0;
        
        if (currentBranchQuantity < quantity) {
          throw new Error(`Insufficient stock for ${productData.name} in this branch`);
        }
        
        // Update branch stock
        await updateDoc(doc(firestore, 'branchStock', stockDoc.id), {
          quantity: currentBranchQuantity - quantity,
          updatedAt: serverTimestamp()
        });
        
        // Update main warehouse stock
        await updateDoc(productRef, {
          mainStock: productData.mainStock - quantity,
          updatedAt: serverTimestamp()
        });
        
        // Record the sale
        await addDoc(collection(firestore, 'sales'), {
          branchId,
          productId,
          productName: productData.name,
          quantity,
          amount: productData.price * quantity,
          saleDate: serverTimestamp(),
          createdBy: user?.uid || 'unknown'
        });
        
        // Update or create monthly sales record
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();
        
        const monthlySalesQuery = query(
          collection(firestore, 'monthlySales'),
          where('branchId', '==', branchId),
          where('month', '==', currentMonth),
          where('year', '==', currentYear)
        );
        
        const monthlySalesSnap = await getDocs(monthlySalesQuery);
        
        if (!monthlySalesSnap.empty) {
          // Update existing monthly record
          const monthlySaleDoc = monthlySalesSnap.docs[0];
          const currentData = monthlySaleDoc.data();
          
          await updateDoc(doc(firestore, 'monthlySales', monthlySaleDoc.id), {
            totalAmount: (currentData.totalAmount || 0) + (productData.price * quantity),
            salesCount: (currentData.salesCount || 0) + 1
          });
        } else {
          // Get branch name
          const branchRef = doc(firestore, 'branches', branchId);
          const branchSnap = await getDoc(branchRef);
          let branchName = 'Unknown Branch';
          
          if (branchSnap.exists()) {
            branchName = branchSnap.data().name;
          }
          
          // Create new monthly record
          await addDoc(collection(firestore, 'monthlySales'), {
            branchId,
            branchName,
            month: currentMonth,
            year: currentYear,
            totalAmount: productData.price * quantity,
            salesCount: 1,
            isClosed: false
          });
        }
      }
    } catch (err) {
      console.error('Error recording sale:', err);
      throw new Error('Failed to record sale');
    }
  };

  // Get product stock for a specific branch
  const getProductStock = (productId: string, branchId: string): number => {
    const stockItem = branchStock.find(
      item => item.productId === productId && item.branchId === branchId
    );
    return stockItem ? stockItem.quantity : 0;
  };

  // Get monthly sales for a branch
  const getMonthlySales = async (branchId: string, month: number, year: number): Promise<MonthlySales | null> => {
    try {
      const monthlySalesQuery = query(
        collection(firestore, 'monthlySales'),
        where('branchId', '==', branchId),
        where('month', '==', month),
        where('year', '==', year)
      );
      
      const snapshot = await getDocs(monthlySalesQuery);
      
      if (snapshot.empty) {
        return null;
      }
      
      const docData = snapshot.docs[0].data();
      return {
        id: snapshot.docs[0].id,
        ...docData
      } as MonthlySales;
    } catch (err) {
      console.error('Error getting monthly sales:', err);
      throw new Error('Failed to retrieve monthly sales data');
    }
  };

  const value = {
    products,
    branches,
    branchStock,
    loading,
    error,
    addProduct,
    updateProduct,
    transferStock,
    recordSale,
    getProductStock,
    getMonthlySales
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}