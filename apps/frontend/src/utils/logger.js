// Browser-compatible logger for frontend
class BrowserLogger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    this.currentLevel = this.levels.info; // Default level
  }

  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.currentLevel = this.levels[level];
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
  }

  error(message, meta = {}) {
    if (this.currentLevel >= this.levels.error) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.currentLevel >= this.levels.warn) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this.currentLevel >= this.levels.info) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.currentLevel >= this.levels.debug) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  log(level, message, meta = {}) {
    if (this[level]) {
      this[level](message, meta);
    } else {
      this.info(message, meta);
    }
  }
}

const logger = new BrowserLogger();

// Set log level based on environment
if (typeof window !== 'undefined' && window.location) {
  // Browser environment
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('dev');
  logger.setLevel(isDevelopment ? 'debug' : 'info');
}

export default logger;
