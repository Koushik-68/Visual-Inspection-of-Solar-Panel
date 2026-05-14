import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CalendarClock,
  MessageSquare,
  PanelTop,
  Send,
  Sparkles,
} from "lucide-react";
import { usePanels } from "../context/PanelContext";
import {
  getPanelContext,
  sendChatMessage,
  PanelContextResponse,
} from "../api/aiApi";

interface Message {
  type: "user" | "bot";
  message: string;
  timestamp: Date;
}

const STORAGE_KEY = "solar-ai-chat-session-id";

function formatTimestamp(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AIChatbotPage() {
  const { panels, loadingPanels } = usePanels();
  const [selectedPanelId, setSelectedPanelId] = useState("");
  const [chatQuery, setChatQuery] = useState("");
  const [chatResponses, setChatResponses] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [panelContext, setPanelContext] = useState<PanelContextResponse | null>(
    null,
  );
  const [contextLoading, setContextLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedPanel = useMemo(
    () => panels.find((panel) => panel.id === selectedPanelId),
    [panels, selectedPanelId],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatResponses]);

  useEffect(() => {
    const existingSessionId = localStorage.getItem(STORAGE_KEY);
    if (existingSessionId) {
      setSessionId(existingSessionId);
      return;
    }

    const newSessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `session-${Date.now()}`;
    localStorage.setItem(STORAGE_KEY, newSessionId);
    setSessionId(newSessionId);
  }, []);

  useEffect(() => {
    if (!selectedPanelId && panels.length > 0) {
      setSelectedPanelId(panels[0].id);
    }
  }, [panels, selectedPanelId]);

  useEffect(() => {
    const loadPanelContext = async () => {
      if (!selectedPanelId) {
        setPanelContext(null);
        return;
      }

      setContextLoading(true);
      try {
        const context = await getPanelContext(selectedPanelId);
        setPanelContext(context);
      } catch (contextError) {
        console.error("Failed to load panel context:", contextError);
        setPanelContext(null);
      } finally {
        setContextLoading(false);
      }
    };

    loadPanelContext();
  }, [selectedPanelId]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();

    if (chatQuery.trim() === "" || chatLoading) return;

    setChatLoading(true);
    setError("");

    const userMessage = chatQuery.trim();

    setChatResponses((prev) => [
      ...prev,
      {
        type: "user",
        message: userMessage,
        timestamp: new Date(),
      },
    ]);

    setChatQuery("");

    try {
      const response = await sendChatMessage({
        message: userMessage,
        panelId: selectedPanelId || undefined,
        sessionId,
      });

      if (response.sessionId && response.sessionId !== sessionId) {
        localStorage.setItem(STORAGE_KEY, response.sessionId);
        setSessionId(response.sessionId);
      }

      if (response.context) {
        setPanelContext(response.context);
      }

      setChatResponses((prev) => [
        ...prev,
        {
          type: "bot",
          message: response.answer || "Sorry, I couldn't find an answer.",
          timestamp: new Date(),
        },
      ]);
    } catch (requestError: any) {
      console.error(requestError);

      const errorMessage =
        requestError?.response?.data?.message ||
        "There was an error fetching the response.";

      setError(errorMessage);

      setChatResponses((prev) => [
        ...prev,
        {
          type: "bot",
          message: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const quickQuestions = [
    "Why is this panel marked high priority?",
    "What should I check first?",
    "Summarize the latest inspection history.",
    "What maintenance is recommended next?",
  ];

  const activeFault =
    selectedPanel?.currentFault?.description || "No issues detected";

  return (
    <div className="min-h-screen bg-[#070b12] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#0f1623] to-[#0b1018] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" />
                Context-aware assistant
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                AI Chatbot
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                Ask panel-specific questions using live panel data, recent
                inspections, and stored images. The assistant remembers the
                current session so follow-up questions stay on context.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Session
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {sessionId ? sessionId.slice(0, 12) : "Initializing"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Selected Panel
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {selectedPanelId || "None selected"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Status
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {loadingPanels || contextLoading
                    ? "Loading live context"
                    : "Ready to assist"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[28px] border border-slate-800 bg-[#0c1118] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                  <PanelTop className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Panel Context
                  </h2>
                  <p className="text-sm text-slate-400">
                    Choose a panel to make the conversation specific.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Select Panel
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-700 bg-[#111722] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
                    value={selectedPanelId}
                    onChange={(e) => setSelectedPanelId(e.target.value)}
                  >
                    <option value="">Select a panel</option>
                    {panels.map((panel) => (
                      <option key={panel.id} value={panel.id}>
                        {panel.id} - {panel.currentFault.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <MessageSquare className="h-4 w-4 text-cyan-300" />
                    Live panel summary
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <p>
                      <span className="text-slate-500">Fault:</span>{" "}
                      {activeFault}
                    </p>
                    <p>
                      <span className="text-slate-500">Priority:</span>{" "}
                      {selectedPanel?.priority || "low"}
                    </p>
                    <p>
                      <span className="text-slate-500">Company:</span>{" "}
                      {selectedPanel?.companyName || "Unknown"}
                    </p>
                    <p>
                      <span className="text-slate-500">Maintenance:</span>{" "}
                      {selectedPanel?.maintenanceSuggestion ||
                        "No maintenance suggestion available"}
                    </p>
                  </div>
                </div>

                {panelContext?.panel?.image ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                    <div className="border-b border-slate-800 px-4 py-3 text-sm font-medium text-slate-200">
                      Latest inspection image
                    </div>
                    <img
                      src={String(panelContext.panel.image)}
                      alt="Latest panel inspection"
                      className="h-56 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-5 text-sm text-slate-400">
                    No inspection image is available for the selected panel yet.
                  </div>
                )}

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <CalendarClock className="h-4 w-4 text-cyan-300" />
                    Quick questions
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickQuestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => setChatQuery(question)}
                        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-500 hover:text-white"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-800 bg-[#0c1118] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <h3 className="text-base font-semibold text-white">
                How it works
              </h3>
              <ol className="mt-4 space-y-3 text-sm text-slate-300">
                <li className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                  1. Select a panel to load its live context.
                </li>
                <li className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                  2. Ask a question about the fault, history, or next action.
                </li>
                <li className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                  3. Keep asking follow-ups and the assistant will remember the
                  session.
                </li>
              </ol>
            </section>
          </aside>

          <main className="rounded-[28px] border border-slate-800 bg-[#0c1118] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Conversation
                </h2>
                <p className="text-sm text-slate-400">
                  Panel-specific answers with recent inspection memory.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Bot className="h-3.5 w-3.5" />
                AI assistant online
              </div>
            </div>

            <div className="max-h-[66vh] overflow-y-auto px-5 py-5">
              {chatResponses.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-slate-700 bg-slate-950/40 px-6 py-14 text-center text-slate-400">
                  Start with a panel-specific question or pick a quick
                  suggestion from the left.
                </div>
              )}

              <div className="space-y-4">
                {chatResponses.map((res, idx) => (
                  <div
                    key={idx}
                    className={`flex ${res.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-4xl rounded-[22px] border px-5 py-4 text-sm leading-6 shadow-lg sm:text-base ${
                        res.type === "user"
                          ? "border-cyan-500/20 bg-cyan-500/15 text-white"
                          : "border-slate-700 bg-slate-950/80 text-slate-100"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{res.message}</div>
                      <div className="mt-2 text-xs text-slate-400">
                        {formatTimestamp(res.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>

            <div className="border-t border-slate-800 px-5 py-5">
              {error && (
                <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleChat}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="text"
                  className="flex-1 rounded-2xl border border-slate-700 bg-[#111722] px-5 py-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
                  placeholder={
                    selectedPanelId
                      ? "Ask about this panel, its history, or what to check next..."
                      : "Select a panel or ask a general solar maintenance question..."
                  }
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  disabled={chatLoading}
                />

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={chatLoading || chatQuery.trim() === ""}
                >
                  <Send className="h-4 w-4" />
                  {chatLoading ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AIChatbotPage;
