import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, AlertCircle, Building, Ruler, Calendar } from 'lucide-react';
import Button from '../components/common/Button';
import { PanelData } from '../components/PanelRegistrationForm';
import { toast } from 'react-toastify';

const STORAGE_KEY = 'solar_panel_registration_data';

const PanelStorage: React.FC = () => {
  const [storedPanels, setStoredPanels] = useState<PanelData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load stored panel data when component mounts
    const loadStoredPanels = () => {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setStoredPanels(parsedData);
        } catch (error) {
          console.error('Error parsing stored panel data:', error);
          toast.error('Failed to load stored panel data');
        }
      }
    };

    loadStoredPanels();
  }, []);

  const savePanelData = (panelData: PanelData) => {
    try {
      const updatedPanels = [...storedPanels, panelData];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPanels));
      setStoredPanels(updatedPanels);
      toast.success('Panel data saved successfully');
    } catch (error) {
      console.error('Error saving panel data:', error);
      toast.error('Failed to save panel data');
    }
  };

  const clearStoredData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setStoredPanels([]);
      toast.success('Stored panel data cleared successfully');
    } catch (error) {
      console.error('Error clearing stored data:', error);
      toast.error('Failed to clear stored data');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 backdrop-blur-sm bg-gray-900 bg-opacity-80 rounded-xl shadow-2xl border border-gray-700">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full">
            <Sun className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Panel Storage</h1>
        <p className="text-gray-300">Manage your stored panel information</p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
          >
            Back
          </Button>
          <Button
            onClick={clearStoredData}
            variant="danger"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Clear All Data
          </Button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Stored Panels</h2>
          {storedPanels.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No panel data stored</p>
          ) : (
            <div className="space-y-4">
              {storedPanels.map((panel, index) => (
                <div
                  key={index}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-300">
                        <Building className="inline-block mr-2 h-4 w-4" />
                        Company: {panel.company}
                      </p>
                      <p className="text-gray-300">
                        <Sun className="inline-block mr-2 h-4 w-4" />
                        Model: {panel.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300">
                        <Ruler className="inline-block mr-2 h-4 w-4" />
                        Dimensions: {panel.dimensions.width}m x {panel.dimensions.height}m
                      </p>
                      <p className="text-gray-300">
                        <Calendar className="inline-block mr-2 h-4 w-4" />
                        Installation: {panel.installationDate}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PanelStorage; 