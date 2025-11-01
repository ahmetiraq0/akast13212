import React, { useState, useEffect } from 'react';
import { PricingPlan } from '../types';

const migrateCustomers = (customers: any[]): any[] => {
  let needsUpdate = false;
  const migrated = customers.map(c => {
    if (!c.products || !Array.isArray(c.products)) return c;
    
    let customerNeedsUpdate = false;
    const newProducts = c.products.map(p => {
      let updatedProduct = { ...p };
      let productNeedsUpdate = false;

      // Migration for amountPaid
      if (p.installments && Array.isArray(p.installments)) {
        const newInstallments = p.installments.map(i => {
          if (i.amountPaid === undefined) {
            productNeedsUpdate = true;
            return { ...i, amountPaid: i.status === 'paid' ? i.amount : 0 };
          }
          return i;
        });
        if (productNeedsUpdate) {
          updatedProduct.installments = newInstallments;
        }
      }

      // Migration for portalId
      if (updatedProduct.portalId === undefined) {
        productNeedsUpdate = true;
        // Generate a unique ID for existing items
        updatedProduct.portalId = 'p' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(-5) + p.id.slice(-4);
      }
      
      if (productNeedsUpdate) {
        customerNeedsUpdate = true;
      }
      
      return updatedProduct;
    });
    
    if (customerNeedsUpdate) {
        needsUpdate = true;
        return { ...c, products: newProducts };
    }

    return c;
  });

  if (needsUpdate) {
    console.log("Migrating customer data structure.");
  }
  return migrated;
}

const migrateCatalogProducts = (products: any[]): any[] => {
  let needsUpdate = false;
  const migrated = products.map(p => {
    if (p.plans === undefined) {
      needsUpdate = true;
      const defaultPlan: PricingPlan = {
        id: 'plan_' + Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: 'الخطة الافتراضية',
        description: 'خطة السعر الأساسية للمنتج.',
        totalPrice: p.totalPrice || 0,
        downPayment: 0,
        installmentsCount: 12, // A sensible default
      };
      return { ...p, plans: [defaultPlan] };
    }
    return p;
  });

  if (needsUpdate) {
    console.log("Migrating catalog products data structure to include pricing plans.");
  }
  return migrated;
};


function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      let value = item ? JSON.parse(item) : initialValue;
      
      if (key === 'customers' && Array.isArray(value)) {
          value = migrateCustomers(value);
      }
      if (key === 'catalogProducts' && Array.isArray(value)) {
          value = migrateCatalogProducts(value);
      }

      return value;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        let value = JSON.parse(item);
         if (key === 'customers' && Array.isArray(value)) {
            value = migrateCustomers(value);
        }
        if (key === 'catalogProducts' && Array.isArray(value)) {
            value = migrateCatalogProducts(value);
        }
        setStoredValue(value);
      }
    } catch (error) {
        console.error(error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;