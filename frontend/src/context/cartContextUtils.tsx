import { createContext } from 'react';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  discount?: number;
  imgName: string;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (product: { productId: number; name: string; price: number; discount?: number; imgName: string }, quantity: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
