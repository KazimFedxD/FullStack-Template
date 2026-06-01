import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { formatErrorForDisplay } from '../utils/errorHandler';

const MessageContext = createContext(null);

const TYPE_META = {
  success: {
    title: 'Success',
    className: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-50',
    icon: CheckCircle2,
  },
  error: {
    title: 'Error',
    className: 'border-rose-400/30 bg-rose-500/15 text-rose-50',
    icon: AlertCircle,
  },
  info: {
    title: 'Info',
    className: 'border-sky-400/30 bg-sky-500/15 text-sky-50',
    icon: Info,
  },
  warning: {
    title: 'Warning',
    className: 'border-amber-400/30 bg-amber-500/15 text-amber-50',
    icon: AlertTriangle,
  },
};

function buildMessage(input, type, title) {
  if (typeof input === 'string') {
    return {
      type,
      title: title || TYPE_META[type].title,
      message: input,
    };
  }

  if (input instanceof Error) {
    return {
      type,
      title: title || TYPE_META[type].title,
      message: input.message || 'Something went wrong.',
    };
  }

  if (input && typeof input === 'object') {
    const message = input.message || input.error?.message || input.detail || formatErrorForDisplay(input);
    const resolvedType = input.type && TYPE_META[input.type] ? input.type : type;
    return {
      type: resolvedType,
      title: title || input.title || TYPE_META[resolvedType].title,
      message,
    };
  }

  return {
    type,
    title: title || TYPE_META[type].title,
    message: 'Something went wrong.',
  };
}

function MessageViewport({ messages, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          const meta = TYPE_META[message.type] || TYPE_META.info;
          const Icon = meta.icon;

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${meta.className}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-white/10 p-2">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-80">{message.title || meta.title}</p>
                  <p className="mt-1 text-sm leading-6 opacity-95">{message.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDismiss(message.id)}
                  className="rounded-full p-1 transition hover:bg-white/10"
                  aria-label="Dismiss message"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const timerRef = useRef(new Map());

  const dismissMessage = useCallback((id) => {
    const timer = timerRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timerRef.current.delete(id);
    }
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const pushMessage = useCallback((input, type = 'info', options = {}) => {
    const normalized = buildMessage(input, type, options.title);
    const id = options.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = options.duration ?? 4500;
    const sticky = options.sticky ?? false;

    if (normalized.type === 'error') {
      console.error('[UI error]', normalized.title, normalized.message, input);
    }

    setMessages((current) => [...current, { id, ...normalized }].slice(-5));

    if (!sticky) {
      const timer = window.setTimeout(() => {
        dismissMessage(id);
      }, duration);
      timerRef.current.set(id, timer);
    }

    return id;
  }, [dismissMessage]);

  const showMessage = useCallback((input, type = 'info', options = {}) => pushMessage(input, type, options), [pushMessage]);
  const showSuccess = useCallback((input, options) => pushMessage(input, 'success', options), [pushMessage]);
  const showError = useCallback((input, options) => pushMessage(input, 'error', options), [pushMessage]);
  const showInfo = useCallback((input, options) => pushMessage(input, 'info', options), [pushMessage]);
  const showWarning = useCallback((input, options) => pushMessage(input, 'warning', options), [pushMessage]);
  const clearMessages = useCallback(() => setMessages([]), []);

  const value = useMemo(() => ({
    messages,
    showMessage,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    dismissMessage,
    clearMessages,
  }), [clearMessages, dismissMessage, messages, showError, showInfo, showMessage, showSuccess, showWarning]);

  useEffect(() => () => {
    timerRef.current.forEach((timer) => clearTimeout(timer));
    timerRef.current.clear();
  }, []);

  return (
    <MessageContext.Provider value={value}>
      {children}
      <MessageViewport messages={messages} onDismiss={dismissMessage} />
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export default MessageContext;
