import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Panel, GridConfig } from "../types";
import {
  getPanels,
  savePanels,
  getGridConfig,
  saveGridConfig,
  clearAllStorage,
} from "../utils/storage";
import {
  generateInitialPanels,
  simulateFaultChanges,
} from "../utils/panelUtils";

interface PanelContextType {
  panels: Panel[];
  gridConfig: GridConfig;
  loadingPanels: boolean;
  setPanels: (panels: Panel[]) => void;
  updatePanel: (panel: Panel) => void;
  resetPanels: () => void;
  createGrid: (rows: number, columns: number) => void;
  getPanelById: (id: string) => Panel | undefined;
  getPanelBatch: (start: number, count: number) => Panel[];
  filterPanelsByFaultLevel: (level: string | null) => Panel[];
  searchPanelsById: (term: string) => Panel[];
  startSimulation: () => void;
  stopSimulation: () => void;
  isSimulating: boolean;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export const PanelProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    rows: 0,
    columns: 0,
  });
  const [loadingPanels, setLoadingPanels] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationInterval = useRef<number>();

  // Load initial data from server first, then local storage as a fallback
  useEffect(() => {
    const loadData = async () => {
      setLoadingPanels(true);
      try {
        const response = await fetch("http://localhost:3000/api/panels");
        if (!response.ok) {
          throw new Error("Failed to fetch panels from server");
        }
        const serverPanels = await response.json();
        setPanels(serverPanels);
      } catch (error) {
        console.error("Error fetching panels from server:", error);
        try {
          // Fallback to local storage only if server fetch fails and local data exists
          const storedPanels = getPanels();
          if (storedPanels && storedPanels.length > 0) {
            console.log("Falling back to local storage panels.");
            setPanels(storedPanels);
          } else {
            console.log("No panels found in local storage either.");
            setPanels([]); // Ensure panels state is empty if no data is found
          }
        } catch (storageError) {
          console.error("Error accessing local storage:", storageError);
          // If there's a storage error, clear everything and start fresh
          clearAllStorage();
          setPanels([]);
        }
      }

      try {
        const storedConfig = getGridConfig();
        setGridConfig(storedConfig);
      } catch (configError) {
        console.error("Error loading grid config:", configError);
        setGridConfig({ rows: 0, columns: 0 });
      }

      setLoadingPanels(false);
    };
    loadData();
  }, []);

  const updatePanel = useCallback((updatedPanel: Panel) => {
    setPanels((prevPanels) => {
      const newPanels = prevPanels.map((panel) =>
        panel.id === updatedPanel.id ? updatedPanel : panel
      );
      // Removed: savePanels(newPanels); // Stop saving large panel data to local storage on update
      return newPanels;
    });
    // Although local state is updated immediately for responsiveness,
    // the periodic fetch in PanelGrid ensures sync with the server.
    // A dedicated server update call could be added here if needed for immediate server sync.
  }, []);

  const resetPanels = useCallback(async () => {
    setLoadingPanels(true);
    const generatedPanels = await generateInitialPanels(gridConfig);
    setPanels(generatedPanels);
    // Removed: savePanels(generatedPanels); // Stop saving large panel data to local storage on reset
    // The createGrid function now handles sending the initial panels to the server.
    setLoadingPanels(false);
  }, [gridConfig]);

  const createGrid = useCallback(async (rows: number, columns: number) => {
    setLoadingPanels(true);
    const newConfig = { rows, columns };
    setGridConfig(newConfig);
    saveGridConfig(newConfig); // Continue saving grid config

    const generatedPanels = await generateInitialPanels(newConfig);

    // Send all generated panels to the new initialization endpoint
    try {
      const response = await fetch(
        "http://localhost:3000/api/initialize-grid",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(generatedPanels), // Send the entire array
        }
      );

      if (!response.ok) {
        const errorDetails = await response.text(); // Get text for more info
        throw new Error(
          `Failed to initialize grid on server: ${response.status} - ${errorDetails}`
        );
      }

      const result = await response.json();
      console.log("Server response to initialize-grid:", result);

      // After successful initialization, fetch the panels from the server
      // to ensure the frontend state is in sync
      await fetch("http://localhost:3000/api/panels")
        .then((res) => res.json())
        .then((serverPanels) => {
          setPanels(serverPanels);
          // Removed: savePanels(serverPanels); // Stop saving large panel data to local storage after initialization
        })
        .catch((error) =>
          console.error("Error fetching panels after initialization:", error)
        );
    } catch (error) {
      console.error("Error sending initial grid to server:", error);
      // Optionally, handle this error by showing a message to the user
    }

    // We still set panels locally immediately for a snappier UI,
    // but the fetch after initialization ensures sync with server.
    setPanels(generatedPanels);
    // Removed: savePanels(generatedPanels); // Stop saving large panel data to local storage after generation
    setLoadingPanels(false);
  }, []);

  const getPanelById = useCallback(
    (id: string) => {
      return panels.find((panel) => panel.id === id);
    },
    [panels]
  );

  const getPanelBatch = useCallback(
    (start: number, count: number) => {
      return panels.slice(start, start + count);
    },
    [panels]
  );

  const filterPanelsByFaultLevel = useCallback(
    (level: string | null) => {
      if (!level) return panels;
      return panels.filter((panel) => panel.currentFault.level === level);
    },
    [panels]
  );

  const searchPanelsById = useCallback(
    (term: string) => {
      if (!term.trim()) return [];
      const lowerTerm = term.toLowerCase();
      return panels.filter((panel) =>
        panel.id.toLowerCase().includes(lowerTerm)
      );
    },
    [panels]
  );

  const startSimulation = useCallback(() => {
    if (!isSimulating) {
      setIsSimulating(true);
      simulationInterval.current = window.setInterval(() => {
        setPanels((prevPanels) => {
          const updatedPanels = simulateFaultChanges(prevPanels);
          // Removed: savePanels(updatedPanels); // Stop saving large panel data to local storage during simulation
          return updatedPanels;
        });
      }, 5000); // Update every 5 seconds
    }
  }, [isSimulating]);

  const stopSimulation = useCallback(() => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      setIsSimulating(false);
    }
  }, []);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, []);

  return (
    <PanelContext.Provider
      value={{
        panels,
        gridConfig,
        loadingPanels,
        setPanels,
        updatePanel,
        resetPanels,
        createGrid,
        getPanelById,
        getPanelBatch,
        filterPanelsByFaultLevel,
        searchPanelsById,
        startSimulation,
        stopSimulation,
        isSimulating,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
};

export const usePanels = (): PanelContextType => {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error("usePanels must be used within a PanelProvider");
  }
  return context;
};
