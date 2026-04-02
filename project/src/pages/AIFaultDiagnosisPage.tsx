import { useState } from "react";
import axios from "axios";
import { usePanels } from "../context/PanelContext";
import { Panel } from "../types";

interface ApiResponse {
  candidates?: { content: { parts: { text: string }[] } }[];
}

const GEMINI_API_KEY = "API_KEY_HERE";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

function AIFaultDiagnosisPage() {
  const { panels } = usePanels();
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [panelSearch, setPanelSearch] = useState("");

  const handleDiagnose = async () => {
    if (!selectedPanel) return;

    setLoading(true);
    setError("");
    setDiagnosis("");

    try {
      const prompt = `You are a solar panel fault diagnosis expert. Analyze the following panel data and provide a detailed diagnosis and repair recommendations.

Panel Information:
- ID: ${selectedPanel.id}
- Current Fault: ${selectedPanel.currentFault.description}
- Fault Level: ${selectedPanel.currentFault.level}
- Priority: ${selectedPanel.priority}
- Efficiency: ${selectedPanel.maxOutput > 0 ? Math.round((selectedPanel.currentOutput / selectedPanel.maxOutput) * 100) : 0}%
- Company: ${selectedPanel.companyName}

Please provide:
1. Detailed analysis of the fault
2. Step-by-step repair procedure
3. Required tools and materials
4. Safety precautions
5. Estimated repair time
6. Preventive measures to avoid similar issues

Format the response in clear sections with headings.`;

      const response = await axios.post<ApiResponse>(
        GEMINI_API_URL,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { "Content-Type": "application/json" } },
      );

      const diagnosisText =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a diagnosis.";

      setDiagnosis(diagnosisText);
    } catch (error) {
      setError("Failed to generate diagnosis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-orange-700 mb-6">
            AI Fault Diagnosis Assistant
          </h1>
          <p className="text-gray-600 mb-8">
            Select a panel to get detailed fault analysis, repair procedures,
            and maintenance recommendations.
          </p>

          {/* Panel Selection */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-2">
              Select Panel
            </label>
            {/* Panel Search Bar */}
            <input
              type="text"
              placeholder="Search panel number or ID..."
              className="w-full mb-3 p-3 rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-300 focus:border-orange-300 text-gray-900 placeholder-gray-400"
              value={panelSearch}
              onChange={(e) => setPanelSearch(e.target.value)}
            />
            <select
              className="w-full p-3 rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-300 focus:border-orange-300 text-gray-900 bg-white"
              style={{ color: "#1a202c", backgroundColor: "#fff" }}
              value={selectedPanel?.id || ""}
              onChange={(e) => {
                const panel = panels.find((p) => p.id === e.target.value);
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
                    (panel.currentFault.description &&
                      panel.currentFault.description
                        .toLowerCase()
                        .includes(panelSearch.toLowerCase())),
                )
                .map((panel) => (
                  <option
                    key={panel.id}
                    value={panel.id}
                    className="text-gray-900 bg-white"
                    style={{ color: "#1a202c", backgroundColor: "#fff" }}
                  >
                    {panel.id} - {panel.currentFault.description} (
                    {panel.currentFault.level})
                  </option>
                ))}
            </select>
          </div>

          {/* Diagnosis Button */}
          <button
            onClick={handleDiagnose}
            disabled={!selectedPanel || loading}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all
              ${
                !selectedPanel || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90"
              }`}
          >
            {loading ? "Analyzing..." : "Generate Diagnosis"}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
              {error}
            </div>
          )}

          {/* Diagnosis Result */}
          {diagnosis &&
            (() => {
              // Parse sections
              const sections = diagnosis.split(/\n(?=\d+\.|\*\*|\* )/);
              return (
                <div className="mt-8 p-6 bg-orange-50 rounded-xl border border-orange-200">
                  <h2 className="text-2xl font-bold text-orange-700 mb-4 flex items-center gap-2">
                    <span>Diagnosis Report</span>
                    <span className="text-amber-500">🩺</span>
                  </h2>
                  <div className="space-y-6">
                    {sections.map((section, idx) => {
                      // Heading: numbered or bolded
                      const headingMatch = section.match(
                        /^(\d+\.|\*\*[^*]+\*\*|[A-Z][^:]+:|\* )(.+)?/,
                      );
                      let heading = "";
                      let content = section;
                      if (headingMatch) {
                        heading = headingMatch[1]
                          .replace(/[:.]/g, "")
                          .replace(/\*\*/g, "")
                          .trim();
                        content = section.replace(headingMatch[1], "").trim();
                      }
                      // Group all bullet points in this section
                      const lines = content.split(/\n/);
                      const bullets = lines.filter((line) =>
                        line.trim().startsWith("* "),
                      );
                      const rest = lines
                        .filter((line) => !line.trim().startsWith("* "))
                        .join("\n");
                      return (
                        <div
                          key={idx}
                          className="bg-white rounded-xl shadow p-4 border-l-4 border-orange-300"
                        >
                          {heading && (
                            <div className="font-semibold text-orange-700 text-lg mb-2 flex items-center gap-2">
                              <span>{heading}</span>
                            </div>
                          )}
                          <div className="text-gray-800 text-base space-y-2">
                            {rest &&
                              rest.split(/\n/).map((line, i) => {
                                // Bold text
                                const bold = line.match(/\*\*([^*]+)\*\*/);
                                if (bold) {
                                  return (
                                    <div key={i}>
                                      <strong>{bold[1]}</strong>
                                      {line.replace(bold[0], "")}
                                    </div>
                                  );
                                }
                                return <div key={i}>{line}</div>;
                              })}
                            {bullets.length > 0 && (
                              <ul className="list-disc pl-6 mt-2">
                                {bullets.map((b, j) => (
                                  <li key={j} className="text-gray-900">
                                    {b.replace(/^\* /, "")}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}

export default AIFaultDiagnosisPage;
