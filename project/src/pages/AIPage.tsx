import { useNavigate } from "react-router-dom";
import {
  Bot,
  ChevronRight,
  ClipboardList,
  Sparkles,
  Wrench,
} from "lucide-react";

function AIPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070b12] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[32px] border border-slate-800 bg-gradient-to-br from-[#0f1623] to-[#0b1018] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="mb-8 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI tools
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Solar AI Assistance Hub
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
              Use the context-aware chatbot for panel questions and the repair
              planner for actionable fault diagnosis. Both tools read live MySQL
              panel data and recent inspection history.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[28px] border border-slate-800 bg-[#0c1118] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-cyan-500/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                <Bot className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">
                AI Chatbot
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Ask questions about a selected panel, recent inspection records,
                image evidence, or the next action to take.
              </p>
              <button
                onClick={() => navigate("/ai-chatbot")}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Open Chatbot <ChevronRight className="h-4 w-4" />
              </button>
            </section>

            <section className="rounded-[28px] border border-slate-800 bg-[#0c1118] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-amber-500/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                <Wrench className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">
                AI Fault Diagnosis
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Generate a repair plan with diagnosis summary, tools, safety
                notes, estimated time, and preventive maintenance.
              </p>
              <button
                onClick={() => navigate("/ai-fault-diagnosis")}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Open Repair Planner <ChevronRight className="h-4 w-4" />
              </button>
            </section>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <ClipboardList className="h-5 w-5 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-white">
                Live panel context
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Reads MySQL panel state, recent inspections, and stored images.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <Sparkles className="h-5 w-5 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-white">
                Follow-up memory
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Keeps the current session on the same panel across follow-up
                questions.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <Wrench className="h-5 w-5 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-white">
                Repair-ready output
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Returns field-ready steps instead of a vague generic response.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIPage;
