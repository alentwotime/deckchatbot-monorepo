// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const validationAlert = document.getElementById('validationAlert');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileType = document.getElementById('fileType');
const uploadButton = document.getElementById('uploadButton');
const clearButton = document.getElementById('clearButton');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');

// Configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_FORMATS = {
  // Images
  'image/jpeg': { name: 'JPEG Image', maxSize: MAX_FILE_SIZE },
  'image/jpg': { name: 'JPG Image', maxSize: MAX_FILE_SIZE },
  'image/png': { name: 'PNG Image', maxSize: MAX_FILE_SIZE },
  'image/gif': { name: 'GIF Image', maxSize: MAX_FILE_SIZE },
  'image/bmp': { name: 'BMP Image', maxSize: MAX_FILE_SIZE },
  'image/webp': { name: 'WebP Image', maxSize: MAX_FILE_SIZE },
  'image/svg+xml': { name: 'SVG Image', maxSize: MAX_FILE_SIZE },

  // Documents
  'application/pdf': { name: 'PDF Document', maxSize: MAX_FILE_SIZE },

  // CAD Files (by extension since MIME types vary)
  '.dwg': { name: 'AutoCAD Drawing', maxSize: MAX_FILE_SIZE },
  '.dxf': { name: 'AutoCAD Exchange', maxSize: MAX_FILE_SIZE },
  '.eps': { name: 'Encapsulated PostScript', maxSize: MAX_FILE_SIZE },
  '.ai': { name: 'Adobe Illustrator', maxSize: MAX_FILE_SIZE },
  '.cdr': { name: 'CorelDRAW', maxSize: MAX_FILE_SIZE },
  '.sketch': { name: 'Sketch File', maxSize: MAX_FILE_SIZE }
};

// Utility Functions
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
  return '.' + filename.split('.').pop().toLowerCase();
}

function showValidationMessage(message, type = 'danger') {
  validationAlert.className = `alert alert-${type}`;
  validationAlert.textContent = message;
  validationAlert.classList.remove('d-none');

  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      validationAlert.classList.add('d-none');
    }, 5000);
  }
}

function hideValidationMessage() {
  validationAlert.classList.add('d-none');
}

function validateFile(file) {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`
    };
  }

  // Check file type
  const mimeType = file.type;
  const extension = getFileExtension(file.name);

  const isValidMimeType = SUPPORTED_FORMATS[mimeType];
  const isValidExtension = SUPPORTED_FORMATS[extension];

  if (!isValidMimeType && !isValidExtension) {
    return {
      valid: false,
      message: `Unsupported file format. Please upload images, PDFs, or CAD files.`
    };
  }

  return { valid: true };
}

function displayFileInfo(file) {
  const extension = getFileExtension(file.name);
  const formatInfo = SUPPORTED_FORMATS[file.type] || SUPPORTED_FORMATS[extension];

  fileName.textContent = file.name;
  fileSize.textContent = `Size: ${formatFileSize(file.size)}`;
  fileType.textContent = `Type: ${formatInfo ? formatInfo.name : file.type || 'Unknown'}`;

  fileInfo.classList.remove('d-none');
}

function showPreview(file) {
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
  } else {
    preview.classList.add('d-none');
  }
}

function clearFile() {
  fileInput.value = '';
  fileInfo.classList.add('d-none');
  preview.classList.add('d-none');
  clearButton.classList.add('d-none');
  uploadButton.disabled = true;
  hideValidationMessage();
  dropZone.classList.remove('error');
}

function handleFiles(files) {
  const file = files[0];
  if (!file) {
    return;
  }

  hideValidationMessage();
  dropZone.classList.remove('error');

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    showValidationMessage(validation.message, 'danger');
    dropZone.classList.add('error');
    return;
  }

  // Update file input
  fileInput.files = files;

  // Display file information
  displayFileInfo(file);
  showPreview(file);

  // Enable upload button and show clear button
  uploadButton.disabled = false;
  clearButton.classList.remove('d-none');

  showValidationMessage('File selected successfully! Ready to upload.', 'success');
}

function updateProgress(percent, text = 'Uploading...') {
  progressBar.style.width = `${percent}%`;
  progressBar.setAttribute('aria-valuenow', percent);
  progressPercent.textContent = `${Math.round(percent)}%`;
  progressText.textContent = text;
}

function showProgress() {
  progressContainer.classList.remove('d-none');
  updateProgress(0);
}

function hideProgress() {
  progressContainer.classList.add('d-none');
}

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', e => handleFiles(e.target.files));

clearButton.addEventListener('click', clearFile);

uploadButton.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) {
    showValidationMessage('Please select a file first', 'warning');
    return;
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('image', file);

  // Show progress and disable upload button
  showProgress();
  uploadButton.disabled = true;
  hideValidationMessage();

  try {
    // Simulate progress updates
    updateProgress(10, 'Preparing upload...');

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 80; // Reserve 20% for processing
        updateProgress(percentComplete, 'Uploading...');
      }
    });

    // Handle response
    xhr.addEventListener('load', () => {
      updateProgress(90, 'Processing...');

      setTimeout(() => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status === 200) {
            updateProgress(100, 'Upload complete!');
            showValidationMessage('File uploaded and processed successfully!', 'success');
            setTimeout(() => {
              hideProgress();
              clearFile();
            }, 2000);
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        } catch (parseError) {
          throw new Error('Invalid response from server');
        }
      }, 500);
    });

    xhr.addEventListener('error', () => {
      throw new Error('Network error occurred during upload');
    });

    xhr.addEventListener('timeout', () => {
      throw new Error('Upload timed out');
    });

    // Configure and send request
    xhr.timeout = 300000; // 5 minutes
    xhr.open('POST', '/upload-drawing');
    xhr.setRequestHeader('Authorization', 'Bearer revamp123secure');
    xhr.send(formData);

  } catch (err) {
    hideProgress();
    uploadButton.disabled = false;
    showValidationMessage(err.message || 'Upload failed', 'danger');
  }
});
