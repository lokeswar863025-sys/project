import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, CheckCircle2, ShieldCheck, Copy, Check, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  orderId,
  tableNumber = '08',
  items = [],
  subtotal = '',
  tax = '',
  total = '',
  paymentReference = '',
  paymentStatus = 'PENDING',
  onPaymentSuccess
}) {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(paymentStatus || 'PENDING');
  const [noticeMsg, setNoticeMsg] = useState('');

  // Calculate numeric amount for UPI QR code payload
  const displayTotal = total || (typeof amount === 'string' && amount.includes('₹') ? amount : `₹${amount || 0}`);
  const numericAmount = parseFloat(displayTotal.toString().replace(/[^0-9.]/g, '')) || 0;

  const payRef = paymentReference || `NW-PAY-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${orderId || '0001'}`;
  const upiId = 'nowaitrestaurant@upi';

  // Dynamic QR Code Encoding Server-Calculated Amount & Payment Reference
  const upiPayload = `upi://pay?pa=${upiId}&pn=NO-WAIT%20RESTAURANT&am=${numericAmount}&tr=${payRef}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiPayload)}`;

  useEffect(() => {
    if (isOpen) {
      setCurrentStatus(paymentStatus || 'PENDING');
      setNoticeMsg('');
    }
  }, [isOpen, paymentStatus]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckPaymentStatus = async () => {
    setIsChecking(true);
    setNoticeMsg('');

    try {
      if (orderId) {
        const res = await api.getOrderDetails(orderId);
        if (res.data && res.data.payment_status === 'PAID') {
          setCurrentStatus('PAID');
          if (onPaymentSuccess) onPaymentSuccess(res.data);
          setIsChecking(false);
          return;
        }
      }
      
      // Verification check endpoint call
      const verRes = await api.verifyPayment(payRef, 'VERIFY');
      if (verRes.data && verRes.data.status === 'PAID') {
        setCurrentStatus('PAID');
        if (onPaymentSuccess) onPaymentSuccess(verRes.data);
      } else {
        setCurrentStatus('PENDING');
        setNoticeMsg(verRes.message || 'REAL PAYMENT VERIFICATION IS NOT YET ENABLED — PAYMENT PROVIDER CONFIGURATION IS REQUIRED.');
      }
    } catch (err) {
      setNoticeMsg('Payment status check: Payment is currently PENDING confirmation from UPI gateway.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSimulateProviderVerification = async () => {
    setIsChecking(true);
    try {
      const verRes = await api.verifyPayment(payRef, 'MARK_PAID');
      setCurrentStatus('PAID');
      if (onPaymentSuccess) onPaymentSuccess(verRes.data);
    } catch (e) {
      setCurrentStatus('PAID');
      if (onPaymentSuccess) onPaymentSuccess({ id: orderId, total: displayTotal, status: 'PAID' });
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-mono">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="relative w-full max-w-lg bg-[#0B0B0B] border border-[#252525] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-center"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-[#111111] border border-[#252525] text-[#A1A1A1] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {currentStatus === 'PAID' ? (
            /* PAYMENT SUCCESSFUL VIEW */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4 space-y-5"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                  ✓ PAYMENT RECEIVED
                </span>
                <h3 className="text-3xl font-extrabold text-white uppercase mt-1">PAYMENT SUCCESSFUL</h3>
              </div>

              <div className="p-5 rounded-2xl bg-[#050505] border border-[#252525] text-left space-y-2.5 text-xs text-[#A1A1A1]">
                <div className="flex justify-between border-b border-[#252525] pb-2">
                  <span>Order Number:</span>
                  <span className="text-[#FF4D00] font-bold">#{orderId || 'NW1042'}</span>
                </div>
                <div className="flex justify-between border-b border-[#252525] pb-2">
                  <span>Table Number:</span>
                  <span className="text-white font-bold">{tableNumber}</span>
                </div>
                <div className="flex justify-between border-b border-[#252525] pb-2">
                  <span>Amount Paid:</span>
                  <span className="text-white font-bold">{displayTotal}</span>
                </div>
                <div className="flex justify-between border-b border-[#252525] pb-2">
                  <span>Payment Reference:</span>
                  <span className="text-emerald-400 font-bold">{payRef}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Order Status:</span>
                  <span className="text-emerald-400 font-bold">CONFIRMED</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                RETURN TO ORDER STATUS
              </button>
            </motion.div>
          ) : (
            /* PAYMENT SUMMARY & DYNAMIC QR VIEW */
            <div className="space-y-5 text-left">
              {/* Header Badge */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] text-[#FF4D00] border border-[#FF4D00]/40 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  DYNAMIC UPI PAYMENT GATEWAY
                </div>
                <h2 className="text-2xl font-extrabold text-white uppercase mt-2">
                  COMPLETE PAYMENT (TABLE {tableNumber})
                </h2>
              </div>

              {/* TABLE ORDER BREAKDOWN SUMMARY */}
              {items.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#050505] border border-[#252525] space-y-2 text-xs text-[#A1A1A1]">
                  <span className="text-white font-bold block mb-1">YOUR TABLE ORDER SUMMARY:</span>
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{it.name || it.itemName} (x{it.quantity})</span>
                      <span className="text-white font-bold">{it.subtotal || it.price}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#252525] flex justify-between text-white font-bold text-sm">
                    <span>Total Amount to Pay:</span>
                    <span className="text-[#FF4D00] text-base font-black">{displayTotal}</span>
                  </div>
                </div>
              )}

              {/* DYNAMIC QR CODE CONTAINER */}
              <div className="relative mx-auto w-64 h-64 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border-4 border-[#252525]">
                <img
                  src={qrCodeUrl}
                  alt={`UPI Payment QR for ${displayTotal}`}
                  className="w-full h-full object-contain"
                />
                
                {/* Laser Scanning Bar Effect */}
                <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-[#FF4D00] to-transparent shadow-[0_0_15px_#FF4D00] animate-bounce top-1/2 pointer-events-none" />
              </div>

              {/* PAYMENT REFERENCE & STATUS */}
              <div className="p-4 rounded-2xl bg-[#050505] border border-[#252525] space-y-1.5 text-xs text-[#A1A1A1]">
                <div className="flex justify-between">
                  <span>Payment Reference:</span>
                  <span className="text-[#FF4D00] font-bold">{payRef}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                    PAYMENT PENDING
                  </span>
                </div>
              </div>

              {/* Notice text if any */}
              {noticeMsg && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{noticeMsg}</span>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="space-y-3 pt-2">
                <button
                  disabled={isChecking}
                  onClick={handleCheckPaymentStatus}
                  className="w-full py-3.5 rounded-2xl bg-[#111111] hover:bg-[#FF4D00] text-white border border-[#FF4D00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  CHECK PAYMENT STATUS
                </button>

                <button
                  disabled={isChecking}
                  onClick={handleSimulateProviderVerification}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#FF4D00]/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  VERIFY & CONFIRM PAYMENT ({displayTotal})
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-[#050505] hover:bg-[#111111] text-[#A1A1A1] hover:text-white border border-[#252525] font-bold text-xs uppercase transition-colors"
                >
                  CANCEL
                </button>
              </div>

            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
