import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './App.css';

const apiBase = '';

const ChatSection = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const logRef = useRef(null);

  const send = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages((m) => [...m, userMessage, { sender: 'bot', text: '...' }]);
    setInput('');
    try {
      const res = await fetch(`${apiBase}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((m) => m.slice(0, -1).concat({ sender: 'bot', text: data.response || 'No response' }));
    } catch (err) {
      setMessages((m) => m.slice(0, -1).concat({ sender: 'bot', text: 'Error' }));
    }
  };

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [messages]);

  return (
    <div className="chat-section">
      <div className="chat-log" ref={logRef}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.sender}`}>{m.text}</div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
};

const DigitalizeSection = () => {
  const [file, setFile] = useState(null);
  const [svg, setSvg] = useState('');
  const upload = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    try {
      const res = await fetch(`${apiBase}/digitalize-drawing`, {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        const text = await res.text();
        setSvg(text);
      }
    } catch (err) {
      setSvg('Error');
    }
  };
  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={upload}>Digitalize</button>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
};

const ModelSection = () => {
  const mountRef = useRef(null);
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / 400, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, 400);
    mountRef.current.appendChild(renderer.domElement);
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    camera.position.z = 2;
    const controls = new OrbitControls(camera, renderer.domElement);
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      renderer.dispose();
      mountRef.current.innerHTML = '';
    };
  }, []);
  return <div ref={mountRef} style={{ width: '100%', height: 400 }} />;
};

const App = () => {
  const [tab, setTab] = useState('chat');
  return (
    <div className="app">
      <h1>DeckChatbot</h1>
      <nav className="tabs">
        <button onClick={() => setTab('chat')} className={tab === 'chat' ? 'active' : ''}>Chat</button>
        <button onClick={() => setTab('digitalize')} className={tab === 'digitalize' ? 'active' : ''}>Digitalize Drawing</button>
        <button onClick={() => setTab('model')} className={tab === 'model' ? 'active' : ''}>3D Model</button>
      </nav>
      <div className="tab-content">
        {tab === 'chat' && <ChatSection />}
        {tab === 'digitalize' && <DigitalizeSection />}
        {tab === 'model' && <ModelSection />}
      </div>
    </div>
  );
};

export default App;
