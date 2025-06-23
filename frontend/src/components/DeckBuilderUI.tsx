import { useEffect, useRef, useState } from "react";
import axios from "axios";

/**
 * DeckBuilderUI component provides a 3-column layout for uploading deck plans
 * and chatting with the backend service.
 */
export default function DeckBuilderUI() {
  const [uploads, setUploads] = useState<{ areaPhoto: string | null; blueprint: string | null }>({
    areaPhoto: null,
    blueprint: null,
  });
  const [chatMessages, setChatMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Hi! Upload your blueprint or photo to get started." },
  ]);
  const [newMessage, setNewMessage] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "areaPhoto" | "blueprint") => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const API_URL = process.env.REACT_APP_API_URL || "";
      try {
        await axios.post(`${API_URL}/analyze-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const url = URL.createObjectURL(file);
        setUploads((prev) => ({ ...prev, [type]: url }));
        setChatMessages((prev) => [...prev, { role: "bot", text: `Uploaded and analyzed ${type}.` }]);
      } catch (error) {
        console.error("Upload failed:", error);
        setChatMessages((prev) => [...prev, { role: "bot", text: `Failed to upload ${type}.` }]);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const userMessage = { role: "user" as const, text: newMessage };
    setChatMessages([...chatMessages, userMessage]);
    setNewMessage("");

    try {
      const API_URL = process.env.REACT_APP_API_URL || "";
      const res = await axios.post(`${API_URL}/chat`, { message: newMessage });
      const botReply = res.data.reply || "Okay!";
      setChatMessages((prev) => [...prev, { role: "bot", text: botReply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [...prev, { role: "bot", text: "Oops, something went wrong." }]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-900 text-white min-h-screen font-sans">
      {/* Column 1 */}
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
          <h2 className="text-xl font-semibold flex items-center gap-2">👋 Welcome!</h2>
          <p className="text-sm text-gray-300">Let's build your deck.</p>
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2">
              <input type="radio" name="deckType" className="accent-blue-500" /> New deck
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="deckType" className="accent-blue-500" defaultChecked /> Resurface
            </label>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
          <h2 className="text-sm font-semibold mb-2">2. Upload sketch with measurements</h2>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "blueprint")} className="block w-full text-sm text-gray-300" />
        </div>
      </div>

      {/* Column 2 */}
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
          <h2 className="text-sm font-semibold mb-2">2. Upload a photo of the area (optional)</h2>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "areaPhoto")} className="block w-full text-sm text-gray-300" />
        </div>

        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
          <h2 className="text-sm font-semibold mb-2">3. Where is the door? Are there stairs?</h2>
          <div className="h-32 border border-gray-600 rounded-md p-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
        </div>
      </div>

      {/* Column 3: Preview + Chat */}
      <div className="flex flex-col space-y-4">
        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg space-y-4">
          <h2 className="text-sm font-semibold mb-2">🔄 Analyzing your files...</h2>
          <div className="space-y-2">
            {uploads.areaPhoto && <img src={uploads.areaPhoto} alt="Area" className="w-full rounded-md border border-gray-600" />}
            {uploads.blueprint && <img src={uploads.blueprint} alt="Blueprint" className="w-full rounded-md border border-gray-600" />}
          </div>
          <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold transition">Continue</button>
        </div>

        {/* Chat box */}
        <div className="bg-gray-800 rounded-2xl p-4 shadow-lg flex flex-col h-80">
          <div className="flex-1 overflow-y-auto space-y-2 mb-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`text-sm p-2 rounded-lg max-w-xs ${msg.role === "bot" ? "bg-gray-700 self-start" : "bg-blue-600 self-end"}`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg px-3 py-2 bg-gray-700 text-white placeholder-gray-400 text-sm"
              placeholder="Ask something..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-semibold">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}


