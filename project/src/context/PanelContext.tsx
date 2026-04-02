import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Panel, GridConfig } from "../types";
import { clearAllStorage } from "../utils/storage";
import {
  generateInitialPanels,
  simulateFaultChanges,
} from "../utils/panelUtils";
import axios from "../axios/axiosInstance";
import { useAuth } from "./AuthContext";

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
  const { isAuthenticated } = useAuth();

  // Load initial data from server first, then local storage as a fallback
  useEffect(() => {
    // Don't hit protected endpoints until user is authenticated
    if (!isAuthenticated) {
      setPanels([]);
      setGridConfig({ rows: 0, columns: 0 });
      setLoadingPanels(false);
      return;
    }

    const loadData = async () => {
      setLoadingPanels(true);
      try {
        // Load panels from main backend (MySQL)
        const response = await axios.get("/api/user/panels", {
          withCredentials: true,
        });
        setPanels(response.data || []);
      } catch (error) {
        console.error("Error fetching panels from backend:", error);
        // If there's any client-side storage from older versions, clear it
        clearAllStorage();
        setPanels([]);
      }

      // Load grid configuration from backend instead of localStorage
      try {
        const configResponse = await axios.get("/api/user/grid", {
          withCredentials: true,
        });
        const serverConfig = configResponse.data as GridConfig;
        setGridConfig({
          rows: serverConfig?.rows || 0,
          columns: serverConfig?.columns || 0,
        });
      } catch (configError) {
        console.error("Error loading grid config from backend:", configError);
        setGridConfig({ rows: 0, columns: 0 });
      }

      setLoadingPanels(false);
    };
    loadData();
  }, [isAuthenticated]);

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
    // Persist grid configuration to main backend (MySQL)
    try {
      await axios.post(
        "/api/user/grid",
        { rows, columns },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error sending grid config to backend:", error);
      // Continue locally so the user can proceed
    }

    const generatedPanels = await generateInitialPanels(newConfig);

    // Send generated panels to backend in bulk so each cell has a DB row
    try {
      await axios.post(
        "/api/user/panels/bulk",
        { panels: generatedPanels },
        { withCredentials: true }
      );

      // After successful initialization, fetch from backend to stay in sync
      const refreshed = await axios.get("/api/user/panels", {
        withCredentials: true,
      });
      setPanels(refreshed.data || []);
    } catch (error) {
      console.error("Error initializing grid panels in backend:", error);
      // Fall back to local-only state if backend fails
      setPanels(generatedPanels);
    }

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
