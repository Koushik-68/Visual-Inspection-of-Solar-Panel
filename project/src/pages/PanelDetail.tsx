import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Download,
  ArrowLeft,
  AlertTriangle,
  Info,
  Sun,
  History,
  Wrench,
  Calendar,
  MapPin,
  Maximize,
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { usePanels } from "../context/PanelContext";
import { formatDate } from "../utils/panelUtils";
import { generatePanelReport } from "../utils/reportUtils";
import Spinner from "../components/common/Spinner";
import "../styles/animations.css";
import PanelRegistrationForm, {
  PanelData,
} from "../components/PanelRegistrationForm";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Label,
} from "recharts";

const PanelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPanelById, updatePanel, setPanels } = usePanels();
  const [panel, setPanel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [localPanelData, setLocalPanelData] = useState<PanelData | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const refreshData = async () => {
      try {
        // Periodically refresh panels from the main backend (MySQL)
        const res = await fetch("http://localhost:5000/api/user/panels", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch panels from backend");
        }
        const data = await res.json();
        setPanels(data);
        if (id) {
          const updatedPanel = data.find((p: any) => p.id === id);
          if (updatedPanel) {
            setPanel(updatedPanel);
          }
        }
      } catch (error) {
        console.error("Error refreshing panel data:", error);
      }
    };

    // Refresh every 5 seconds
    const interval = setInterval(refreshData, 5000);

    return () => clearInterval(interval);
  }, [id, setPanels]);

  useEffect(() => {
    if (id) {
      const panelData = getPanelById(id);
      if (panelData) {
        setPanel(panelData);
      }
      setLoading(false);
    }
  }, [id, getPanelById]);

  // Load latest inspection history (up to 3 records) for this panel
  useEffect(() => {
    const fetchHistory = async () => {
      if (!id) return;
      try {
        const res = await fetch(
          `http://localhost:5000/api/user/panels/${encodeURIComponent(id)}/history`,
          {
            credentials: "include",
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        setHistory(data || []);
      } catch (err) {
        console.error("Error fetching panel history:", err);
      }
    };

    fetchHistory();
  }, [id]);

  const getFaultLevelBgClass = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-600 text-white";
      case "medium":
        return "bg-yellow-600 text-white";
      case "low":
        return "bg-yellow-500 text-white";
      default:
        return "bg-green-600 text-white";
    }
  };

  const handleDownloadReport = () => {
    if (panel) {
      generatePanelReport(panel);
    }
  };

  // Helper to map Panel to PanelData
  const panelToPanelData = (panel: any): PanelData => ({
    company: panel.companyName || "",
    model: panel.model || (panel.Model != null ? String(panel.Model) : ""),
    maxOutput: panel.maxOutput || 0,
    dimensions: {
      width: panel.size?.width || 0,
      height: panel.size?.height || 0,
    },
    weight: panel.weight || 0,
    efficiency: panel.efficiency || 0,
    installationDate: panel.installationDate || "",
  });

  // Helper to map PanelData to Panel
  const updatePanelFromForm = (panel: any, data: PanelData) => ({
    ...panel,
    companyName: data.company,
    model: data.model,
    maxOutput: data.maxOutput,
    size: { width: data.dimensions.width, height: data.dimensions.height },
    weight: data.weight,
    efficiency: data.efficiency,
    installationDate: data.installationDate,
  });

  const handlePanelEdit = (data: PanelData) => {
    if (!panel) return;
    const updated = updatePanelFromForm(panel, data);
    updatePanel(updated);
    setPanel(updated);
    setEditMode(false);
  };

  // Map fault description to priority level
  const getPriorityFromDescription = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes("physical")) return "high";
    if (desc.includes("dust") || desc.includes("bird") || desc.includes("snow"))
      return "medium";
    if (desc.includes("clean")) return "low";
    return "none";
  };

  // Use mapped priority for display, but only if panel and panel.currentFault exist
  let mappedPriority = "none";
  let faultLevelColor = "#10b981";
  let faultDescription = "";
  if (panel && panel.currentFault) {
    mappedPriority = getPriorityFromDescription(panel.currentFault.description);
    faultLevelColor =
      mappedPriority === "high"
        ? "#ef4444"
        : mappedPriority === "medium"
          ? "#f59e0b"
          : mappedPriority === "low"
            ? "#fbbf24"
            : "#10b981";
    faultDescription = panel.currentFault.description;
  }

  // Set maintenance suggestion based on mapped priority
  let maintenanceSuggestion =
    panel && panel.maintenanceSuggestion ? panel.maintenanceSuggestion : "";
  if (mappedPriority === "low")
    maintenanceSuggestion = "No immediate action required";
  else if (mappedPriority === "medium")
    maintenanceSuggestion = "Regular cleaning recommended";
  else if (mappedPriority === "high")
    maintenanceSuggestion = "Repair/Replacement needed";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse-slow">
          <Spinner size="lg" text="Loading panel details..." />
        </div>
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="text-center py-12 animate-fadeIn">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4 animate-pulse-slow" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Panel Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The panel you're looking for doesn't exist or has been removed.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate("/panels")}
          className="animate-pulse-subtle"
        >
          Back to Panel Grid
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 bg-gray-50 min-h-screen -m-6 p-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg -m-6 mb-6 p-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3 animate-slideInLeft">
              <Button
                variant="outline"
                size="sm"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => navigate("/panels")}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Back
              </Button>
              <div className="flex items-center">
                <Sun className="h-6 w-6 mr-2 text-yellow-300 animate-float" />
                <h1 className="text-2xl font-bold">{panel.id}</h1>
              </div>
            </div>
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={handleDownloadReport}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 animate-slideInRight"
            >
              Download Report
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <div
              className={`flex items-center space-x-2 rounded-full px-4 py-2 animate-fadeIn ${getFaultLevelBgClass(mappedPriority)}`}
              style={{ animationDelay: "0.3s" }}
            >
              <AlertTriangle className="h-4 w-4 text-white" />
              <span>
                Status:{" "}
                <span className="font-semibold capitalize">
                  {mappedPriority === "none"
                    ? "Healthy"
                    : `${mappedPriority} priority`}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card
              title="Panel Information"
              className="overflow-hidden transition-all duration-300 hover:shadow-md animate-slideInLeft"
            >
              {editMode ? (
                <PanelRegistrationForm
                  mode="edit"
                  initialData={localPanelData || panelToPanelData(panel)}
                  onSubmit={handlePanelEdit}
                  isLoading={false}
                />
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditMode(true)}
                    >
                      Edit
                    </Button>
                  </div>
                  {/* Creative Priority Badge at the top center */}
                  <div className="flex justify-center mb-4">
                    <span
                      className={`inline-block px-6 py-2 rounded-full font-semibold text-lg shadow-md border-2 transition-all duration-300
                      ${
                        mappedPriority === "high"
                          ? "bg-red-100 text-red-700 border-red-400"
                          : mappedPriority === "medium"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-400"
                            : mappedPriority === "low"
                              ? "bg-green-100 text-green-700 border-green-400"
                              : "bg-blue-100 text-blue-700 border-blue-400"
                      }
                    `}
                    >
                      Priority:{" "}
                      <span className="capitalize">
                        {mappedPriority === "none"
                          ? "Healthy"
                          : `${mappedPriority} priority`}
                      </span>
                    </span>
                  </div>
                  {/* Panel Image Folder Section */}
                  {panel.image && (
                    <div className="mb-4 flex flex-col items-center">
                      <div className="w-80 h-64 bg-gray-200 rounded-lg shadow-inner border-2 border-amber-400 flex items-center justify-center relative mb-2">
                        <img
                          src={panel.image}
                          alt="Panel"
                          className="object-contain max-h-60 max-w-full rounded-md shadow-md"
                          style={{
                            background:
                              "linear-gradient(135deg, #fcd34d33 0%, #fbbf2433 100%)",
                          }}
                        />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-amber-400 rounded-b-lg shadow-md"></div>
                      </div>
                      <span className="text-xs text-gray-500">Panel Image</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border border-gray-100 bg-white transition-all duration-300 hover:bg-gray-50">
                      <div className="flex items-center mb-2">
                        <Info className="h-4 w-4 text-blue-500 mr-2" />
                        <p className="text-sm font-medium text-gray-600">
                          Company Name
                        </p>
                      </div>
                      <p className="text-base text-gray-900 pl-6">
                        {localPanelData
                          ? localPanelData.company
                          : panel.companyName || ""}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-100 bg-white transition-all duration-300 hover:bg-gray-50">
                      <div className="flex items-center mb-2">
                        <Info className="h-4 w-4 text-blue-500 mr-2" />
                        <p className="text-sm font-medium text-gray-600">
                          Model
                        </p>
                      </div>
                      <p className="text-base text-gray-900 pl-6">
                        {localPanelData
                          ? localPanelData.model
                          : panel.model ||
                            (panel.Model != null ? String(panel.Model) : "")}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-100 bg-white transition-all duration-300 hover:bg-gray-50">
                      <div className="flex items-center mb-2">
                        <Info className="h-4 w-4 text-blue-500 mr-2" />
                        <p className="text-sm font-medium text-gray-600">
                          Panel ID
                        </p>
                      </div>
                      <p className="text-base text-gray-900 pl-6">
                        {panel?.id || ""}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-100 bg-white transition-all duration-300 hover:bg-gray-50">
                      <div className="flex items-center mb-2">
                        <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                        <p className="text-sm font-medium text-gray-600">
                          Position
                        </p>
                      </div>
                      <p className="text-base text-gray-900 pl-6">
                        {panel?.position
                          ? `Row ${panel.position.row}, Column ${panel.position.column}`
                          : ""}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-100 bg-white transition-all duration-300 hover:bg-gray-50">
                      <div className="flex items-center mb-2">
                        <Maximize className="h-4 w-4 text-blue-500 mr-2" />
                        <p className="text-sm font-medium text-gray-600">
                          Size
                        </p>
                      </div>
                      <p className="text-base text-gray-900 pl-6">
                        {localPanelData
                          ? `${localPanelData.dimensions.width}m × ${localPanelData.dimensions.height}m`
                          : panel.size
                            ? `${panel.size.width}m × ${panel.size.height}m`
                            : ""}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-100 bg-white transition-all duration-300 hover:bg-gray-50">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                        <p className="text-sm font-medium text-gray-600">
                          Installation Date
                        </p>
                      </div>
                      <p className="text-base text-gray-900 pl-6">
                        {localPanelData
                          ? localPanelData.installationDate
                          : panel.installationDate || ""}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-100 bg-white transition-all duration-300 hover:bg-gray-50">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                        <p className="text-sm font-medium text-gray-600">
                          Last Inspection
                        </p>
                      </div>
                      <p className="text-base text-gray-900 pl-6">
                        {panel?.lastInspection
                          ? formatDate(panel.lastInspection)
                          : ""}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card
              title="Current Fault Status"
              className={`overflow-hidden transition-all duration-300 hover:shadow-md animate-slideInRight border-t-4 border-t-[${faultLevelColor}]`}
            >
              <div
                className={`p-4 rounded-md animate-fadeIn transform transition-all duration-300 hover:scale-[1.02] ${
                  mappedPriority === "high"
                    ? "bg-red-50 border border-red-200"
                    : mappedPriority === "medium"
                      ? "bg-yellow-50 border border-yellow-200"
                      : mappedPriority === "low"
                        ? "bg-yellow-50 border border-yellow-100"
                        : "bg-green-50 border border-green-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium flex items-center">
                    <AlertTriangle
                      className={`h-4 w-4 mr-2 ${
                        mappedPriority === "high"
                          ? "text-red-600"
                          : mappedPriority === "medium"
                            ? "text-yellow-600"
                            : mappedPriority === "low"
                              ? "text-yellow-600"
                              : "text-green-600"
                      }`}
                    />
                    <span
                      className={
                        mappedPriority === "high"
                          ? "text-red-800"
                          : mappedPriority === "medium"
                            ? "text-yellow-900"
                            : mappedPriority === "low"
                              ? "text-yellow-800"
                              : "text-green-800"
                      }
                    >
                      {mappedPriority === "none"
                        ? "No Fault Detected"
                        : `${mappedPriority.charAt(0).toUpperCase() + mappedPriority.slice(1)} Priority Fault`}
                    </span>
                  </h3>
                </div>
                <p
                  className={`text-sm ml-6 ${
                    mappedPriority === "high"
                      ? "text-red-700"
                      : mappedPriority === "medium"
                        ? "text-yellow-800"
                        : mappedPriority === "low"
                          ? "text-yellow-800"
                          : "text-green-700"
                  }`}
                >
                  {faultDescription}
                </p>
              </div>

              <div
                className="mt-6 bg-gray-50 p-4 rounded-lg animate-fadeIn"
                style={{ animationDelay: "0.2s" }}
              >
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <Wrench className="h-4 w-4 text-blue-500 mr-2" />
                  Maintenance Suggestion
                </h3>
                <p className="text-sm text-gray-700 ml-6 border-l-2 border-blue-200 pl-3 py-2">
                  {maintenanceSuggestion}
                </p>
              </div>
            </Card>

            <Card
              title="Inspection History"
              className="overflow-hidden transition-all duration-300 hover:shadow-md animate-slideInRight"
            >
              {history.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {history.map((record: any, index: number) => (
                    <div
                      key={index}
                      className="border-l-4 pl-4 py-3 rounded-r-lg transition-all duration-300 hover:shadow-md animate-fadeIn"
                      style={{
                        borderLeftColor:
                          record.faultLevel === "high"
                            ? "#ef4444"
                            : record.faultLevel === "medium"
                              ? "#f59e0b"
                              : record.faultLevel === "low"
                                ? "#fbbf24"
                                : "#10b981",
                        animationDelay: `${0.1 * index}s`,
                        backgroundColor: "white",
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <History className="h-4 w-4 mr-2 text-gray-500" />
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(record.date)}
                          </p>
                        </div>
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full text-white ${
                            record.faultLevel === "high"
                              ? "bg-red-600"
                              : record.faultLevel === "medium"
                                ? "bg-yellow-600"
                                : record.faultLevel === "low"
                                  ? "bg-yellow-500"
                                  : "bg-green-600"
                          }`}
                        >
                          {record.faultLevel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 ml-6">
                        {record.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 ml-6 flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        Inspector: {record.inspector}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg animate-fadeIn">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    No inspection history available.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Graph Section - At the bottom */}
        <div className="mt-6">
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-2xl animate-fadeIn bg-white border-0 relative">
            {/* Title as a blue button */}
            <div className="flex justify-center mb-4">
              <div className="bg-blue-500 text-white px-8 py-2 rounded-full font-semibold text-lg shadow-lg">
                ⚡ Priority Trend Analysis ⚡
              </div>
            </div>

            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">
                Inspection Priority History
              </h2>

              <div style={{ width: "100%", height: 320 }} className="relative">
                <ResponsiveContainer>
                  <LineChart
                    data={history.map((record: any) => ({
                      date: record.date,
                      priority: (() => {
                        const desc = record.description?.toLowerCase() || "";
                        if (desc.includes("physical")) return 3; // High
                        if (
                          desc.includes("dust") ||
                          desc.includes("bird") ||
                          desc.includes("snow")
                        )
                          return 2; // Medium
                        if (
                          desc.includes("clean") ||
                          desc.includes("no fault") ||
                          desc.includes("healthy")
                        )
                          return 1; // Low/No fault
                        return 1; // Default to low/no fault
                      })(),
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date: string) =>
                        new Date(date).toLocaleDateString()
                      }
                      stroke="#4a5568"
                    >
                      <Label
                        value="Inspection Date"
                        offset={-10}
                        position="insideBottom"
                      />
                    </XAxis>
                    <YAxis
                      type="number"
                      domain={[1, 3]}
                      ticks={[1, 2, 3]}
                      tickFormatter={(val: number) =>
                        val === 1
                          ? "No Fault/Low"
                          : val === 2
                            ? "Medium"
                            : "High"
                      }
                      allowDecimals={false}
                      width={100}
                    />
                    <Tooltip
                      labelFormatter={(date: string) =>
                        `Date: ${new Date(date).toLocaleString()}`
                      }
                      formatter={(value: number) =>
                        value === 1
                          ? "No Fault/Low"
                          : value === 2
                            ? "Medium"
                            : "High"
                      }
                    />
                    {/* Color areas for Y axis sections */}
                    <ReferenceArea
                      y1={0.5}
                      y2={1.5}
                      fill="#bbf7d0"
                      fillOpacity={0.2}
                    />
                    <ReferenceArea
                      y1={1.5}
                      y2={2.5}
                      fill="#fef9c3"
                      fillOpacity={0.2}
                    />
                    <ReferenceArea
                      y1={2.5}
                      y2={3.5}
                      fill="#fecaca"
                      fillOpacity={0.2}
                    />
                    <Line
                      type="monotone"
                      dataKey="priority"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{
                        r: 4,
                        stroke: "#6366f1",
                        strokeWidth: 2,
                        fill: "#fff",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Bottom legend with colored dots */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-sm text-gray-600">No Fault/Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span className="text-sm text-gray-600">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <span className="text-sm text-gray-600">High</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PanelDetail;
