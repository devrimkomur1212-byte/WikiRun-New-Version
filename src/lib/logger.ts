type LogCategory = 'matchmaking' | 'realtime' | 'queue' | 'polling';

export const logger = {
  debug: (category: LogCategory, message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${category.toUpperCase()}] ${message}`, data || '');
    }
  },
  info: (category: LogCategory, message: string, data?: unknown) => {
    console.info(`[${category.toUpperCase()}] ${message}`, data || '');
  },
  warn: (category: LogCategory, message: string, data?: unknown) => {
    console.warn(`[${category.toUpperCase()} WARN] ${message}`, data || '');
  },
  error: (category: LogCategory, message: string, error?: unknown) => {
    console.error(`[${category.toUpperCase()} ERROR] ${message}`, error || '');
  },
};
