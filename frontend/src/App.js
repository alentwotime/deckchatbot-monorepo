import React, { useState } from 'react';

const App = () => {
  const [response, setResponse] = useState(null);
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/analyze-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Upload failed', err);
      setResponse({ error: 'Failed to process image' });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>DeckChatbot</h1>
      <p>Upload a sketch or deck photo to get started:</p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={!file}>
        Analyze Image
      </button>

      {response && (
        <div style={{ marginTop: 20 }}>
          <h3>AI Response:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default App;
