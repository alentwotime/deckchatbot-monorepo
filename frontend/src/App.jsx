import React, { useState, useRef, useEffect } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [editableDims, setEditableDims] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !imageUrl || !result?.square_footage_estimate) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      // Overlay text
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(10, 10, 300, 40);
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText(`Estimated SqFt: ${result.square_footage_estimate}`, 20, 38);
    };

    img.src = imageUrl;
  }, [imageUrl, result]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (selected) {
      const previewUrl = URL.createObjectURL(selected);
      setImageUrl(previewUrl);
      setResult(null);
      setEditableDims([]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8000/full-analyze", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
    setEditableDims(data.parsed_dimensions?.dimensions || []);
  };

  const handleDimensionChange = (i, field, value) => {
    const updated = [...editableDims];
    updated[i][field] = field === "value" ? parseFloat(value) : value;
    setEditableDims(updated);
  };

  const recalculateSqFt = () => {
    const ftValues = editableDims.filter((d) => d.unit === "ft").map((d) => d.value);
    if (ftValues.length >= 2) {
      return Math.round(ftValues[0] * ftValues[1] * 100) / 100;
    }
    return null;
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Deck OCR + SqFt Estimator</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file}>Analyze Image</button>

      {imageUrl && (
        <div style={{ marginTop: 20 }}>
          <canvas ref={canvasRef} style={{ maxWidth: "100%", border: "1px solid #ccc" }} />
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>OCR Text</h3>
          <pre>{result.ocr_text}</pre>

          <h3>Edit Parsed Dimensions</h3>
          {editableDims.map((dim, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <input
                type="number"
                value={dim.value}
                onChange={(e) => handleDimensionChange(i, "value", e.target.value)}
              />
              <select
                value={dim.unit}
                onChange={(e) => handleDimensionChange(i, "unit", e.target.value)}
              >
                <option value="ft">ft</option>
                <option value="in">in</option>
              </select>
            </div>
          ))}

          <h3>Recalculated SqFt:</h3>
          <strong>{recalculateSqFt() ?? "N/A"}</strong>
        </div>
      )}
    </div>
  );
}
