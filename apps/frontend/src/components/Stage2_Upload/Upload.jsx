import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { uploadFile, analyzeFiles } from '../../services/backend.service';

const Upload = ({ setAnalysisResult }) => {
  const [blueprint, setBlueprint] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');

  const onBlueprintDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length) {
      setBlueprint(acceptedFiles[0]);
    }
  }, []);

  const onPhotosDrop = useCallback((acceptedFiles) => {
    setPhotos(prevPhotos => [...prevPhotos, ...acceptedFiles]);
  }, []);

  const { getRootProps: getBlueprintRootProps, getInputProps: getBlueprintInputProps } = useDropzone({
    onDrop: onBlueprintDrop,
    accept: 'image/jpeg, image/png, application/pdf',
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const { getRootProps: getPhotosRootProps, getInputProps: getPhotosInputProps } = useDropzone({
    onDrop: onPhotosDrop,
    accept: 'image/jpeg, image/png',
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleSubmit = async () => {
    if (!blueprint) {
      setError('Please upload a blueprint or drawing.');
      return;
    }

    try {
      const uploadedFiles = [];
      const blueprintRes = await uploadFile(blueprint, 'blueprint');
      uploadedFiles.push(blueprintRes);

      for (const photo of photos) {
        const photoRes = await uploadFile(photo, 'photo');
        uploadedFiles.push(photoRes);
      }

      const analysisResult = await analyzeFiles(uploadedFiles);
      setAnalysisResult(analysisResult);
      setError('');
    } catch (err) {
      setError('An error occurred during the analysis. Please try again.');
    }
  };

  return (
    <motion.div 
      style={{ height: '100vh', border: '1px solid #ccc', padding: '20px', margin: '10px' }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
    >
      <h2>Stage 2: Upload Your Deck Plans</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div {...getBlueprintRootProps()} style={{ border: '2px dashed #ccc', padding: '20px', marginBottom: '20px' }}>
        <input {...getBlueprintInputProps()} />
        <p>Drag 'n' drop a blueprint/drawing here, or click to select a file.</p>
        {blueprint && <p>Selected: {blueprint.name}</p>}
      </div>

      <div {...getPhotosRootProps()} style={{ border: '2px dashed #ccc', padding: '20px' }}>
        <input {...getPhotosInputProps()} />
        <p>Drag 'n' drop photos of the area here, or click to select files.</p>
        {photos.map((photo, i) => (
          <p key={i}>Selected: {photo.name}</p>
        ))}
      </div>

      <button onClick={handleSubmit} style={{ marginTop: '20px' }}>Submit for Analysis</button>
    </motion.div>
  );
};

export default Upload;
