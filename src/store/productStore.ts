import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

interface ProductStore {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: ProductInsert) => Promise<void>;
  addProducts: (products: ProductInsert[]) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      set({ products: data || [], isLoading: false });
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred while fetching products',
        isLoading: false 
      });
    }
  },

  addProduct: async (product: ProductInsert) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select(`
          *,
          category:product_categories(*)
        `)
        .single();

      if (error) {
        console.error('Error adding product:', error);
        throw error;
      }

      const products = get().products;
      set({ products: [data, ...products], isLoading: false });
    } catch (error) {
      console.error('Error in addProduct:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred while adding the product',
        isLoading: false 
      });
    }
  },

  addProducts: async (products: ProductInsert[]) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('products')
        .insert(products);

      if (error) {
        console.error('Error adding products:', error);
        throw error;
      }

      await get().fetchProducts();
    } catch (error) {
      console.error('Error in addProducts:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred while adding products',
        isLoading: false 
      });
    }
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:product_categories(*)
        `)
        .single();

      if (error) {
        console.error('Error updating product:', error);
        throw error;
      }

      const products = get().products.map(product => 
        product.id === id ? { ...product, ...data } : product
      );
      set({ products, isLoading: false });
    } catch (error) {
      console.error('Error in updateProduct:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred while updating the product',
        isLoading: false 
      });
    }
  },

  deleteProduct: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        throw error;
      }
      
      const products = get().products.filter(product => product.id !== id);
      set({ products, isLoading: false });
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred while deleting the product',
        isLoading: false 
      });
    }
  },
}));