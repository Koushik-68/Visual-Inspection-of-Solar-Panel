import { Panel, FaultLevel, GridConfig } from '../types';
import { getPanels } from './storage';

const CHUNK_SIZE = 1000; // Number of panels to process at once

const faultLevelColors = {
  none: 'bg-green-500',
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

// Custom color/priority mapping based on fault description
export function getCustomFaultLevelAndColor(description: string): { level: 'high' | 'medium' | 'low', color: string } {
  const desc = description.toLowerCase().replace(/-/g, ' ');
  if (desc.includes('physical damage')) {
    return { level: 'high', color: 'bg-red-500' };
  }
  if (desc.includes('dust') || desc.includes('bird') || desc.includes('drop') || desc.includes('snow')) {
    return { level: 'medium', color: 'bg-yellow-500' };
  }
  if (desc.includes('clean') || desc.includes('no faults') || desc.includes('healthy')) {
    return { level: 'low', color: 'bg-green-500' };
  }
  // Default fallback
  return { level: 'low', color: 'bg-green-500' };
}

// Override getFaultLevelColor to use custom mapping
export const getFaultLevelColor = (level: FaultLevel, description?: string): string => {
  if (description) {
    return getCustomFaultLevelAndColor(description).color;
  }
  return faultLevelColors[level] || faultLevelColors.none;
};

export const getFaultLevelTextColor = (level: FaultLevel): string => {
  return level === 'high' ? 'text-white' : 'text-gray-900';
};

export const getFaultLevelBorderColor = (level: FaultLevel): string => {
  switch (level) {
    case 'high': return 'border-red-700';
    case 'medium': return 'border-yellow-600';
    case 'low': return 'border-green-500';
    default: return 'border-green-500';
  }
};

export const generateEmptyPanel = (id: string, row: number, column: number): Panel => {
  return {
    id,
    position: { row, column },
    companyName: 'Solar Corp',
    size: { width: 1.2, height: 0.8 },
    maxOutput: 350,
    currentOutput: 340,
    lastInspection: null,
    inspectionHistory: [],
    currentFault: {
      description: 'No faults detected',
      level: 'none',
    },
    priority: 'low',
    maintenanceSuggestion: 'Regular cleaning recommended',
  };
};

const processPanelChunk = (
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  columns: number,
  baseIndex: number
): Panel[] => {
  const panels: Panel[] = [];
  let currentIndex = baseIndex;
  
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      if (col >= columns) break;
      const panelId = `Panel ${currentIndex + 1}`;
      panels.push(generateEmptyPanel(panelId, row, col));
      currentIndex++;
    }
  }
  
  return panels;
};

export const generateInitialPanels = async (config: GridConfig): Promise<Panel[]> => {
  const { rows, columns } = config;
  const totalPanels = rows * columns;
  const panels: Panel[] = [];
  let globalIndex = 0;
  
  for (let i = 0; i < totalPanels; i += CHUNK_SIZE) {
    // const startIndex = i;
    const endIndex = Math.min(i + CHUNK_SIZE, totalPanels);
    
    const chunkStartRow = Math.floor(globalIndex / columns);
    const chunkStartCol = globalIndex % columns;
    
    const chunkEndRow = Math.floor((endIndex - 1) / columns);
    const chunkEndCol = (endIndex - 1) % columns;
    
    const chunk = processPanelChunk(chunkStartRow, chunkStartCol, chunkEndRow, chunkEndCol, columns, globalIndex);
    panels.push(...chunk);
    
    globalIndex += chunk.length;
    
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  // Removed random fault assignment. All panels are 'No fault' by default.
  return panels;
};

export const countPanelsByFaultLevel = (): Record<FaultLevel, number> => {
  const panels = getPanels();
  const counts: Record<FaultLevel, number> = {
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
  };
  
  panels.forEach((panel) => {
    counts[panel.currentFault.level]++;
  });
  
  return counts;
};

export const getHighPriorityPanels = (limit: number = 5): Panel[] => {
  const panels = getPanels();
  return panels
    .filter((panel) => panel.currentFault.level === 'high')
    .slice(0, limit);
};

export const getMediumPriorityPanels = (limit: number = 5): Panel[] => {
  const panels = getPanels();
  return panels
    .filter((panel) => panel.currentFault.level === 'medium')
    .slice(0, limit);
};

export const getLowPriorityPanels = (limit: number = 5): Panel[] => {
  const panels = getPanels();
  return panels
    .filter((panel) => panel.currentFault.level === 'low')
    .slice(0, limit);
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const simulateFaultChanges = (panels: Panel[]): Panel[] => {
  const updatedPanels = [...panels];
  const faultLevels: FaultLevel[] = ['none', 'low', 'medium', 'high'];
  const numChanges = Math.floor(Math.random() * 5) + 1;
  
  for (let i = 0; i < numChanges; i++) {
    const randomIndex = Math.floor(Math.random() * panels.length);
    const randomLevel = faultLevels[Math.floor(Math.random() * faultLevels.length)];
    
    if (updatedPanels[randomIndex]) {
      updatedPanels[randomIndex] = {
        ...updatedPanels[randomIndex],
        currentFault: {
          description: randomLevel === 'none' ? 'No faults detected' : 'Simulated fault',
          level: randomLevel,
        },
        priority: randomLevel === 'none' ? 'low' : randomLevel as 'low' | 'medium' | 'high',
      };
    }
  }
  
  return updatedPanels;
};