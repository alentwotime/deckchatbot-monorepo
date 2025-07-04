const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'https://deckchatbot-backend.onrender.com';

function App() {
  const [blueprint, setBlueprint] = React.useState(null);
  const [areaPhoto, setAreaPhoto] = React.useState(null);
  const [preview1, setPreview1] = React.useState(null);
  const [preview2, setPreview2] = React.useState(null);
  const [input, setInput] = React.useState('');
  const [chat, setChat] = React.useState([]);
  const sessionId = 'front-session';

  const handleFile = (e, setter, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setter(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const sendMessage = async () => {
    if (!input) return;
    setChat([...chat, { self: true, text: input }]);
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, session_id: sessionId })
    });
    const reader = res.body.getReader();
    let reply = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      reply += new TextDecoder().decode(value);
      setChat(c => [...c.slice(0,-1), { self: true, text: input }, { self: false, text: reply }]);
    }
    setInput('');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">DeckChatbot</h1>
      <div className="flex space-x-4">
        <div>
          <input type="file" onChange={e => handleFile(e, setBlueprint, setPreview1)} />
          {preview1 && <img src={preview1} alt="Blueprint" className="h-32 mt-2" />}
        </div>
        <div>
          <input type="file" onChange={e => handleFile(e, setAreaPhoto, setPreview2)} />
          {preview2 && <img src={preview2} alt="Area" className="h-32 mt-2" />}
        </div>
      </div>
      <div className="border p-2 h-64 overflow-y-auto bg-white" id="chat-box">
        {chat.map((msg, idx) => (
          <div key={idx} className={msg.self ? 'text-right' : 'text-left'}>
            <span className="px-2 py-1 inline-block bg-gray-200 rounded m-1">{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="flex">
        <input value={input} onChange={e => setInput(e.target.value)} className="flex-grow border p-2" />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4">Send</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

