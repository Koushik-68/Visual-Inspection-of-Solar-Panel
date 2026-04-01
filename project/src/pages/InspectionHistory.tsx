import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { usePanels } from '../context/PanelContext';
import { formatDate } from '../utils/panelUtils';
import Spinner from '../components/common/Spinner';

const InspectionHistory: React.FC = () => {
  const { panels, loadingPanels } = usePanels();
  const [allInspections, setAllInspections] = useState<any[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingPanels && panels.length > 0) {
      // Gather all inspections from all panels
      const inspections = panels.flatMap(panel => 
        panel.inspectionHistory.map(inspection => ({
          ...inspection,
          panelId: panel.id,
          panelPosition: panel.position
        }))
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setAllInspections(inspections);
      setFilteredInspections(inspections);
    }
  }, [panels, loadingPanels]);

  const handleFilterChange = (level: string | null) => {
    setActiveFilter(level);
    
    if (level === null) {
      setFilteredInspections(allInspections);
    } else {
      setFilteredInspections(allInspections.filter(inspection => inspection.faultLevel === level));
    }
  };

  const getFaultLevelClass = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  if (loadingPanels) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" text="Loading inspection history..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inspection History</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={activeFilter === null ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange(null)}
        >
          All ({allInspections.length})
        </Button>
        <Button
          variant={activeFilter === 'none' ? 'primary' : 'outline'}
          size="sm"
          className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
          onClick={() => handleFilterChange('none')}
        >
          No Faults
        </Button>
        <Button
          variant={activeFilter === 'low' ? 'primary' : 'outline'}
          size="sm"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
          onClick={() => handleFilterChange('low')}
        >
          Low
        </Button>
        <Button
          variant={activeFilter === 'medium' ? 'primary' : 'outline'}
          size="sm"
          className="bg-yellow-300 text-yellow-900 hover:bg-yellow-400 border-yellow-500"
          onClick={() => handleFilterChange('medium')}
        >
          Medium
        </Button>
        <Button
          variant={activeFilter === 'high' ? 'primary' : 'outline'}
          size="sm"
          className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300"
          onClick={() => handleFilterChange('high')}
        >
          High
        </Button>
      </div>

      <Card>
        {filteredInspections.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredInspections.map((inspection, index) => (
              <div key={index} className="py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <div className="flex items-center mb-2 md:mb-0">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <Link to={`/panel/${inspection.panelId}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {inspection.panelId}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      (Row {inspection.panelPosition.row}, Col {inspection.panelPosition.column})
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">{formatDate(inspection.date)}</span>
                    <span 
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getFaultLevelClass(inspection.faultLevel)}`}
                    >
                      {inspection.faultLevel}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700">{inspection.description}</p>
                <p className="text-sm text-gray-500 mt-1">Inspector: {inspection.inspector}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No inspections found</h3>
            <p className="text-gray-500 mt-1">
              {activeFilter 
                ? `No inspections with ${activeFilter} priority found.` 
                : "No inspection history available."}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InspectionHistory;