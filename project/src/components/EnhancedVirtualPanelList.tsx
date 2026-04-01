import React, { memo, useCallback } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Panel } from "../types";
import PanelItem from "./PanelItem";
import Spinner from "./common/Spinner";
import { Activity } from "lucide-react";
import { Link } from "react-router-dom";

interface EnhancedVirtualPanelListProps {
  panels: Panel[];
  isLoading: boolean;
  faultLevel: "high" | "medium" | "low";
  totalCount: number;
  panelsLimit: number;
}

/**
 * An enhanced virtualized panel list using react-window for better performance
 * with large datasets. Only renders the items that are visible in the viewport.
 */
const EnhancedVirtualPanelList: React.FC<EnhancedVirtualPanelListProps> = ({
  panels,
  isLoading,
  faultLevel,
  totalCount,
  panelsLimit,
}) => {
  // Empty or loading states
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-green-100 p-3 rounded-full mb-4">
          <Activity className="h-6 w-6 text-green-600" />
        </div>
        <p className="text-gray-600 font-medium">
          No {faultLevel} priority issues detected
        </p>
        <p className="text-gray-500 text-sm mt-1">
          All systems running optimally
        </p>
      </div>
    );
  }

  // Get appropriate color for "View All" link based on fault level
  const getLinkColor = () => {
    switch (faultLevel) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-yellow-500";
      default:
        return "text-blue-600";
    }
  };

  // Calculate row height based on content
  const getRowHeight = () => {
    // Reasonable default height for a panel item
    return 120;
  };

  // Memoized row renderer function for better performance
  const rowRenderer = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      if (index < panels.length) {
        return (
          <div style={style} className="px-1 py-1">
            <PanelItem panel={panels[index]} />
          </div>
        );
      }
      return null;
    },
    [panels, faultLevel]
  );

  return (
    <div className="space-y-3">
      <div style={{ height: Math.min(panels.length * getRowHeight(), 500) }}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              itemCount={panels.length}
              itemSize={getRowHeight()}
              width={width}
              overscanCount={1}
              className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              {rowRenderer}
            </List>
          )}
        </AutoSizer>
      </div>

      {totalCount > panelsLimit && (
        <Link
          to={`/panels?faultLevel=${faultLevel}`}
          className="block text-center py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className={`text-sm font-medium ${getLinkColor()}`}>
            View all {totalCount} {faultLevel} priority issues
          </span>
        </Link>
      )}
    </div>
  );
};

export default memo(EnhancedVirtualPanelList);
