import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Debug: Log the current directory
console.log('Current directory:', __dirname);

const PANELS_FILE = path.join(__dirname, 'data', 'panels.json');
console.log('Panels file path:', PANELS_FILE);

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir);
}

// Initialize panels file if it doesn't exist
if (!fs.existsSync(PANELS_FILE)) {
  console.log('Creating initial panels file...');
  fs.writeFileSync(PANELS_FILE, JSON.stringify([]));
}

// Helper function to read panels
const readPanels = () => {
  try {
    console.log('Reading panels from:', PANELS_FILE);
    const data = fs.readFileSync(PANELS_FILE, 'utf8');
    const panels = JSON.parse(data);
    console.log('Successfully read panels:', panels.length);
    return panels;
  } catch (error) {
    console.error('Error reading panels:', error);
    return [];
  }
};

// Helper function to write panels
const writePanels = (panels) => {
  try {
    console.log('Writing panels to:', PANELS_FILE);
    fs.writeFileSync(PANELS_FILE, JSON.stringify(panels, null, 2));
    console.log('Successfully wrote panels');
    return true;
  } catch (error) {
    console.error('Error writing panels:', error);
    return false;
  }
};

// Helper to determine level from description
function getLevelFromDescription(description) {
  const desc = (description || '').toLowerCase().replace(/-/g, ' ');
  if (desc.includes('physical damage')) return 'high';
  if (desc.includes('clean') || desc.includes('no faults') || desc.includes('healthy')) return 'low';
  return null; // fallback to provided level
}

// Endpoint to update a single panel (used by detection script)
app.post('/api/update-panel', (req, res) => {
  console.log('Received update single panel request:', req.body.panelId);
  
  try {
    const { panelId, faults, level, image } = req.body;
    
    if (!panelId) {
      console.log('Error: Panel ID is missing in single update request');
      return res.status(400).json({ error: 'Panel ID is required' });
    }

    let currentPanels = readPanels();
    const panelIndex = currentPanels.findIndex(panel => panel.id === panelId);

    // Always determine level from description if possible
    const correctedLevel = getLevelFromDescription(faults) || level || 'none';

    if (panelIndex === -1) {
      // If panel doesn't exist, create a basic entry
      console.log(`Panel ${panelId} not found for update, creating a basic entry.`);
      const newPanel = {
        id: panelId,
        currentFault: { description: faults, level: correctedLevel },
        image: image || null,
        lastInspection: new Date().toISOString(),
        inspectionHistory: [{
          date: new Date().toISOString(),
          description: faults,
          faultLevel: correctedLevel,
          inspector: 'AI Detection System'
        }],
        position: { row: -1, column: -1 },
        companyName: 'Unknown',
        size: { width: 0, height: 0 },
        maxOutput: 0,
        currentOutput: 0,
        priority: 'low',
        maintenanceSuggestion: 'Manual inspection needed to complete details',
      };
      currentPanels.push(newPanel);
      console.log(`Created basic entry for panel ${panelId}. Total panels: ${currentPanels.length}`);
    } else {
      // Update existing panel
      console.log('Updating existing panel:', panelId);
      currentPanels[panelIndex] = {
        ...currentPanels[panelIndex],
        currentFault: {
          description: faults,
          level: correctedLevel
        },
        image: image,
        lastInspection: new Date().toISOString(),
        inspectionHistory: [
          ...(currentPanels[panelIndex].inspectionHistory || []),
          {
            date: new Date().toISOString(),
            description: faults,
            faultLevel: correctedLevel,
            inspector: 'AI Detection System'
          }
        ]
      };
      console.log(`Updated existing panel: ${panelId}. Total panels: ${currentPanels.length}`);
    }

    if (writePanels(currentPanels)) {
      res.json({ success: true, message: `Panel ${panelId} updated successfully` });
    } else {
      res.status(500).json({ error: 'Failed to save panel data after update' });
    }
  } catch (error) {
    console.error('Error processing update-panel request:', error);
    res.status(500).json({ error: 'Failed to update panel', details: error.message });
  }
});

// New endpoint to initialize/replace the entire grid
app.post('/api/initialize-grid', (req, res) => {
  console.log('Received initialize grid request');
  const panels = req.body; // Expecting an array of panels

  if (!Array.isArray(panels)) {
    console.log('Error: Initialize grid request body is not an array');
    return res.status(400).json({ error: 'Request body must be an array of panels' });
  }
  
  console.log(`Initializing grid with ${panels.length} panels`);

  if (writePanels(panels)) {
    console.log(`Successfully initialized grid with ${panels.length} panels`);
    res.json({ success: true, message: `Grid initialized with ${panels.length} panels` });
  } else {
    console.error('Error writing panels during grid initialization');
    res.status(500).json({ error: 'Failed to save grid data' });
  }
});

// Endpoint to get all panels
app.get('/api/panels', (req, res) => {
  console.log('Received get panels request');
  try {
    const panels = readPanels();
    console.log(`Sending ${panels.length} panels`);
    res.json(panels);
  } catch (error) {
    console.error('Error getting panels:', error);
    res.status(500).json({ error: 'Failed to get panels' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Panels file location: ${PANELS_FILE}`);
});
