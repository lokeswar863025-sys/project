import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, QrCode, User, Phone, AlertTriangle } from 'lucide-react';
import { calculateCartTotals } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import PaymentModal from './PaymentModal';

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onPlaceOrder, tableObj }) {
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerMobile, setCustomerMobile] = useState(user?.mobile || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const totals = calculateCartTotals(cartItems);

  const validateCustomerInputs = () => {
    setErrorMsg('');
    if (!customerName.trim()) {
      setErrorMsg('Please enter your Full Name before placing order.');
      return false;
    }
    const digits = customerMobile.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      setErrorMsg('Please enter a valid mobile number with 10 to 15 digits.');
      return false;
    }
    return true;
  };

  const handleTriggerPayment = () => {
    if (validateCustomerInputs()) {
      setIsPaymentModalOpen(true);
    }
  };

  const handleTriggerPlaceOrder = () => {
    if (validateCustomerInputs()) {
      onPlaceOrder();
    }
  };

  const handlePaymentSuccess = (paymentDetails) => {
    setIsPaymentModalOpen(false);
    onPlaceOrder();
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="w-screen max-w-md bg-[#0B0B0B] border-l border-[#252525] shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#252525] flex items-center justify-between bg-[#111111]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4D00] to-[#FF7A00] flex items-center justify-center text-white shadow-md">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono uppercase">YOUR TABLE ORDER</h3>
                    <p className="text-xs text-[#FF4D00] font-mono">
                      {tableObj ? `${tableObj.name} • ${tableObj.zone}` : 'Table Assigned'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-[#050505] border border-[#252525] text-[#A1A1A1] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-[#252525]/60">
                {cartItems.length === 0 ? (
                  <div className="py-16 text-center text-[#A1A1A1] space-y-3">
                    <ShoppingBag className="w-12 h-12 text-[#252525] mx-auto" />
                    <p className="text-sm font-semibold">Your table cart is empty.</p>
                    <p className="text-xs text-[#A1A1A1]/60">Add signature starters, wagyu steak, or drinks to get started.</p>
                  </div>
                ) : (
                  <>
                    {/* CUSTOMER NAME AND MOBILE NUMBER FIELDS */}
                    <div className="pb-4 space-y-3 font-mono text-xs border-b border-[#252525]">
                      <div className="text-white font-bold uppercase tracking-wider flex items-center gap-1">
                        <span>Customer Contact Information</span>
                      </div>

                      {errorMsg && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[#A1A1A1] mb-1 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[#FF4D00]" /> Full Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full bg-[#050505] border border-[#252525] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#A1A1A1] mb-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#FF4D00]" /> Mobile Number <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="tel"
                          inputMode="tel"
                          required
                          value={customerMobile}
                          onChange={(e) => setCustomerMobile(e.target.value)}
                          placeholder="Mobile Number"
                          className="w-full bg-[#050505] border border-[#252525] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]"
                        />
                      </div>
                    </div>

                    {cartItems.map((item) => (
                      <div key={item.id} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-14 h-14 rounded-xl object-cover border border-[#252525] flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate font-mono">{item.name}</h4>
                            <span className="text-xs text-[#FF4D00] font-mono font-semibold">{item.price}</span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-[#050505] p-1.5 rounded-xl border border-[#252525]">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-[#111111] text-white flex items-center justify-center hover:text-[#FF4D00] transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-xs font-mono font-bold text-white w-5 text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-[#111111] text-white flex items-center justify-center hover:text-[#FF4D00] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="w-7 h-7 rounded-lg text-rose-400 hover:text-rose-300 ml-1 flex items-center justify-center cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Financial Totals & Action Buttons */}
              {cartItems.length > 0 && (
                <div className="p-6 bg-[#111111] border-t border-[#252525] space-y-4">
                  <div className="space-y-2 font-mono text-xs text-[#A1A1A1]">
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span className="text-white font-bold">{totals.subtotalFormatted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes & GST (5%):</span>
                      <span className="text-white font-bold">{totals.taxFormatted}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#252525] text-base text-white font-bold">
                      <span>Grand Total:</span>
                      <span className="text-[#FF4D00] text-xl">{totals.totalFormatted}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTriggerPayment}
                      className="w-full py-3.5 rounded-2xl bg-[#050505] hover:bg-[#111111] border border-[#FF4D00] text-[#FF4D00] hover:text-white font-extrabold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-[#FF4D00]" />
                      PAY VIA ONLINE QR ({totals.totalFormatted})
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTriggerPlaceOrder}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-sm tracking-wide shadow-xl shadow-[#FF4D00]/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      PLACE ORDER TO KITCHEN
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </AnimatePresence>

      {/* Online Payment QR Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={totals.totalFormatted}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}
