import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Search as SearchIcon,
  Grid as GridIcon,
  Sun,
  X,
  ChevronDown,
  Edit,
  Trash,
  Plus,
  Move,
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { usePanels } from "../context/PanelContext";
import Spinner from "../components/common/Spinner";
import SearchBar from "../components/common/SearchBar";
import { generateGridReport } from "../utils/reportUtils";
import { Panel, FaultLevel } from "../types";
import "../styles/animations.css";
import { getCustomFaultLevelAndColor } from "../utils/panelUtils";

// Simple Panel Card component - extremely optimized
const PanelCard = React.memo(
  ({
    panel,
    onEdit,
    onDelete,
    isDraggable,
    onDragStart,
  }: {
    panel: Panel;
    onEdit?: (panel: Panel) => void;
    onDelete?: (panel: Panel) => void;
    isDraggable?: boolean;
    onDragStart?: (e: React.DragEvent, panel: Panel) => void;
  }) => {
    if (!panel) return null;

    // Use custom color mapping based on description
    const { color: bgColor, level } = getCustomFaultLevelAndColor(
      panel.currentFault.description
    );
    const textColor =
      level === "high"
        ? "text-white"
        : level === "medium"
        ? "text-gray-900"
        : "text-white";

    // Short description with fewer characters for performance
    const shortDescription =
      panel.currentFault.description.length <= 15
        ? panel.currentFault.description
        : panel.currentFault.description.substring(0, 15) + "...";

    // Output percentage
    const outputPercentage = Math.round(
      (panel.currentOutput / panel.maxOutput) * 100
    );

    // Handle panel card click
    const handleClick = (e: React.MouseEvent) => {
      // Only trigger click events if we're not in edit mode with actions
      if (!onEdit && !onDelete) return;

      // Stop propagation to prevent navigation when in edit mode
      e.preventDefault();
      e.stopPropagation();
    };

    // Handle edit button click
    const handleEdit = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onEdit) onEdit(panel);
    };

    // Handle delete button click
    const handleDelete = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onDelete) onDelete(panel);
    };

    // Handle drag start
    const handleDragStart = (e: React.DragEvent) => {
      if (isDraggable && onDragStart) {
        // Delay setting data to avoid Firefox bugs
        setTimeout(() => {
          e.dataTransfer.setData("text/plain", panel.id);
        }, 0);

        // Set drag effect
        e.dataTransfer.effectAllowed = "move";

        // Set ghost image for drag operation
        try {
          const ghostElement = document.createElement("div");
          ghostElement.classList.add(
            bgColor,
            textColor,
            "p-3",
            "rounded-lg",
            "font-medium",
            "shadow-lg",
            "flex",
            "items-center",
            "justify-center"
          );
          ghostElement.innerHTML = `<span>${panel.id}</span>`;
          ghostElement.style.width = "100px";
          ghostElement.style.height = "50px";
          document.body.appendChild(ghostElement);
          e.dataTransfer.setDragImage(ghostElement, 50, 25);

          // Cleanup ghost element after drag starts
          setTimeout(() => {
            document.body.removeChild(ghostElement);
          }, 0);
        } catch (err) {
          console.warn("Error creating drag image:", err);
        }

        onDragStart(e, panel);
      }
    };

    return (
      <Link
        to={`/panel/${panel.id}`}
        className={`${bgColor} ${textColor} rounded-lg p-2 flex flex-col items-center justify-center h-full w-full hover:shadow border ${
          !onEdit && !onDelete ? "hover:scale-105" : ""
        } relative overflow-hidden transition-all duration-200 ease-in-out group ${
          isDraggable ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onClick={handleClick}
        draggable={isDraggable}
        onDragStart={handleDragStart}
      >
        {/* Panel Image (if present) */}
        {panel.image && (
          <img
            src={panel.image}
            alt="Detection"
            className="w-10 h-10 object-cover rounded mb-1 border border-amber-400 bg-white"
            style={{ maxWidth: "40px", maxHeight: "40px" }}
          />
        )}
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center w-full rounded py-1">
          <span className="font-medium text-xs truncate w-full text-center">
            {panel.id}
          </span>
          {panel.currentFault.level !== "none" && (
            <span className="text-[10px] mt-0.5 truncate w-full text-center">
              {shortDescription}
            </span>
          )}
        </div>

        {/* Output indicator */}
        <div className="absolute bottom-1 right-1 flex items-center z-10">
          <Sun className="h-2.5 w-2.5" />
          <span className="text-[9px] ml-0.5">{outputPercentage}%</span>
        </div>

        {/* Edit buttons overlay for edit mode */}
        {(onEdit || onDelete) && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 rounded-lg group-hover:opacity-100 group-focus:opacity-100"
            onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking overlay
          >
            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-1 bg-blue-500 text-white rounded-full mx-1 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 z-20"
                title="Edit Panel"
              >
                <Edit className="h-3 w-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1 bg-red-500 text-white rounded-full mx-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 z-20"
                title="Delete Panel"
              >
                <Trash className="h-3 w-3" />
              </button>
            )}
            {isDraggable && (
              <div
                className="p-1 bg-gray-600 text-white rounded-full mx-1 cursor-move"
                title="Drag to move"
              >
                <Move className="h-3 w-3" />
              </div>
            )}
          </div>
        )}
      </Link>
    );
  }
);

// Modal for panel edit/add operations
const PanelEditModal = ({
  panel,
  isOpen,
  onClose,
  onSave,
  isAdding = false,
  existingPositions = [],
}: {
  panel?: Panel;
  isOpen: boolean;
  onClose: () => void;
  onSave: (panel: Panel) => void;
  isAdding?: boolean;
  existingPositions?: { row: number; column: number }[];
}) => {
  const [editedPanel, setEditedPanel] = useState<Partial<Panel>>({});
  const [rowError, setRowError] = useState("");
  const [columnError, setColumnError] = useState("");
  const { gridConfig } = usePanels();

  // Initialize form when panel changes
  useEffect(() => {
    if (panel) {
      setEditedPanel({ ...panel });
    } else if (isAdding) {
      // Generate a new unique ID for the panel
      const panelId = `Panel-${Math.floor(Math.random() * 100000)}`;

      // Create a new panel with required fields from Panel interface
      setEditedPanel({
        id: panelId,
        position: { row: 0, column: 0 },
        companyName: "Solar Corp",
        size: { width: 100, height: 100 },
        maxOutput: 400,
        currentOutput: 350,
        lastInspection: new Date().toISOString(),
        inspectionHistory: [],
        currentFault: {
          level: "none" as FaultLevel,
          description: "No issues detected",
        },
        priority: "low",
        maintenanceSuggestion: "No maintenance needed",
      });
    }
  }, [panel, isAdding]);

  // Position validation
  const validatePosition = () => {
    let isValid = true;

    // Reset errors
    setRowError("");
    setColumnError("");

    // Check row bounds
    if (
      editedPanel.position?.row === undefined ||
      editedPanel.position.row < 0 ||
      editedPanel.position.row >= gridConfig.rows
    ) {
      setRowError(`Row must be between 0 and ${gridConfig.rows - 1}`);
      isValid = false;
    }

    // Check column bounds
    if (
      editedPanel.position?.column === undefined ||
      editedPanel.position.column < 0 ||
      editedPanel.position.column >= gridConfig.columns
    ) {
      setColumnError(`Column must be between 0 and ${gridConfig.columns - 1}`);
      isValid = false;
    }

    // Check if position is already occupied (only for adding or moving to a new position)
    if (
      isAdding ||
      (panel &&
        (panel.position.row !== editedPanel.position?.row ||
          panel.position.column !== editedPanel.position?.column))
    ) {
      const positionExists = existingPositions.some(
        (pos) =>
          pos.row === editedPanel.position?.row &&
          pos.column === editedPanel.position?.column
      );

      if (positionExists) {
        setRowError("This position is already occupied");
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSave = () => {
    if (!validatePosition()) return;

    // Ensure all required fields are set with default values if needed
    const validatedPanel: Panel = {
      // Use existing fields if present, or provide defaults
      id: editedPanel.id || "",
      position: {
        row: editedPanel.position?.row || 0,
        column: editedPanel.position?.column || 0,
      },
      companyName: editedPanel.companyName || "Solar Corp",
      size: editedPanel.size || { width: 100, height: 100 },
      maxOutput: editedPanel.maxOutput || 400,
      currentOutput: editedPanel.currentOutput || 0,
      lastInspection: editedPanel.lastInspection || null,
      inspectionHistory: editedPanel.inspectionHistory || [],
      currentFault: {
        level: (editedPanel.currentFault?.level as FaultLevel) || "none",
        description: editedPanel.currentFault?.description || "",
      },
      priority: (editedPanel.priority as "low" | "medium" | "high") || "low",
      maintenanceSuggestion: editedPanel.maintenanceSuggestion || "",
    };

    onSave(validatedPanel);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 bg-blue-600 text-white">
          <h2 className="text-lg font-semibold">
            {isAdding ? "Add New Panel" : "Edit Panel"}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Panel ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Panel ID
            </label>
            <input
              type="text"
              value={editedPanel.id || ""}
              onChange={(e) =>
                setEditedPanel({ ...editedPanel, id: e.target.value })
              }
              disabled={!isAdding} // Can only change ID when adding a new panel
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Grid Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Row
              </label>
              <input
                type="number"
                min="0"
                max={gridConfig.rows - 1}
                value={editedPanel.position?.row ?? 0}
                onChange={(e) =>
                  setEditedPanel({
                    ...editedPanel,
                    position: {
                      row: parseInt(e.target.value),
                      column: editedPanel.position?.column ?? 0,
                    },
                  })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  rowError ? "border-red-500" : "border-gray-300"
                }`}
              />
              {rowError && (
                <p className="mt-1 text-xs text-red-500">{rowError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Column
              </label>
              <input
                type="number"
                min="0"
                max={gridConfig.columns - 1}
                value={editedPanel.position?.column ?? 0}
                onChange={(e) =>
                  setEditedPanel({
                    ...editedPanel,
                    position: {
                      row: editedPanel.position?.row ?? 0,
                      column: parseInt(e.target.value),
                    },
                  })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  columnError ? "border-red-500" : "border-gray-300"
                }`}
              />
              {columnError && (
                <p className="mt-1 text-xs text-red-500">{columnError}</p>
              )}
            </div>
          </div>

          {/* Current output */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Output (W)
            </label>
            <input
              type="number"
              min="0"
              max={editedPanel.maxOutput || 500}
              value={editedPanel.currentOutput || 0}
              onChange={(e) =>
                setEditedPanel({
                  ...editedPanel,
                  currentOutput: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Fault level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fault Level
            </label>
            <select
              value={editedPanel.currentFault?.level || "none"}
              onChange={(e) =>
                setEditedPanel({
                  ...editedPanel,
                  currentFault: {
                    ...editedPanel.currentFault,
                    level: e.target.value as FaultLevel,
                    description:
                      e.target.value === "none"
                        ? "No issues detected"
                        : editedPanel.currentFault?.description || "",
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Fault description - only show if fault level is not none */}
          {editedPanel.currentFault?.level !== "none" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fault Description
              </label>
              <textarea
                value={editedPanel.currentFault?.description || ""}
                onChange={(e) =>
                  setEditedPanel({
                    ...editedPanel,
                    currentFault: {
                      level:
                        editedPanel.currentFault?.level ||
                        ("none" as FaultLevel),
                      description: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={2}
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {isAdding ? "Add Panel" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Confirmation modal for delete operations
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to perform this action?",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 bg-red-600 text-white">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

const PanelGrid: React.FC = () => {
  const {
    panels,
    loadingPanels,
    filterPanelsByFaultLevel,
    searchPanelsById,
    gridConfig,
    updatePanel,
    setPanels,
  } = usePanels();
  const [displayPanels, setDisplayPanels] = useState<Panel[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filteredPanels, setFilteredPanels] = useState<Panel[]>([]);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const reportBtnRef = useRef<HTMLDivElement>(null);
  const [specificPanelId, setSpecificPanelId] = useState("");
  const [specificPanelError, setSpecificPanelError] = useState("");
  const [suggestedPanels, setSuggestedPanels] = useState<Panel[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [panelToDelete, setPanelToDelete] = useState<Panel | null>(null);
  const [draggedPanel, setDraggedPanel] = useState<Panel | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [successfulDropId, setSuccessfulDropId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smaller page size for better performance
  const PAGE_SIZE = 50;

  // Add refresh interval
  useEffect(() => {
    const refreshData = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/panels");
        if (!response.ok) {
          throw new Error("Failed to fetch panels");
        }
        const data = await response.json();
        setPanels(data);
      } catch (error) {
        console.error("Error refreshing panels:", error);
      }
    };

    // Refresh every 5 seconds
    const interval = setInterval(refreshData, 5000);

    return () => clearInterval(interval);
  }, [setPanels]);

  // Apply filters and search to get filtered panels
  const applyFilters = useCallback(() => {
    let result: Panel[];

    if (activeFilter) {
      result = filterPanelsByFaultLevel(activeFilter);
    } else if (isSearching && searchTerm) {
      result = searchPanelsById(searchTerm);
    } else {
      result = panels;
    }

    setFilteredPanels(result);
    return result;
  }, [
    activeFilter,
    isSearching,
    searchTerm,
    panels,
    filterPanelsByFaultLevel,
    searchPanelsById,
  ]);

  // Load panels for current page - completely replaced instead of appended
  const loadPanels = useCallback(() => {
    setLoading(true);

    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      try {
        // Calculate page boundaries
        const startIndex = (page - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;

        // Get panels for current page only (not cumulative)
        const panelsToDisplay = filteredPanels.slice(startIndex, endIndex);

        setDisplayPanels(panelsToDisplay);
        setHasMore(endIndex < filteredPanels.length);
      } catch (error) {
        console.error("Error loading panels:", error);
      } finally {
        setLoading(false);
      }
    }, 10);
  }, [filteredPanels, page, PAGE_SIZE]);

  // Update filtered panels when filters change or panels are refreshed
  useEffect(() => {
    if (!loadingPanels) {
      applyFilters();
    }
  }, [loadingPanels, panels, applyFilters]);

  // Reset to first page only when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [activeFilter, isSearching, searchTerm]);

  // Load panels when filtered panels or page changes
  useEffect(() => {
    if (filteredPanels.length > 0) {
      loadPanels();
    }
  }, [filteredPanels, page, loadPanels]);

  // Load panels for specific page when "Load More" is clicked
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [loading, hasMore]);

  // Load previous page
  const handlePreviousPage = useCallback(() => {
    if (!loading && page > 1) {
      setPage((prevPage) => prevPage - 1);
    }
  }, [loading, page]);

  // Optimized handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setIsSearching(term.trim() !== "");
  }, []);

  const handleFilterChange = useCallback((filter: string | null) => {
    setActiveFilter(filter);
    setIsSearching(false);
    setSearchTerm("");
  }, []);

  const handleDownloadReport = useCallback(() => {
    generateGridReport(filteredPanels);
    setShowReportOptions(false);
  }, [filteredPanels]);

  // Get panel ID suggestions based on user input
  const getSuggestions = useCallback(
    (input: string) => {
      if (!input.trim()) {
        setSuggestedPanels([]);
        setShowSuggestions(false);
        return;
      }

      const inputLower = input.toLowerCase();
      const suggestions = panels
        .filter((p) => p.id.toLowerCase().includes(inputLower))
        .slice(0, 5); // Limit to 5 suggestions

      setSuggestedPanels(suggestions);
      setShowSuggestions(suggestions.length > 0);
    },
    [panels]
  );

  // Update suggestions when the user types
  useEffect(() => {
    getSuggestions(specificPanelId);
  }, [specificPanelId, getSuggestions]);

  // Handle panel suggestion selection
  const handleSelectSuggestion = (panelId: string) => {
    setSpecificPanelId(panelId);
    setShowSuggestions(false);
  };

  const handleDownloadPanelReport = useCallback(() => {
    if (!specificPanelId.trim()) {
      setSpecificPanelError("Please enter a panel ID");
      return;
    }

    console.log("Searching for panel ID:", specificPanelId);
    console.log("Available panels:", panels.length);
    console.log(
      "First few panel IDs:",
      panels.slice(0, 5).map((p) => p.id)
    );

    // Search in all panels rather than just filtered panels
    // Case-insensitive search to be more user-friendly
    const panel = panels.find(
      (p) =>
        p.id.toLowerCase() === specificPanelId.toLowerCase() ||
        p.id.toString() === specificPanelId
    );

    if (panel) {
      console.log("Panel found:", panel.id);
      generateGridReport([panel]);
      setShowReportOptions(false);
      setSpecificPanelId("");
      setSpecificPanelError("");
    } else {
      console.log("Panel not found");
      setSpecificPanelError("Panel ID not found");
    }
  }, [panels, specificPanelId, generateGridReport]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        reportBtnRef.current &&
        !reportBtnRef.current.contains(event.target as Node)
      ) {
        setShowReportOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate existing panel positions for validation
  const existingPanelPositions = useMemo(() => {
    return panels.map((panel) => ({
      row: panel.position.row,
      column: panel.position.column,
    }));
  }, [panels]);

  // Handle panel edit action
  const handleEditPanel = (panel: Panel) => {
    setSelectedPanel(panel);
    setIsEditModalOpen(true);
  };

  // Handle panel delete action
  const handleDeletePanel = (panel: Panel) => {
    setPanelToDelete(panel);
    setIsDeleteModalOpen(true);
  };

  // Confirm panel deletion
  const confirmDeletePanel = () => {
    if (panelToDelete) {
      const updatedPanels = panels.filter((p) => p.id !== panelToDelete.id);
      setPanels(updatedPanels);

      // Reset filtering to see changes immediately
      if (isSearching) {
        setSearchTerm("");
        setIsSearching(false);
      }
    }
  };

  // Handle adding a new panel
  const handleAddPanel = () => {
    setSelectedPanel(null);
    setIsAddModalOpen(true);
  };

  // Save panel after edit or add
  const handleSavePanel = (editedPanel: Panel) => {
    if (selectedPanel) {
      // Update existing panel
      updatePanel(editedPanel);
    } else {
      // Add new panel
      setPanels([...panels, editedPanel]);
    }

    // Close modals
    setIsEditModalOpen(false);
    setIsAddModalOpen(false);

    // Reset filtering to see changes immediately
    if (isSearching) {
      setSearchTerm("");
      setIsSearching(false);
    }
  };

  // Handle drag start for panel movement
  // const handleDragStart = (e: React.DragEvent, panel: Panel) => {
  //   setDraggedPanel(panel);
  // };

  // Handle drag over to show drop target
  const handleDragOver = (e: React.DragEvent, panelId: string) => {
    e.preventDefault();
    // Set drop effect
    e.dataTransfer.dropEffect = "move";

    if (draggedPanel && draggedPanel.id !== panelId) {
      setDropTargetId(panelId);
    }
  };

  // Handle drop to swap panel positions
  const handleDrop = (e: React.DragEvent, targetPanel: Panel) => {
    e.preventDefault();

    if (draggedPanel && targetPanel && draggedPanel.id !== targetPanel.id) {
      // Create a full copy of panels to ensure proper state update
      const updatedPanels = [...panels];

      // Find the indices of both panels
      const draggedIndex = updatedPanels.findIndex(
        (p) => p.id === draggedPanel.id
      );
      const targetIndex = updatedPanels.findIndex(
        (p) => p.id === targetPanel.id
      );

      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Swap positions
        const draggedPos = { ...updatedPanels[draggedIndex].position };
        const targetPos = { ...updatedPanels[targetIndex].position };

        updatedPanels[draggedIndex] = {
          ...updatedPanels[draggedIndex],
          position: targetPos,
        };

        updatedPanels[targetIndex] = {
          ...updatedPanels[targetIndex],
          position: draggedPos,
        };

        // Update panels state
        setPanels(updatedPanels);

        // Show success feedback
        showDropSuccess(targetPanel.id);
      }
    }

    // Reset drag state
    setDraggedPanel(null);
    setDropTargetId(null);
  };

  // Handle drag end to reset state
  const handleDragEnd = () => {
    setDraggedPanel(null);
    setDropTargetId(null);
  };

  // Add function to show drop success
  const showDropSuccess = (id: string) => {
    setSuccessfulDropId(id);
    setTimeout(() => {
      setSuccessfulDropId(null);
    }, 800);
  };

  // Modified render panel cards to include edit/delete functionality
  const panelCards = useMemo(() => {
    return displayPanels.map((panel) => (
      <div
        key={panel.id}
        className={`h-20 transition-all duration-200 ${
          dropTargetId === panel.id ? "ring-2 ring-blue-500 scale-110 z-10" : ""
        } ${
          successfulDropId === panel.id
            ? "ring-2 ring-green-500 scale-110 z-10"
            : ""
        } ${draggedPanel?.id === panel.id ? "opacity-60" : ""}`}
        onDragOver={(e) => isEditMode && handleDragOver(e, panel.id)}
        onDragEnter={(e) => isEditMode && handleDragOver(e, panel.id)}
        onDragLeave={() => isEditMode && setDropTargetId(null)}
        onDrop={(e) => isEditMode && handleDrop(e, panel)}
        onDragEnd={handleDragEnd}
      >
        <PanelCard
          panel={panel}
          onEdit={isEditMode ? handleEditPanel : undefined}
          onDelete={isEditMode ? handleDeletePanel : undefined}
          isDraggable={isEditMode}
          // onDragStart={handleDragStart}
        />
      </div>
    ));
  }, [displayPanels, isEditMode, dropTargetId, successfulDropId, draggedPanel]);

  // Handle detection JSON upload
  const handleDetectionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const detection = JSON.parse(event.target?.result as string);

        // Log the panel ID from the JSON and available panel IDs
        console.log(
          "Attempting to update panel with ID from JSON:",
          detection.panelId
        );
        console.log(
          "Available panel IDs in current state:",
          panels.map((p) => p.id)
        );

        // Find the panel to update
        const panelToUpdate = panels.find(
          (panel) => panel.id === detection.panelId
        );

        if (panelToUpdate) {
          // Create the updated panel object
          const updatedPanel = {
            ...panelToUpdate,
            currentFault: {
              description: detection.faults,
              level: detection.level || "high",
            },
            image: detection.image, // This should now be a proper data URL
            lastInspection: new Date().toISOString(), // Add inspection timestamp
          };

          // Use the updatePanel function from the context to save changes to local storage
          updatePanel(updatedPanel);
          console.log(
            `Successfully updated panel ${detection.panelId} with detection data.`
          );

          // Backup the inspection data to the backend
          try {
            const response = await fetch(
              "http://localhost:5000/api/panels/backup-inspection",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include", // Ensure cookies are sent for authentication
                body: JSON.stringify({
                  panelId: detection.panelId,
                  inspectionData: {
                    currentFault: updatedPanel.currentFault,
                    image: detection.image,
                    lastInspection: updatedPanel.lastInspection,
                    inspector: detection.inspector || "System",
                    description: detection.faults,
                  },
                }),
              }
            );

            if (!response.ok) {
              throw new Error("Failed to backup inspection data");
            }

            console.log("Inspection data backed up successfully");
          } catch (backupError) {
            console.error("Error backing up inspection data:", backupError);
            // Don't show error to user since this is just a backup
          }
        } else {
          console.warn(
            `Panel with ID ${detection.panelId} not found for detection update.`
          );
          alert(`Panel with ID ${detection.panelId} not found.`);
        }
      } catch (err) {
        console.error("Error processing detection file:", err);
        alert("Invalid detection file.");
      }
    };
    reader.readAsText(file);
  };

  if (loadingPanels) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" text="Loading panels..." />
      </div>
    );
  }

  // Check if we have a grid config
  if (gridConfig.rows === 0 && gridConfig.columns === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="text-center p-8 max-w-md shadow-lg border-2 border-blue-100">
          <GridIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Welcome to Solar Inspection!
          </h2>
          <h3 className="text-xl font-medium text-gray-700 mb-3">
            No Grid Configured
          </h3>
          <p className="text-gray-600 mb-6">
            It looks like this is your first time here. To get started, you'll
            need to set up your solar panel grid in the Grid Builder.
          </p>
          <div className="space-y-4">
            <Link to="/grid-builder">
              <Button
                variant="primary"
                className="w-full py-3 text-lg font-medium"
              >
                Create My Grid Now
              </Button>
            </Link>
            <p className="text-sm text-gray-500">
              Creating a grid allows you to monitor and inspect your solar
              panels efficiently.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate pagination info
  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, filteredPanels.length);
  const totalItems = filteredPanels.length;

  return (
    <div className="space-y-6">
      {/* Import Detection Button */}
      <div className="flex justify-end mb-2">
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleDetectionUpload}
        />
        <Button
          variant="primary"
          onClick={() => fileInputRef.current?.click()}
          className="bg-amber-500 hover:bg-amber-600 border-0"
        >
          Import Detection
        </Button>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GridIcon className="h-6 w-6 text-gray-600" />
          Panel Grid
          <span className="text-sm font-normal text-gray-500">
            ({panels.length.toLocaleString()} panels)
          </span>
        </h1>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by Panel ID..."
            className={`w-full md:w-64 ${
              isEditMode ? "opacity-50 pointer-events-none" : ""
            }`}
          />

          <div className="flex gap-2">
            <Button
              variant={isEditMode ? "danger" : "secondary"}
              icon={
                isEditMode ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Edit className="h-4 w-4" />
                )
              }
              onClick={() => setIsEditMode(!isEditMode)}
              className="whitespace-nowrap"
            >
              {isEditMode ? "Exit Edit Mode" : "Edit Panels"}
            </Button>

            <div className="relative" ref={reportBtnRef}>
              <Button
                variant="secondary"
                icon={<Download className="h-4 w-4" />}
                onClick={() =>
                  !isEditMode && setShowReportOptions(!showReportOptions)
                }
                className={`w-full md:w-auto flex items-center justify-between ${
                  isEditMode ? "opacity-50" : ""
                }`}
              >
                Download Report
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>

              {showReportOptions && (
                <div className="absolute right-0 mt-1 w-64 bg-white shadow-lg rounded-md border border-gray-200 py-1 z-10">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={handleDownloadReport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Complete Grid Report
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="px-4 py-1 text-xs text-gray-500">
                    Specific Panel Report:
                  </div>

                  <div className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="relative w-full">
                        <input
                          type="text"
                          value={specificPanelId}
                          onChange={(e) => {
                            setSpecificPanelId(e.target.value);
                            setSpecificPanelError("");
                          }}
                          onFocus={() => {
                            if (
                              specificPanelId.trim() &&
                              suggestedPanels.length > 0
                            ) {
                              setShowSuggestions(true);
                            }
                          }}
                          placeholder="Enter Panel ID"
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        {/* Panel suggestions dropdown */}
                        {showSuggestions && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-md mt-1 z-20 max-h-32 overflow-y-auto">
                            {suggestedPanels.map((panel) => (
                              <button
                                key={panel.id}
                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center justify-between"
                                onClick={() => handleSelectSuggestion(panel.id)}
                              >
                                <span className="font-medium">{panel.id}</span>
                                <span
                                  className={`ml-2 px-1.5 py-0.5 text-[10px] rounded ${
                                    panel.currentFault.level === "high"
                                      ? "bg-red-100 text-red-800"
                                      : panel.currentFault.level === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : panel.currentFault.level === "low"
                                      ? "bg-yellow-50 text-yellow-700"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {panel.currentFault.level === "none"
                                    ? "OK"
                                    : panel.currentFault.level}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleDownloadPanelReport}
                        className="bg-blue-500 text-white rounded p-1 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                    {specificPanelError && (
                      <p className="text-red-500 text-xs mt-1">
                        {specificPanelError}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => setShowReportOptions(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit mode toolbar - only visible in edit mode */}
      {isEditMode && (
        <Card className="bg-blue-50 border border-blue-200">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-blue-800 font-medium">Panel Edit Mode</h3>
                <p className="text-blue-600 text-sm">
                  Edit, add, delete, or drag panels to rearrange them
                </p>
              </div>

              <Button
                variant="success"
                icon={<Plus className="h-4 w-4" />}
                onClick={handleAddPanel}
              >
                Add Panel
              </Button>
            </div>

            <div className="mt-4 bg-white p-3 rounded-md border border-blue-100">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Edit className="h-4 w-4 text-blue-500" /> Click on a panel to
                edit its properties
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <Trash className="h-4 w-4 text-red-500" /> Click on a panel to
                delete it from the grid
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <Move className="h-4 w-4 text-gray-500" /> Drag panels to swap
                their positions on the grid
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={activeFilter === null ? "primary" : "outline"}
          size="sm"
          onClick={() => handleFilterChange(null)}
          disabled={isEditMode}
        >
          All ({panels.length.toLocaleString()})
        </Button>
        <Button
          variant={activeFilter === "none" ? "primary" : "outline"}
          size="sm"
          className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
          onClick={() => handleFilterChange("none")}
          disabled={isEditMode}
        >
          Uninspected
        </Button>
        <Button
          variant={activeFilter === "low" ? "primary" : "outline"}
          size="sm"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
          onClick={() => handleFilterChange("low")}
          disabled={isEditMode}
        >
          Low Priority
        </Button>
        <Button
          variant={activeFilter === "medium" ? "primary" : "outline"}
          size="sm"
          className="bg-yellow-300 text-yellow-900 hover:bg-yellow-400 border-yellow-500"
          onClick={() => handleFilterChange("medium")}
          disabled={isEditMode}
        >
          Medium Priority
        </Button>
        <Button
          variant={activeFilter === "high" ? "primary" : "outline"}
          size="sm"
          className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300"
          onClick={() => handleFilterChange("high")}
          disabled={isEditMode}
        >
          High Priority
        </Button>
      </div>

      <Card className="h-[600px] overflow-auto">
        {displayPanels.length > 0 ? (
          <div>
            {/* Pagination info */}
            <div className="text-sm text-gray-500 p-4 pb-0 flex justify-between items-center">
              <span>
                Showing {startItem} to {endItem} of {totalItems} panels
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={loading || page === 1}
                  className="py-1 px-2 text-xs"
                >
                  Previous
                </Button>
                <span className="flex items-center">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loading || !hasMore}
                  className="py-1 px-2 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Performance-optimized grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 p-4">
              {panelCards}
            </div>

            {/* Bottom pagination controls */}
            <div className="text-center py-4 flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={loading || page === 1}
              >
                Previous Page
              </Button>

              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading || !hasMore}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Loading...
                  </>
                ) : (
                  "Next Page"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <SearchIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">
              No panels found
            </h3>
            <p className="text-gray-500 mt-1">
              {isSearching
                ? "No panels match your search criteria."
                : "No panels available or matching the selected filter."}
            </p>
          </div>
        )}
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>No Fault</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-300 rounded"></div>
          <span>Low Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Medium Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>High Priority</span>
        </div>
      </div>

      {/* Edit Panel Modal */}
      <PanelEditModal
        panel={selectedPanel || undefined}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSavePanel}
        existingPositions={existingPanelPositions}
      />

      {/* Add Panel Modal */}
      <PanelEditModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSavePanel}
        isAdding={true}
        existingPositions={existingPanelPositions}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeletePanel}
        title="Confirm Panel Deletion"
        message={`Are you sure you want to delete panel ${panelToDelete?.id}? This action cannot be undone.`}
      />
    </div>
  );
};

export default PanelGrid;
