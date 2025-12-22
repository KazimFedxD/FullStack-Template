import { useState, useCallback } from 'react';

export const useAlert = () => {
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: true,
    onConfirm: null
  });

  const showAlert = useCallback(({
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
    onConfirm = null
  }) => {
    return new Promise((resolve) => {
      setAlertConfig({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        showCancel,
        onConfirm: () => {
          if (onConfirm) onConfirm();
          resolve(true);
        }
      });
    });
  }, []);

  const showConfirm = useCallback(({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'confirm'
  }) => {
    return new Promise((resolve) => {
      setAlertConfig({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        showCancel: true,
        onConfirm: () => {
          setAlertConfig(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setAlertConfig(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const showSuccess = useCallback((message, title = 'Success!') => {
    return showAlert({ title, message, type: 'success', confirmText: 'Great!' });
  }, [showAlert]);

  const showError = useCallback((message, title = 'Error') => {
    return showAlert({ title, message, type: 'error', confirmText: 'OK' });
  }, [showAlert]);

  const showWarning = useCallback((message, title = 'Warning') => {
    return showAlert({ title, message, type: 'warning', confirmText: 'Understood' });
  }, [showAlert]);

  const closeAlert = useCallback(() => {
    setAlertConfig(prev => {
      // Call onCancel if it exists when closing
      if (prev.onCancel) {
        prev.onCancel();
      }
      return { ...prev, isOpen: false };
    });
  }, []);

  return {
    alertConfig,
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    closeAlert
  };
};

export default useAlert;
