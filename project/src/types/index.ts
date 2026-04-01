export interface User {
  username: string;
  password: string;
  isAdmin: boolean;
}

export type FaultLevel = "none" | "low" | "medium" | "high";

export interface InspectionRecord {
  date: string;
  description: string;
  faultLevel: FaultLevel;
  inspector: string;
}

export interface Panel {
  id: string;
  Model: number;
  installationDate: Date;
  position: { row: number; column: number };
  companyName: string;
  size: { width: number; height: number };
  maxOutput: number;
  currentOutput: number;
  lastInspection: string | null;
  inspectionHistory: InspectionRecord[];
  currentFault: {
    description: string;
    level: FaultLevel;
  };
  priority: "low" | "medium" | "high";
  maintenanceSuggestion: string;
  createdBy?: string;
  image?: string;
}

export interface GridConfig {
  rows: number;
  columns: number;
}
