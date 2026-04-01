import axios from "../axios/axiosInstance";
import { User, Panel, GridConfig } from "../types";

const STORAGE_KEYS = {
  USERS: "solar_panel_users",
  CURRENT_USER: "solar_panel_current_user",
  PANELS: "solar_panel_panels",
  PANELS_PREFIX: "solar_panel_panels_chunk_",
  PANELS_INDEX: "solar_panel_panels_index",
  GRID_CONFIG: "solar_panel_grid_config",
};

// Constants for chunked storage
const CHUNK_SIZE = 100; // Number of panels per chunk

// User management
export const getUsers = (): User[] => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  return users ? JSON.parse(users) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingUserIndex = users.findIndex(
    (u) => u.username === user.username
  );

  if (existingUserIndex >= 0) {
    users[existingUserIndex] = user;
  } else {
    users.push(user);
  }

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getCurrentUser = async () => {
  const me = await axios.get("/api/auth/me", { withCredentials: true });
  return me.data.user;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// Panel management
export const getPanels = async (): Promise<Panel[]> => {
  try {
    const res = await axios.get<Panel[]>("/api/user/panels", {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("getPanels error:", err);
    return [];
  }
};

export const savePanels = (panels: Panel[]): void => {
  try {
    // First, clear existing storage to prevent accumulation
    clearPanelChunks();

    // If panels array is empty, just return
    if (!panels || panels.length === 0) {
      return;
    }

    // Check if we need chunked storage (panels are too large)
    const singleChunkTest = JSON.stringify(panels.slice(0, CHUNK_SIZE));

    // If a single chunk is more than 2MB, reduce the chunk size
    if (singleChunkTest.length > 1000000) {
      throw new Error("Panel data is too large even for chunked storage");
    }

    // Store in chunks
    const chunkCount = Math.ceil(panels.length / CHUNK_SIZE);

    for (let i = 0; i < chunkCount; i++) {
      const start = i * CHUNK_SIZE;
      const end = start + CHUNK_SIZE;
      const chunk = panels.slice(start, end);

      const chunkKey = `${STORAGE_KEYS.PANELS_PREFIX}${i}`;
      localStorage.setItem(chunkKey, JSON.stringify(chunk));
    }

    // Store the index (number of chunks)
    localStorage.setItem(STORAGE_KEYS.PANELS_INDEX, chunkCount.toString());
  } catch (error: any) {
    console.error("Error saving panels:", error);
    // Clear storage on error to prevent corrupted state
    clearPanelChunks();
    throw new Error(`Failed to save panels: ${error.message}`);
  }
};

// Helper to clear all panel chunks
const clearPanelChunks = (): void => {
  // Remove the old non-chunked data
  localStorage.removeItem(STORAGE_KEYS.PANELS);

  // Remove any existing chunks
  const indexData = localStorage.getItem(STORAGE_KEYS.PANELS_INDEX);
  if (indexData) {
    const chunkCount = parseInt(indexData, 10);
    for (let i = 0; i < chunkCount; i++) {
      localStorage.removeItem(`${STORAGE_KEYS.PANELS_PREFIX}${i}`);
    }
  }

  localStorage.removeItem(STORAGE_KEYS.PANELS_INDEX);
};

export const getPanelById = (id: string): Panel | undefined => {
  const panels = getPanels();
  return panels.find((panel) => panel.id === id);
};

export const updatePanel = (updatedPanel: Panel): void => {
  const panels = getPanels();
  const index = panels.findIndex((p) => p.id === updatedPanel.id);

  if (index >= 0) {
    panels[index] = updatedPanel;
    savePanels(panels);
  }
};

// Grid configuration
export const getGridConfig = (): GridConfig => {
  const config = localStorage.getItem(STORAGE_KEYS.GRID_CONFIG);
  return config ? JSON.parse(config) : { rows: 0, columns: 0 };
};

export const saveGridConfig = (config: GridConfig): void => {
  localStorage.setItem(STORAGE_KEYS.GRID_CONFIG, JSON.stringify(config));
};

// Optimized batch operations
export const getPanelsBatch = async (
  startIndex: number,
  count: number
): Promise<Panel[]> => {
  try {
    const res = await axios.get<Panel[]>("/api/user/panels/batch", {
      params: { startIndex, count },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("getPanelsBatch error:", err);
    return [];
  }
};

export const getPanelsByFaultLevel = (level: string): Panel[] => {
  const allPanels = getPanels();
  return allPanels.filter((panel) => panel.currentFault.level === level);
};

export const searchPanelsById = (searchTerm: string): Panel[] => {
  if (!searchTerm) return [];

  const allPanels = getPanels();
  return allPanels.filter((panel) =>
    panel.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// Initialize with sample data if empty
export const initializeIfEmpty = (): void => {
  const users = getUsers();
  if (users.length === 0) {
    // Create admin user
    saveUser({
      username: "admin",
      password: "password",
      isAdmin: true,
    });
  }

  // Don't initialize grid config by default
  // Let the user create it during first login
};

// Add this new function at the top level
export const clearAllStorage = (): void => {
  try {
    // Clear all panel-related storage
    clearPanelChunks();

    // Clear other storage items
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.GRID_CONFIG);

    console.log("All storage cleared successfully");
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
};

export const createPanel = (panel: Panel): void => {
  const panels = getPanels();
  panels.push(panel);
  savePanels(panels);
};

// Helper to clear only panel data (not users or config)
export const clearPanelData = (): void => {
  clearPanelChunks();
  console.log(
    "Panel data cleared. Please refresh the page or recreate the grid."
  );
};
