import { useState } from 'react';
import axios from 'axios';
import { useCart } from '../../context/useCart';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/config';

export default function CartDrawer() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, total, isOpen, closeCart } = useCart();
  const { darkMode } = useTheme();
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckoutStatus('loading');
    setErrorMessage('');

    const orderId = Date.now();
    const order = {
      orderId,
      branchId: 1,
      orderDate: new Date().toISOString(),
      status: 'pending',
    };

    try {
      await axios.post(`${api.baseURL}${api.endpoints.orders}`, order);

      await Promise.all(
        items.map((item, index) =>
          axios.post(`${api.baseURL}${api.endpoints.orderDetails}`, {
            orderDetailId: orderId * 1000 + index,
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: parseFloat((item.price * (1 - (item.discount ?? 0))).toFixed(2)),
          })
        )
      );

      clearCart();
      setCheckoutStatus('success');
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutStatus('error');
      setErrorMessage('Checkout failed. Please try again.');
    }
  };

  const resetStatus = () => {
    setCheckoutStatus('idle');
    setErrorMessage('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col shadow-2xl transition-colors duration-300 ${
          darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h2 className="text-xl font-bold">Your Cart</h2>
          <button
            onClick={closeCart}
            className={`p-2 rounded-full transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {checkoutStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold">Order placed successfully!</p>
              <button
                onClick={() => { resetStatus(); closeCart(); }}
                className="px-6 py-2 bg-primary hover:bg-accent text-white rounded-lg transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your cart is empty</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map(item => {
                const effectivePrice = item.price * (1 - (item.discount ?? 0));
                return (
                  <li
                    key={item.productId}
                    className={`flex gap-4 py-4 border-b ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={`/${item.imgName}`}
                      alt={item.name}
                      className={`w-16 h-16 object-contain rounded ${
                        darkMode ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-primary font-semibold">${effectivePrice.toFixed(2)}</p>
                      <div
                        className={`flex items-center space-x-2 mt-2 ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        } rounded-lg p-1 w-fit`}
                      >
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className={`w-7 h-7 flex items-center justify-center rounded ${
                            darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                          } transition-colors`}
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <span aria-hidden="true">-</span>
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className={`w-7 h-7 flex items-center justify-center rounded ${
                            darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                          } transition-colors`}
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <p className="font-semibold">${(effectivePrice * item.quantity).toFixed(2)}</p>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className={`text-sm transition-colors ${
                          darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                        }`}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && checkoutStatus !== 'success' && (
          <div
            className={`px-6 py-4 border-t space-y-3 ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between text-sm">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {checkoutStatus === 'error' && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}
            <button
              onClick={handleCheckout}
              disabled={checkoutStatus === 'loading'}
              className="w-full py-3 bg-primary hover:bg-accent text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {checkoutStatus === 'loading' ? 'Placing Order…' : 'Checkout'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
