/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'success';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد الإجراء',
  cancelText = 'تراجع وإلغاء',
  type = 'warning'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop with elegant blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity"
            id="confirmation-modal-backdrop"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden z-10 text-right p-6 font-sans"
            id="confirmation-modal-box"
          >
            <div className="flex flex-col items-center sm:items-start text-center sm:text-right">
              {/* Header with appropriate state icon */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                <div className={`p-3 rounded-full shrink-0 flex items-center justify-center ${
                  type === 'danger' ? 'bg-rose-50 text-rose-600' :
                  type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {type === 'danger' && <Trash2 className="w-6 h-6" />}
                  {type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                  {type === 'warning' && <AlertTriangle className="w-6 h-6" />}
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-black text-slate-800 leading-tight">
                    {title}
                  </h3>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold inline-block mt-1">
                    ⚠️ تطلب اعتماداً إدارياً
                  </span>
                </div>
              </div>

              {/* Informative message body */}
              <div className="mt-4 w-full">
                <p className="text-sm text-slate-600 leading-relaxed font-bold">
                  {message}
                </p>
              </div>

              {/* User decisions */}
              <div className="mt-6 flex flex-col sm:flex-row-reverse gap-2.5 w-full">
                <button
                  type="button"
                  onClick={async () => {
                    await onConfirm();
                    onClose();
                  }}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black select-none text-white transition-all cursor-pointer shadow-sm ${
                    type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 active:scale-95' :
                    type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95' :
                    'bg-[#00875A] hover:bg-[#006e49] active:scale-95'
                  }`}
                  id="confirm-button"
                >
                  {confirmText}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold select-none text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                  id="cancel-button"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
