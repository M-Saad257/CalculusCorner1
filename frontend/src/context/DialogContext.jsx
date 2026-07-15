import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null); // { title, message, type, confirmLabel, cancelLabel, danger, resolve }
  const [toasts, setToasts] = useState([]); // Array of { id, message, type }

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const confirm = useCallback((title, message, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        type: 'confirm',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        danger: options.danger || false,
        resolve: (val) => {
          setDialog(null);
          resolve(val);
        }
      });
    });
  }, []);

  const alert = useCallback((title, message, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        type: 'alert',
        confirmLabel: options.confirmLabel || 'OK',
        extraLabel: options.extraLabel,
        danger: options.danger || false,
        resolve: (val) => {
          setDialog(null);
          resolve(val);
        }
      });
    });
  }, []);

  const closeDialog = () => {
    if (dialog && dialog.resolve) {
      dialog.resolve(false);
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, alert, showToast }}>
      {children}

      {/* Dialog Modal */}
      <AnimatePresence>
        {dialog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-bg-color p-6 md:p-8 rounded-3xl border border-border-color shadow-2xl w-full max-w-md text-left font-sans relative"
            >
              <button
                onClick={closeDialog}
                className="absolute top-4 right-4 p-1.5 bg-bg-secondary hover:bg-slate-200 text-text-secondary rounded-full transition-colors border-0 cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-start gap-4 mt-2">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  dialog.danger 
                    ? 'bg-rose-50 text-rose-600' 
                    : dialog.type === 'confirm' 
                      ? 'bg-blue-50 text-primary' 
                      : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {dialog.danger ? (
                    <AlertTriangle size={24} />
                  ) : dialog.type === 'confirm' ? (
                    <Info size={24} />
                  ) : (
                    <CheckCircle2 size={24} />
                  )}
                </div>

                <div className="grow">
                  <h3 className="font-display font-bold text-lg text-text-primary m-0 leading-snug">
                    {dialog.title}
                  </h3>
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                    {dialog.message}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 border-t border-border-color/60 pt-4">
                {dialog.type === 'confirm' && (
                  <button
                    onClick={() => dialog.resolve(false)}
                    className="px-5 py-2.5 bg-bg-secondary hover:bg-slate-200 text-text-secondary font-bold text-xs rounded-xl cursor-pointer transition-colors border border-border-color"
                  >
                    {dialog.cancelLabel}
                  </button>
                )}
                {dialog.extraLabel && (
                  <button
                    onClick={() => dialog.resolve('extra')}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors border-0 shadow-sm"
                  >
                    {dialog.extraLabel}
                  </button>
                )}
                <button
                  onClick={() => dialog.resolve(true)}
                  className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors border-0 shadow-sm ${
                    dialog.danger 
                      ? 'bg-rose-600 hover:bg-rose-700' 
                      : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-2xl border shadow-lg flex items-center gap-3 bg-bg-color pointer-events-auto border-border-color`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                toast.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : toast.type === 'error' 
                    ? 'bg-rose-50 text-rose-600' 
                    : 'bg-amber-50 text-amber-600'
              }`}>
                {toast.type === 'success' ? (
                  <CheckCircle2 size={16} />
                ) : toast.type === 'error' ? (
                  <XCircle size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
              </div>
              <p className="text-xs font-semibold text-text-primary grow leading-normal">
                {toast.message}
              </p>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-text-tertiary hover:text-text-primary p-0.5 rounded transition-colors bg-transparent border-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </DialogContext.Provider>
  );
};
