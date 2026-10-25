import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Flame, Utensils, CheckCircle2, Clock } from 'lucide-react';
import { ORDER_STATUS } from '../services/orderService';

const STATUS_STEPS = [
  { key: ORDER_STATUS.RECEIVED, label: 'Order Received', icon: Check, description: 'Sent to kitchen display' },
  { key: ORDER_STATUS.PREPARING, label: 'Preparing', icon: Flame, description: 'Chef crafting your order' },
  { key: ORDER_STATUS.READY, label: 'Ready', icon: Utensils, description: 'Plated and ready for server' },
  { key: ORDER_STATUS.SERVED, label: 'Served', icon: CheckCircle2, description: 'Delivered to your table' }
];

export default function OrderStatusTracker({ currentStatus = ORDER_STATUS.RECEIVED, onStatusChange }) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const idx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
    if (idx !== -1) {
      setActiveStepIndex(idx);
    }
  }, [currentStatus]);

  // Demo status advancement trigger
  const handleAdvanceStep = () => {
    const nextIdx = (activeStepIndex + 1) % STATUS_STEPS.length;
    setActiveStepIndex(nextIdx);
    if (onStatusChange) {
      onStatusChange(STATUS_STEPS[nextIdx].key);
    }
  };

  return (
    <div className="bg-[#111111] p-6 sm:p-8 rounded-3xl border border-[#252525] shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#FF4D00] animate-ping" />
          <span className="text-xs font-mono font-extrabold uppercase text-white tracking-wider">
            LIVE KITCHEN DISPATCH STATUS
          </span>
        </div>
        <span className="text-xs font-mono text-[#FF7A00] bg-[#050505] px-3 py-1 rounded-full border border-[#252525]">
          REAL-TIME SOCKET
        </span>
      </div>

      {/* Progress Steps Grid */}
      <div className="relative grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
        {STATUS_STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;
          const isPending = idx > activeStepIndex;

          return (
            <div
              key={step.key}
              className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                isCurrent
                  ? 'bg-[#FF4D00]/15 border-[#FF4D00] shadow-lg shadow-[#FF4D00]/20'
                  : isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-[#050505] border-[#252525] opacity-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isCurrent
                        ? 'bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white shadow-md'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#111111] text-[#A1A1A1] border border-[#252525]'
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>

                  <span className="text-[10px] font-mono font-extrabold uppercase text-[#A1A1A1]">
                    {isDone ? 'COMPLETED' : isCurrent ? 'IN PROGRESS' : 'QUEUED'}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white font-mono">{step.label}</h4>
                <p className="text-[11px] text-[#A1A1A1] mt-1">{step.description}</p>
              </div>

              {isCurrent && (
                <div className="mt-4 pt-2 border-t border-[#FF4D00]/30 text-[10px] font-mono text-[#FF7A00] flex items-center gap-1.5">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>Est. 4-6 minutes</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Simulator Control Trigger */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={handleAdvanceStep}
          className="text-xs font-mono font-bold text-[#FF4D00] hover:text-[#FF7A00] underline underline-offset-4 cursor-pointer"
        >
          [Simulate Kitchen Advancement to Next Status]
        </button>
      </div>

    </div>
  );
}
