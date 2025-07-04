// Security middleware and utilities for DeckChatbot
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

// Enhanced Content Security Policy
export const enhancedCSP = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // TODO: Remove unsafe-inline and use nonces
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      childSrc: ["'none'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Input sanitization utilities
export class InputSanitizer {
  static sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    
    // Trim and limit length
    let sanitized = input.trim().substring(0, maxLength);
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Escape HTML entities
    sanitized = validator.escape(sanitized);
    
    return sanitized;
  }

  static sanitizeNumber(input, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
    const num = parseFloat(input);
    if (isNaN(num)) {
      throw new Error('Input must be a valid number');
    }
    
    if (num < min || num > max) {
      throw new Error(`Number must be between ${min} and ${max}`);
    }
    
    return num;
  }

  static sanitizeEmail(email) {
    if (!validator.isEmail(email)) {
      throw new Error('Invalid email format');
    }
    return validator.normalizeEmail(email);
  }

  static sanitizeFilename(filename) {
    if (typeof filename !== 'string') {
      throw new Error('Filename must be a string');
    }
    
    // Remove path traversal attempts
    let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '');
    
    // Remove leading dots and spaces
    sanitized = sanitized.replace(/^[\.\s]+/, '');
    
    // Limit length
    sanitized = sanitized.substring(0, 255);
    
    if (!sanitized) {
      throw new Error('Invalid filename');
    }
    
    return sanitized;
  }

  static sanitizeSVGContent(svgContent) {
    // Use DOMPurify to sanitize SVG content
    const cleanSVG = DOMPurify.sanitize(svgContent, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ALLOWED_TAGS: [
        'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 
        'polygon', 'text', 'tspan', 'defs', 'marker', 'pattern', 'clipPath',
        'mask', 'image', 'switch', 'foreignObject', 'desc', 'title'
      ],
      ALLOWED_ATTR: [
        'width', 'height', 'viewBox', 'xmlns', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry',
        'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'transform',
        'font-family', 'font-size', 'font-weight', 'text-anchor', 'd', 'points',
        'x1', 'y1', 'x2', 'y2', 'href', 'id', 'class'
      ],
      FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style'],
      FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'style']
    });
    
    return cleanSVG;
  }
}

// CSRF protection middleware
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for health checks and public endpoints
  if (req.path === '/health' || req.path.startsWith('/public/')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_MISMATCH'
    });
  }

  next();
};

// Generate CSRF token endpoint
export const generateCSRFToken = (req, res) => {
  const token = require('crypto').randomBytes(32).toString('hex');
  req.session.csrfToken = token;
  res.json({ csrfToken: token });
};

// File upload security middleware
export const secureFileUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const file = req.file;
  
  // Validate file type
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'File type not allowed',
      allowedTypes: allowedMimeTypes
    });
  }

  // Validate file size (already handled by multer, but double-check)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return res.status(400).json({
      success: false,
      error: 'File size too large',
      maxSize: '10MB'
    });
  }

  // Sanitize filename
  try {
    file.originalname = InputSanitizer.sanitizeFilename(file.originalname);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid filename',
      details: error.message
    });
  }

  next();
};

// Request validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Validate and sanitize request body
      if (schema.body) {
        req.body = validateAndSanitizeObject(req.body, schema.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = validateAndSanitizeObject(req.query, schema.query);
      }

      // Validate URL parameters
      if (schema.params) {
        req.params = validateAndSanitizeObject(req.params, schema.params);
      }

      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.message
      });
    }
  };
};

function validateAndSanitizeObject(obj, schema) {
  const result = {};
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];
    
    // Check if required field is missing
    if (rules.required && (value === undefined || value === null)) {
      throw new Error(`Required field '${key}' is missing`);
    }
    
    // Skip validation if field is optional and not provided
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }
    
    // Apply validation and sanitization based on type
    switch (rules.type) {
      case 'string':
        result[key] = InputSanitizer.sanitizeString(value, rules.maxLength);
        break;
      case 'number':
        result[key] = InputSanitizer.sanitizeNumber(value, rules.min, rules.max);
        break;
      case 'email':
        result[key] = InputSanitizer.sanitizeEmail(value);
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Field '${key}' must be an array`);
        }
        result[key] = value.slice(0, rules.maxItems || 100);
        break;
      default:
        result[key] = value;
    }
  }
  
  return result;
}

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Additional security headers not covered by helmet
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
};

export default {
  enhancedCSP,
  InputSanitizer,
  csrfProtection,
  generateCSRFToken,
  secureFileUpload,
  validateRequest,
  securityHeaders
};
