import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  getDocs, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product, BranchInventory, Sale } from '../types';
import { useAuthState } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface InventoryContextType {
  products: Product[];
  branchInventory: { [branchId: string]: { [productId: string]: number } };
  sales: Sale[];
  loading: boolean;
  addProduct: (name: string, quantity: number) => Promise<void>;
  updateProduct: (id: string, name: string, quantity: number) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addToBranchInventory: (branchId: string, productId: string, quantity: number) => Promise<void>;
  updateBranchInventory: (branchId: string, productId: string, quantity: number) => Promise<void>;
  removeFromBranchInventory: (branchId: string, productId: string) => Promise<void>;
  recordSale: (branchId: string, productId: string, productName: string, quantity: number) => Promise<void>;
  getAvailableInventory: (productId: string) => Promise<{location: string, quantity: number}[]>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthState();
  const [products, setProducts] = useState<Product[]>([]);
  const [branchInventory, setBranchInventory] = useState<{ [branchId: string]: { [productId: string]: number } }>({});
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen for product changes
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const productsList: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        productsList.push({
          id: doc.id,
          serialNumber: data.serialNumber,
          name: data.name,
          quantity: data.quantity,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        });
      });
      setProducts(productsList.sort((a, b) => a.serialNumber - b.serialNumber));
    });

    return () => unsubscribe();
  }, []);

  // Listen for branch inventory changes
  useEffect(() => {
    const branchInventoryRef = collection(db, 'branchInventory');
    const unsubscribe = onSnapshot(branchInventoryRef, (snapshot) => {
      const inventoryByBranch: { [branchId: string]: { [productId: string]: number } } = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!inventoryByBranch[data.branchId]) {
          inventoryByBranch[data.branchId] = {};
        }
        inventoryByBranch[data.branchId][data.productId] = data.quantity;
      });
      
      setBranchInventory(inventoryByBranch);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen for sales changes for the current branch manager (if applicable)
  useEffect(() => {
    if (!user || user.role !== 'branch-manager' || !user.branchId) return;

    const salesRef = collection(db, 'sales');
    const branchSalesQuery = query(salesRef, where('branchId', '==', user.branchId));
    
    const unsubscribe = onSnapshot(branchSalesQuery, (snapshot) => {
      const salesList: Sale[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        salesList.push({
          id: doc.id,
          branchId: data.branchId,
          productId: data.productId,
          productName: data.productName,
          quantity: data.quantity,
          saleDate: data.saleDate.toDate()
        });
      });
      setSales(salesList.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime()));
    });

    return () => unsubscribe();
  }, [user]);

  const addProduct = async (name: string, quantity: number) => {
    try {
      // Get the next serial number
      const maxSerialNumber = products.length > 0 
        ? Math.max(...products.map(p => p.serialNumber)) 
        : 0;
      
      const newProduct = {
        serialNumber: maxSerialNumber + 1,
        name,
        quantity,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'products'), newProduct);
      toast.success(`Product "${name}" added successfully`);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
      throw error;
    }
  };

  const updateProduct = async (id: string, name: string, quantity: number) => {
    try {
      await updateDoc(doc(db, 'products', id), {
        name,
        quantity,
        updatedAt: serverTimestamp()
      });
      toast.success(`Product "${name}" updated successfully`);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted successfully');
      
      // Delete from branch inventories
      const branchInventoryRef = collection(db, 'branchInventory');
      const q = query(branchInventoryRef, where('productId', '==', id));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      throw error;
    }
  };

  const addToBranchInventory = async (branchId: string, productId: string, quantity: number) => {
    try {
      // Create a unique ID for the branch inventory item
      const inventoryId = `${branchId}_${productId}`;
      
      await setDoc(doc(db, 'branchInventory', inventoryId), {
        branchId,
        productId,
        quantity
      });
      
      // Update main warehouse inventory
      await updateDoc(doc(db, 'products', productId), {
        quantity: increment(-quantity),
        updatedAt: serverTimestamp()
      });
      
      toast.success(`Product added to branch inventory`);
    } catch (error) {
      console.error('Error adding to branch inventory:', error);
      toast.error('Failed to add product to branch inventory');
      throw error;
    }
  };

  const updateBranchInventory = async (branchId: string, productId: string, quantity: number) => {
    try {
      const inventoryId = `${branchId}_${productId}`;
      const inventoryRef = doc(db, 'branchInventory', inventoryId);
      
      // Get current quantity
      const inventorySnap = await getDocs(
        query(collection(db, 'branchInventory'), 
        where('branchId', '==', branchId), 
        where('productId', '==', productId))
      );
      
      let currentQuantity = 0;
      if (!inventorySnap.empty) {
        currentQuantity = inventorySnap.docs[0].data().quantity;
      }
      
      // Update branch inventory
      await setDoc(inventoryRef, {
        branchId,
        productId,
        quantity
      });
      
      // Update main warehouse inventory (adjust the difference)
      const quantityDifference = currentQuantity - quantity;
      if (quantityDifference !== 0) {
        await updateDoc(doc(db, 'products', productId), {
          quantity: increment(quantityDifference),
          updatedAt: serverTimestamp()
        });
      }
      
      toast.success('Branch inventory updated successfully');
    } catch (error) {
      console.error('Error updating branch inventory:', error);
      toast.error('Failed to update branch inventory');
      throw error;
    }
  };

  const removeFromBranchInventory = async (branchId: string, productId: string) => {
    try {
      const inventoryId = `${branchId}_${productId}`;
      
      // Get current quantity
      const inventorySnap = await getDocs(
        query(collection(db, 'branchInventory'), 
        where('branchId', '==', branchId), 
        where('productId', '==', productId))
      );
      
      let currentQuantity = 0;
      if (!inventorySnap.empty) {
        currentQuantity = inventorySnap.docs[0].data().quantity;
      }
      
      // Delete branch inventory
      await deleteDoc(doc(db, 'branchInventory', inventoryId));
      
      // Return quantity to main warehouse
      await updateDoc(doc(db, 'products', productId), {
        quantity: increment(currentQuantity),
        updatedAt: serverTimestamp()
      });
      
      toast.success('Product removed from branch inventory');
    } catch (error) {
      console.error('Error removing from branch inventory:', error);
      toast.error('Failed to remove product from branch inventory');
      throw error;
    }
  };

  const recordSale = async (branchId: string, productId: string, productName: string, quantity: number) => {
    try {
      // Add sale record
      await addDoc(collection(db, 'sales'), {
        id: uuidv4(),
        branchId,
        productId,
        productName,
        quantity,
        saleDate: serverTimestamp()
      });
      
      // Decrease branch inventory
      const inventoryId = `${branchId}_${productId}`;
      await updateDoc(doc(db, 'branchInventory', inventoryId), {
        quantity: increment(-quantity)
      });
      
      toast.success('Sale recorded successfully');
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error('Failed to record sale');
      throw error;
    }
  };

  const getAvailableInventory = async (productId: string) => {
    try {
      const availableInventory: {location: string, quantity: number}[] = [];
      
      // Check main warehouse
      const productDoc = await getDocs(query(collection(db, 'products'), where('id', '==', productId)));
      if (!productDoc.empty && productDoc.docs[0].data().quantity > 0) {
        availableInventory.push({
          location: 'Main Warehouse',
          quantity: productDoc.docs[0].data().quantity
        });
      }
      
      // Check branches
      const branchInventorySnap = await getDocs(
        query(collection(db, 'branchInventory'), where('productId', '==', productId))
      );
      
      // Get branch names
      const branchPromises = branchInventorySnap.docs
        .filter(doc => doc.data().quantity > 0)
        .map(async (doc) => {
          const data = doc.data();
          const branchId = data.branchId;
          
          const branchSnap = await getDocs(
            query(collection(db, 'branchManagers'), where('branchNumber', '==', branchId))
          );
          
          let locationName = `Branch ${branchId}`;
          if (!branchSnap.empty) {
            locationName = branchSnap.docs[0].data().name;
          }
          
          return {
            location: locationName,
            quantity: data.quantity
          };
        });
      
      const branchResults = await Promise.all(branchPromises);
      availableInventory.push(...branchResults);
      
      return availableInventory;
    } catch (error) {
      console.error('Error getting available inventory:', error);
      toast.error('Failed to get available inventory');
      throw error;
    }
  };

  const value = {
    products,
    branchInventory,
    sales,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    addToBranchInventory,
    updateBranchInventory,
    removeFromBranchInventory,
    recordSale,
    getAvailableInventory
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};