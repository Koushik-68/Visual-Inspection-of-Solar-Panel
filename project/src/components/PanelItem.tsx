import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../types';
import { formatDate, getCustomFaultLevelAndColor } from '../utils/panelUtils';

interface PanelItemProps {
  panel: Panel;
}

const PanelItem: React.FC<PanelItemProps> = ({ panel }) => {
  // Use custom mapping based on description
  const { level, color } = getCustomFaultLevelAndColor(panel.currentFault.description);
  const badgeText =
    level === 'high' ? 'High Priority' :
    level === 'medium' ? 'Medium Priority' :
    level === 'low' ? 'Low Priority' : 'Healthy';

  return (
    <Link to={`/panel/${panel.id}`}>
      <div className={`p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm hover:shadow`}>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">{panel.id}</span>
          <span className="text-xs text-gray-500">{formatDate(panel.lastInspection)}</span>
        </div>
        <p className="text-sm text-gray-700 mt-2">{panel.currentFault.description}</p>
        <div className="mt-2 flex justify-end">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} text-white`}>
            {badgeText}
          </span>
        </div>
      </div>
    </Link>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(PanelItem); 