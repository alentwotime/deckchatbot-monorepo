const logger = require('../src/utils/logger');
const { analyzeImage } = require('../services/backend.service');

// Configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
  'image/bmp', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf',
  // CAD files (some have specific MIME types)
  'application/acad', 'application/x-acad', 'application/autocad_dwg',
  'image/x-dwg', 'application/dwg', 'application/x-dwg', 'application/x-autocad',
  'image/vnd.dwg', 'drawing/dwg'
];

const SUPPORTED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
  '.pdf', '.dwg', '.dxf', '.eps', '.ai', '.cdr', '.sketch'
];

function validateFile(file) {
  // Check if file exists
  if (!file) {
    return { valid: false, message: 'No file uploaded' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      message: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  // Check MIME type and extension
  const mimeType = file.mimetype;
  const extension = '.' + file.originalname.split('.').pop().toLowerCase();

  const isValidMimeType = SUPPORTED_MIME_TYPES.includes(mimeType);
  const isValidExtension = SUPPORTED_EXTENSIONS.includes(extension);

  if (!isValidMimeType && !isValidExtension) {
    return { 
      valid: false, 
      message: `Unsupported file format. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}` 
    };
  }

  return { valid: true };
}

function getFileType(file) {
  const extension = '.' + file.originalname.split('.').pop().toLowerCase();

  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(extension)) {
    return 'image';
  } else if (extension === '.pdf') {
    return 'pdf';
  } else if (['.dwg', '.dxf', '.eps', '.ai', '.cdr', '.sketch'].includes(extension)) {
    return 'cad';
  }

  return 'unknown';
}

async function uploadDrawing(req, res) {
  try {
    // Validate file
    const validation = validateFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    const file = req.file;
    const fileType = getFileType(file);

    logger.info(`Processing ${fileType} file: ${file.originalname} (${file.size} bytes)`);

    // Convert file to base64
    const fileBase64 = file.buffer.toString('base64');

    // Create appropriate prompt based on file type
    let prompt;
    switch (fileType) {
      case 'image':
        prompt = "Analyze this drawing/image for deck measurements, components, and construction details.";
        break;
      case 'pdf':
        prompt = "Analyze this PDF document for deck plans, measurements, and construction specifications.";
        break;
      case 'cad':
        prompt = "Analyze this CAD file for deck design, dimensions, and technical specifications.";
        break;
      default:
        prompt = "Analyze this file for deck-related information, measurements, and components.";
    }

    // Process the file
    const analysisResult = await analyzeImage(fileBase64, prompt);

    // Return success response with file information
    res.json({ 
      status: 'success', 
      message: 'File uploaded and processed successfully',
      fileInfo: {
        name: file.originalname,
        size: file.size,
        type: fileType,
        mimeType: file.mimetype
      },
      analysisResult 
    });

  } catch (err) {
    logger.error(`Error processing drawing upload: ${err.stack}`);
    res.status(500).json({ 
      error: 'Error processing file. Please try again or contact support if the problem persists.' 
    });
  }
}

module.exports = { uploadDrawing };
