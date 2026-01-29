type LogCategory = 'matchmaking' | 'realtime' | 'queue';

export const logger = {
  debug: (category: LogCategory, message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${category.toUpperCase()}] ${message}`, data || '');
    }
  },
  error: (category: LogCategory, message: string, error?: unknown) => {
    console.error(`[${category.toUpperCase()} ERROR] ${message}`, error || '');
  },
  info: (category: LogCategory, message: string, data?: unknown) => {
    console.info(`[${category.toUpperCase()}] ${message}`, data || '');
  },
};
