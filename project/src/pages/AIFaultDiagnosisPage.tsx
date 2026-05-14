import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  PanelTop,
  Sparkles,
  Wrench,
} from "lucide-react";
import { usePanels } from "../context/PanelContext";
import { Panel } from "../types";
import {
  generateRepairPlan,
  getPanelContext,
  PanelContextResponse,
} from "../api/aiApi";

function AIFaultDiagnosisPage() {
  const { panels } = usePanels();

  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const [repairPlan, setRepairPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [panelSearch, setPanelSearch] = useState("");
  const [panelContext, setPanelContext] = useState<PanelContextResponse | null>(
    null,
  );
  const [contextLoading, setContextLoading] = useState(false);
  const [focusHint, setFocusHint] = useState("");

  const selectedPanelId = useMemo(
    () => selectedPanel?.id || "",
    [selectedPanel],
  );
  const selectedPanelSummary = panelContext?.panel as
    | { image?: string }
    | undefined;

  useEffect(() => {
    if (!selectedPanel && panels.length > 0) {
      setSelectedPanel(panels[0]);
    }
  }, [panels, selectedPanel]);

  useEffect(() => {
    const loadContext = async () => {
      if (!selectedPanelId) {
        setPanelContext(null);
        return;
      }

      setContextLoading(true);
      try {
        const context = await getPanelContext(selectedPanelId);
        setPanelContext(context);
      } catch (contextError) {
        console.error("Failed to load diagnosis context:", contextError);
        setPanelContext(null);
      } finally {
        setContextLoading(false);
      }
    };

    loadContext();
  }, [selectedPanelId]);

  const handleDiagnose = async () => {
    if (!selectedPanel) return;

    setLoading(true);
    setError("");
    setRepairPlan("");

    try {
      const response = await generateRepairPlan({
        panelId: selectedPanel.id,
        requestType: focusHint || undefined,
      });

      setRepairPlan(
        response.plan || "Sorry, I couldn't generate a repair plan.",
      );

      if (response.context) {
        setPanelContext(response.context);
      }
    } catch (requestError: any) {
      console.error(requestError);
      setError(
        requestError?.response?.data?.message ||
          "Failed to generate repair plan. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#0f1623] to-[#0b1018] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                Repair plan generator
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                AI Fault Diagnosis
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                Pick a panel, inspect its current fault and history, then
                generate a repair plan with clear steps, tools, safety notes,
                and preventive guidance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Panel
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {selectedPanel?.id || "None selected"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Priority
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {selectedPanel?.priority || "low"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Status
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {loading || contextLoading ? "Loading context" : "Ready"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[28px] border border-slate-800 bg-[#0c1118] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  <PanelTop className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Select Panel
                  </h2>
                  <p className="text-sm text-slate-400">
                    Search and choose the panel that needs a repair plan.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  placeholder="Search panel number or ID..."
                  className="w-full rounded-2xl border border-slate-700 bg-[#111722] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-500"
                  value={panelSearch}
                  onChange={(e) => setPanelSearch(e.target.value)}
                />

                <select
                  className="w-full rounded-2xl border border-slate-700 bg-[#111722] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-500"
                  value={selectedPanel?.id || ""}
                  onChange={(e) => {
                    const panel = panels.find(
                      (entry) => entry.id === e.target.value,
                    );
                    setSelectedPanel(panel || null);
                  }}
                >
                  <option value="">Select a panel...</option>
                  {panels
                    .filter(
                      (panel) =>
                        panel.id
                          .toLowerCase()
                          .includes(panelSearch.toLowerCase()) ||
                        panel.currentFault.description
                          .toLowerCase()
                          .includes(panelSearch.toLowerCase()),
                    )
                    .map((panel) => (
                      <option key={panel.id} value={panel.id}>
                        {panel.id} - {panel.currentFault.description} (
                        {panel.currentFault.level})
                      </option>
                    ))}
                </select>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                  <div className="mb-3 flex items-center gap-2 text-slate-200">
                    <ClipboardList className="h-4 w-4 text-amber-300" />
                    Selected panel snapshot
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="text-slate-500">Fault:</span>{" "}
                      {selectedPanel?.currentFault.description ||
                        "No issues detected"}
                    </p>
                    <p>
                      <span className="text-slate-500">Fault level:</span>{" "}
                      {selectedPanel?.currentFault.level || "none"}
                    </p>
                    <p>
                      <span className="text-slate-500">Priority:</span>{" "}
                      {selectedPanel?.priority || "low"}
                    </p>
                    <p>
                      <span className="text-slate-500">Company:</span>{" "}
                      {selectedPanel?.companyName || "Unknown"}
                    </p>
                  </div>
                </div>

                {selectedPanelSummary?.image ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                    <div className="border-b border-slate-800 px-4 py-3 text-sm font-medium text-slate-200">
                      Latest inspection image
                    </div>
                    <img
                      src={String(selectedPanelSummary.image)}
                      alt="Selected panel"
                      className="h-56 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-5 text-sm text-slate-400">
                    No inspection image is available for this panel yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-800 bg-[#0c1118] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                Repair focus options
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "Loose connector repair",
                  "Hotspot mitigation",
                  "Cracked panel handling",
                  "Cleaning and preventive maintenance",
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFocusHint(option)}
                    className={`rounded-full border px-3 py-2 text-left text-xs transition ${
                      focusHint === option
                        ? "border-amber-500 bg-amber-500/15 text-amber-200"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500 hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {focusHint
                  ? `Focused on: ${focusHint}`
                  : "Tip: choose a focus option to guide the generated plan."}
              </p>
            </section>
          </aside>

          <main className="rounded-[28px] border border-slate-800 bg-[#0c1118] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Repair Plan
                </h2>
                <p className="text-sm text-slate-400">
                  Generate a structured, field-ready response from live panel
                  context.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                <Wrench className="h-3.5 w-3.5" />
                AI repair assistant
              </div>
            </div>

            <div className="px-5 py-5">
              <button
                onClick={handleDiagnose}
                disabled={!selectedPanel || loading}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  !selectedPanel || loading
                    ? "bg-slate-700 text-slate-300"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110"
                }`}
              >
                {loading ? "Generating plan..." : "Generate Repair Plan"}
              </button>

              {error && (
                <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <div className="mt-5 rounded-[24px] border border-slate-800 bg-slate-950/70 p-5">
                {repairPlan ? (
                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200 sm:text-base">
                    {repairPlan}
                  </div>
                ) : (
                  <div className="py-14 text-center text-sm text-slate-400">
                    Select a panel and generate the repair plan to see diagnosis
                    details here.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-300">
                <div className="mb-3 flex items-center gap-2 text-slate-200">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  Live context preview
                </div>
                <div className="space-y-2">
                  <p>
                    <span className="text-slate-500">Context status:</span>{" "}
                    {contextLoading
                      ? "Loading panel history"
                      : panelContext
                        ? "Loaded"
                        : "Not loaded yet"}
                  </p>
                  <p>
                    <span className="text-slate-500">Inspection count:</span>{" "}
                    {panelContext?.inspections?.length || 0}
                  </p>
                  <p>
                    <span className="text-slate-500">Current fault:</span>{" "}
                    {selectedPanel?.currentFault.description ||
                      "No issues detected"}
                  </p>
                  <p>
                    <span className="text-slate-500">
                      Maintenance suggestion:
                    </span>{" "}
                    {selectedPanel?.maintenanceSuggestion ||
                      "No maintenance suggestion available"}
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AIFaultDiagnosisPage;
