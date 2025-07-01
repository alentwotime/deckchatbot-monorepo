import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFile, analyzeFiles } from '../../services/backend.service';

const Upload = ({ setAnalysisResult }) => {
  const [blueprint, setBlueprint] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [previewUrls, setPreviewUrls] = useState({});
  const fileInputRef = useRef(null);

  // Enhanced file validation
  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not supported. Please use JPEG, PNG, or PDF.`);
    }

    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
    }

    return true;
  };

  // Create preview URLs for images
  const createPreview = (file) => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => ({ ...prev, [file.name]: url }));
      return url;
    }
    return null;
  };

  const onBlueprintDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setError(`Some files were rejected: ${rejectedFiles.map(f => f.file.name).join(', ')}`);
      return;
    }

    if (acceptedFiles.length) {
      try {
        const file = acceptedFiles[0];
        validateFile(file);
        setBlueprint(file);
        createPreview(file);
        setError('');
      } catch (err) {
        setError(err.message);
      }
    }
  }, []);

  const onPhotosDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setError(`Some files were rejected: ${rejectedFiles.map(f => f.file.name).join(', ')}`);
      return;
    }

    try {
      const validFiles = acceptedFiles.filter(file => {
        try {
          validateFile(file);
          return true;
        } catch (err) {
          setError(err.message);
          return false;
        }
      });

      validFiles.forEach(createPreview);
      setPhotos(prevPhotos => [...prevPhotos, ...validFiles]);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const removePhoto = (index) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      const removedPhoto = newPhotos.splice(index, 1)[0];

      // Clean up preview URL
      if (previewUrls[removedPhoto.name]) {
        URL.revokeObjectURL(previewUrls[removedPhoto.name]);
        setPreviewUrls(prev => {
          const newUrls = { ...prev };
          delete newUrls[removedPhoto.name];
          return newUrls;
        });
      }

      return newPhotos;
    });
  };

  const { getRootProps: getBlueprintRootProps, getInputProps: getBlueprintInputProps, isDragActive: isBlueprintDragActive } = useDropzone({
    onDrop: onBlueprintDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const { getRootProps: getPhotosRootProps, getInputProps: getPhotosInputProps, isDragActive: isPhotosDragActive } = useDropzone({
    onDrop: onPhotosDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true
  });

  const handleSubmit = async () => {
    if (!blueprint) {
      setError('Please upload a blueprint or drawing.');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setError('');

    try {
      const uploadedFiles = [];
      const totalFiles = 1 + photos.length;
      let completedFiles = 0;

      // Upload blueprint
      setProcessingStep('Uploading blueprint...');
      const blueprintRes = await uploadFile(blueprint, 'blueprint');
      uploadedFiles.push(blueprintRes);
      completedFiles++;
      setUploadProgress((completedFiles / totalFiles) * 50); // 50% for upload phase

      // Upload photos
      for (const [index, photo] of photos.entries()) {
        setProcessingStep(`Uploading photo ${index + 1} of ${photos.length}...`);
        const photoRes = await uploadFile(photo, 'photo');
        uploadedFiles.push(photoRes);
        completedFiles++;
        setUploadProgress((completedFiles / totalFiles) * 50);
      }

      // Analyze files
      setProcessingStep('Analyzing uploaded files...');
      setUploadProgress(75);

      const analysisResult = await analyzeFiles(uploadedFiles);

      setProcessingStep('Processing complete!');
      setUploadProgress(100);

      setTimeout(() => {
        setAnalysisResult(analysisResult);
        setIsProcessing(false);
        setProcessingStep('');
        setUploadProgress(0);
      }, 1000);

    } catch (err) {
      setError('An error occurred during the analysis. Please try again.');
      setIsProcessing(false);
      setProcessingStep('');
      setUploadProgress(0);
    }
  };

  return (
    <motion.div 
      className="upload-container"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{
        minHeight: '100vh',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}
    >
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{ marginBottom: '2rem', textAlign: 'center' }}
      >
        Upload Drawing and Pictures Area
      </motion.h2>

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        style={{ 
          textAlign: 'center', 
          marginBottom: '3rem',
          fontSize: '1.1rem',
          color: '#718096'
        }}
      >
        Transform your hand-drawn deck plans into digital format with our advanced OCR technology
      </motion.p>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
              color: '#c53030',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              width: '100%',
              maxWidth: '600px',
              textAlign: 'center',
              border: '1px solid #fc8181'
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Status */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '2rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              width: '100%',
              maxWidth: '600px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              {processingStep}
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(102, 126, 234, 0.2)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <motion.div
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '4px'
                }}
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#718096' }}>
              {uploadProgress}% Complete
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem', 
        width: '100%',
        maxWidth: '1000px'
      }}>

        {/* Blueprint Upload Area */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          {...getBlueprintRootProps()}
          style={{
            border: isBlueprintDragActive 
              ? '3px dashed #667eea' 
              : blueprint 
                ? '3px solid #48bb78' 
                : '3px dashed #cbd5e0',
            padding: '2rem',
            borderRadius: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: isBlueprintDragActive 
              ? 'rgba(102, 126, 234, 0.1)' 
              : blueprint 
                ? 'rgba(72, 187, 120, 0.1)' 
                : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <input {...getBlueprintInputProps()} ref={fileInputRef} />

          {blueprint ? (
            <div style={{ width: '100%' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                color: '#48bb78'
              }}>
                ✓
              </div>
              <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>Blueprint Ready</h3>
              <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '1rem' }}>
                {blueprint.name}
              </p>
              {previewUrls[blueprint.name] && (
                <img 
                  src={previewUrls[blueprint.name]} 
                  alt="Blueprint preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '150px',
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>
          ) : (
            <div>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                color: isBlueprintDragActive ? '#667eea' : '#cbd5e0'
              }}>
                📋
              </div>
              <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
                {isBlueprintDragActive ? 'Drop your blueprint here!' : 'Upload Blueprint'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#718096' }}>
                Drag & drop your hand-drawn deck plans or click to browse
              </p>
              <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.5rem' }}>
                Supports JPEG, PNG, PDF • Max 10MB
              </p>
            </div>
          )}
        </motion.div>

        {/* Photos Upload Area */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          {...getPhotosRootProps()}
          style={{
            border: isPhotosDragActive 
              ? '3px dashed #667eea' 
              : photos.length > 0 
                ? '3px solid #48bb78' 
                : '3px dashed #cbd5e0',
            padding: '2rem',
            borderRadius: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: isPhotosDragActive 
              ? 'rgba(102, 126, 234, 0.1)' 
              : photos.length > 0 
                ? 'rgba(72, 187, 120, 0.1)' 
                : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <input {...getPhotosInputProps()} />

          {photos.length > 0 ? (
            <div style={{ width: '100%' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                color: '#48bb78'
              }}>
                📸
              </div>
              <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
                {photos.length} Photo{photos.length !== 1 ? 's' : ''} Added
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
                gap: '0.5rem',
                marginTop: '1rem'
              }}>
                {photos.slice(0, 4).map((photo, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    {previewUrls[photo.name] && (
                      <img 
                        src={previewUrls[photo.name]} 
                        alt={`Photo ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '60px',
                          borderRadius: '6px',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(index);
                      }}
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {photos.length > 4 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: '#667eea'
                  }}>
                    +{photos.length - 4}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                color: isPhotosDragActive ? '#667eea' : '#cbd5e0'
              }}>
                📷
              </div>
              <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
                {isPhotosDragActive ? 'Drop your photos here!' : 'Upload Reference Photos'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#718096' }}>
                Add multiple photos for better analysis (optional)
              </p>
              <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.5rem' }}>
                Supports JPEG, PNG • Max 5MB each
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Submit Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSubmit}
        disabled={!blueprint || isProcessing}
        style={{
          marginTop: '3rem',
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          fontWeight: '600',
          borderRadius: '12px',
          border: 'none',
          background: (!blueprint || isProcessing) 
            ? 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          cursor: (!blueprint || isProcessing) ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: (!blueprint || isProcessing) 
            ? 'none'
            : '0 8px 25px rgba(102, 126, 234, 0.4)',
          minWidth: '200px'
        }}
      >
        {isProcessing ? 'Processing...' : 'Start Analysis'}
      </motion.button>

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        style={{ 
          marginTop: '2rem',
          fontSize: '0.9rem',
          color: '#a0aec0',
          textAlign: 'center'
        }}
      >
        Your files are processed securely and never stored permanently
      </motion.p>
    </motion.div>
  );
};

export default Upload;
