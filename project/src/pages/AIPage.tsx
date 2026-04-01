import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Message {
  type: "user" | "bot";
  message: string;
  timestamp: Date;
}

interface ApiResponse {
  candidates?: { content: { parts: { text: string }[] } }[];
}

const GEMINI_API_KEY = "AIzaSyA5x67hvFwa6sTfTVttBjsw739mZDGWli4";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

function AIPage() {
  const navigate = useNavigate();
  // Chatbot state
  const [chatQuery, setChatQuery] = useState("");
  const [chatResponses, setChatResponses] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
 // const [filterError, setFilterError] = useState<string>("");

  // Scroll to bottom for chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatResponses]);

  // Chatbot handler
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatQuery.trim() === "" || chatLoading) return;
    setChatLoading(true);
    setChatResponses((prev) => [
      ...prev,
      { type: "user", message: chatQuery, timestamp: new Date() },
    ]);
    try {
      const response = await axios.post<ApiResponse>(
        GEMINI_API_URL,
        { contents: [{ parts: [{ text: chatQuery }] }] },
        { headers: { "Content-Type": "application/json" } }
      );
      const botResponse =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't find an answer.";
      setChatResponses((prev) => [
        ...prev,
        { type: "bot", message: botResponse, timestamp: new Date() },
      ]);
    } catch (error) {
      setChatResponses((prev) => [
        ...prev,
        { type: "bot", message: "There was an error fetching the response.", timestamp: new Date() },
      ]);
    } finally {
      setChatLoading(false);
      setChatQuery("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-green-50 to-emerald-100 py-10 px-2 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* AI Chatbot Card */}
        <div className="bg-white/90 rounded-3xl shadow-2xl border-2 border-emerald-200 p-8 flex flex-col items-center hover:scale-105 transition-transform duration-300">
          <div className="bg-gradient-to-br from-emerald-400 to-sky-400 rounded-full p-4 mb-4 shadow-lg">
            <span className="text-5xl">🤖</span>
          </div>
          <h2 className="text-3xl font-extrabold text-emerald-700 mb-2">AI Chatbot</h2>
          <p className="text-gray-700 text-center mb-6">Ask anything about solar panels, faults, maintenance, or how to use the app. Get instant, conversational help from our AI assistant.</p>
          <button
            onClick={() => navigate("/ai-chatbot")}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-bold shadow hover:opacity-90 transition text-lg"
          >
            Go to Chatbot
          </button>
        </div>
        {/* AI Fault Diagnosis Card */}
        <div className="bg-white/90 rounded-3xl shadow-2xl border-2 border-orange-200 p-8 flex flex-col items-center hover:scale-105 transition-transform duration-300">
          <div className="bg-gradient-to-br from-orange-400 to-amber-400 rounded-full p-4 mb-4 shadow-lg">
            <span className="text-5xl">🔧</span>
          </div>
          <h2 className="text-3xl font-extrabold text-orange-700 mb-2">AI Fault Diagnosis</h2>
          <p className="text-gray-700 text-center mb-6">Get detailed fault analysis, step-by-step repair procedures, and maintenance recommendations for any panel. Let AI guide your repair process.</p>
          <button
            onClick={() => navigate("/ai-fault-diagnosis")}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow hover:opacity-90 transition text-lg"
          >
            Go to Diagnosis
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIPage; 