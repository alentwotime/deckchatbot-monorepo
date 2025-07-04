import React, { useState } from 'react';
import axios from 'axios';

const UploadAnalyze = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    setError(null);

    try {
      const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://AlensDeckBot.online/api';
      const res = await axios.post(`${API_URL}/full-analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Upload Blueprint or Sketch</h2>
      <input type="file" onChange={handleFileChange} className="mb-2" />
      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Analyzing...' : 'Upload & Analyze'}
      </button>

      {error && <div className="text-red-600 mt-2">Error: {error}</div>}

      {result && (
        <div className="mt-4 bg-gray-100 p-4 rounded">
          <p><strong>Filename:</strong> {result.filename}</p>
          <p><strong>OCR Text:</strong></p>
          <pre className="text-sm whitespace-pre-wrap">{result.ocr_text}</pre>
          <p><strong>Parsed Dimensions:</strong> {JSON.stringify(result.parsed_dimensions)}</p>
          <p><strong>Estimated SqFt:</strong> {result.square_footage_estimate || 'N/A'}</p>
        </div>
      )}
    </div>
  );
};

export default UploadAnalyze;
