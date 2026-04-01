import { useState, useRef, useEffect } from "react";
import axios from "axios";

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

function AIChatbotPage() {
  const [chatQuery, setChatQuery] = useState("");
  const [chatResponses, setChatResponses] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatResponses]);

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

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center py-10 px-2">
      <div className="w-full max-w-5xl mx-auto bg-white/95 rounded-3xl shadow-2xl border-2 border-emerald-200 p-12 flex flex-col" style={{ minHeight: '70vh' }}>
        <header className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-6xl font-extrabold bg-gradient-to-r from-emerald-600 via-sky-500 to-green-600 bg-clip-text text-transparent drop-shadow-lg mb-4 tracking-tight">AI Chatbot</h1>
            <div className="mt-2 h-1 w-full bg-gradient-to-r from-emerald-600 via-sky-600 to-green-600 rounded-full"></div>
          </div>
          <p className="text-2xl text-gray-700 mt-6 font-medium">
            Ask anything about solar panels, faults, maintenance, or how to use the app.
          </p>
        </header>
        <div className="flex-1 overflow-y-auto mb-8 max-h-[70vh] pr-2 custom-scrollbar bg-emerald-50/40 rounded-2xl p-8 shadow-inner border border-emerald-100">
          {chatResponses.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-xl">Start a conversation with the AI assistant!</div>
          )}
          {chatResponses.map((res, idx) => (
            <div key={idx} className={`flex ${res.type === "user" ? "justify-end" : "justify-start"} mb-4`}>
              <div className={`rounded-2xl px-8 py-6 max-w-4xl shadow-2xl text-lg leading-relaxed ${res.type === "user" ? "bg-gradient-to-r from-sky-400 to-emerald-400 text-white" : "bg-white border-2 border-emerald-200 text-gray-900"}`}>
                {res.type === "bot"
                  ? (
                    <div className="space-y-4">
                      {res.message.split(/\n(?=\d+\.|\*\*|\* )/).map((section, sidx) => {
                        // Heading: numbered or bolded
                        const headingMatch = section.match(/^(\d+\.|\*\*[^*]+\*\*|[A-Z][^:]+:|\* )(.+)?/);
                        let heading = '';
                        let content = section;
                        if (headingMatch) {
                          heading = headingMatch[1].replace(/[:.]/g, '').replace(/\*\*/g, '').trim();
                          content = section.replace(headingMatch[1], '').trim();
                        }
                        // Group all bullet points in this section
                        const lines = content.split(/\n/);
                        const bullets = lines.filter(line => line.trim().startsWith('* '));
                        const rest = lines.filter(line => !line.trim().startsWith('* ')).join('\n');
                        return (
                          <div key={sidx} className="">
                            {heading && (
                              <div className="font-semibold text-emerald-700 text-lg mb-2 flex items-center gap-2">
                                <span>{heading}</span>
                              </div>
                            )}
                            <div className="text-gray-800 text-base space-y-2">
                              {rest && rest.split(/\n/).map((line, i) => {
                                // Bold text
                                const bold = line.match(/\*\*([^*]+)\*\*/);
                                if (bold) {
                                  return <div key={i}><strong>{bold[1]}</strong>{line.replace(bold[0], '')}</div>;
                                }
                                return <div key={i}>{line}</div>;
                              })}
                              {bullets.length > 0 && (
                                <ul className="list-disc pl-6 mt-2">
                                  {bullets.map((b, j) => <li key={j} className="text-gray-900">{b.replace(/^\* /, '')}</li>)}
                                </ul>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                  : (
                    <div className="whitespace-pre-wrap">{res.message}</div>
                  )}
                <div className="text-xs text-right text-gray-400 mt-2">{formatTimestamp(res.timestamp)}</div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleChat} className="flex gap-4 mt-2 items-center">
          <input
            type="text"
            style={{ backgroundColor: '#fff', color: '#222' }}
            className="flex-1 rounded-2xl border border-emerald-300 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-700 text-lg shadow"
            placeholder="Type your question..."
            value={chatQuery}
            onChange={e => setChatQuery(e.target.value)}
            disabled={chatLoading}
          />
          <button
            type="submit"
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-bold shadow-lg hover:opacity-90 transition text-xl"
            disabled={chatLoading || chatQuery.trim() === ""}
          >
            {chatLoading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AIChatbotPage; 