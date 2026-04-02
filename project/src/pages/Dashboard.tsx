import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  AlertCircle,
  Clock,
  Activity,
  Sun,
  Eye,
  Database,
  Calendar,
  Moon,
} from "lucide-react";
import Card from "../components/common/Card";
import { usePanels } from "../context/PanelContext";
import Button from "../components/common/Button";
import { Link } from "react-router-dom";
import EnhancedVirtualPanelList from "../components/EnhancedVirtualPanelList";
import { ScheduleModal } from "../components/ScheduleForm";
import axiosInstance from "../axios/axiosInstance";

const PANELS_LIMIT = 5; // Limit for each priority section

// Clock Widget Component
const ClockWidget = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  // Format time with leading zeros
  const formatTimeUnit = (unit: number) => unit.toString().padStart(2, "0");

  // Memoize time values to prevent unnecessary recalculations
  const timeValues = useMemo(() => {
    const hours = currentTime.getHours();
    const minutes = formatTimeUnit(currentTime.getMinutes());
    const seconds = formatTimeUnit(currentTime.getSeconds());
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert to 12-hour format

    // Format date
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const day = days[currentTime.getDay()];
    const date = currentTime.getDate();
    const month = months[currentTime.getMonth()];
    const year = currentTime.getFullYear();

    return {
      displayHours,
      minutes,
      seconds,
      ampm,
      day,
      date,
      month,
      year,
      progress: (parseInt(seconds) / 60) * 100,
    };
  }, [currentTime]);

  // Update time every second using requestAnimationFrame for smoother updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    setMounted(true);
    let animationFrameId: number;
    let lastUpdateTime = 0;

    const updateClock = (timestamp: number) => {
      // Only update once per second to reduce unnecessary renders
      if (timestamp - lastUpdateTime >= 1000) {
        setCurrentTime(new Date());
        lastUpdateTime = timestamp;
      }
      animationFrameId = requestAnimationFrame(updateClock);
    };

    animationFrameId = requestAnimationFrame(updateClock);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Apply transition classes only after mounting to prevent animation on initial render
  const transitionClass = mounted ? "transition-all duration-300 ease-out" : "";

  return (
    <Card className="shadow-lg hover:shadow-xl overflow-hidden border-0 relative">
      {/* Solar themed gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 opacity-90"></div>

      <div className="relative flex items-stretch">
        {/* Day/Night indicator sidebar */}
        <div
          className={`w-2 ${
            currentTime.getHours() >= 6 && currentTime.getHours() < 18
              ? "bg-yellow-300"
              : "bg-indigo-900"
          }`}
        ></div>

        <div className="flex-1 flex flex-col md:flex-row items-center p-5 text-white">
          {/* Sun/Moon icon based on time of day */}
          <div className="p-4 bg-amber-600 bg-opacity-30 backdrop-blur-sm rounded-full mr-5 flex-shrink-0">
            {currentTime.getHours() >= 6 && currentTime.getHours() < 18 ? (
              <Sun className="h-12 w-12 text-yellow-100" />
            ) : (
              <Moon className="h-12 w-12 text-indigo-100" />
            )}
          </div>

          <div className="flex-1 mt-3 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between">
              <div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold tracking-tighter">
                    {timeValues.displayHours}
                  </span>
                  <span className="mx-1 text-4xl font-light">:</span>
                  <span className="text-4xl font-bold tracking-tighter">
                    {timeValues.minutes}
                  </span>
                  <span className="text-2xl ml-1 font-light opacity-80 tracking-wider">
                    {timeValues.seconds}
                  </span>
                  <span className="ml-2 text-lg text-white opacity-80">
                    {timeValues.ampm}
                  </span>
                </div>
                <div className="flex items-center mt-1 opacity-90">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {timeValues.day}, {timeValues.month} {timeValues.date},{" "}
                    {timeValues.year}
                  </span>
                </div>
              </div>

              {/* Solar power info tag */}
              <div className="mt-2 md:mt-0 text-xs bg-amber-800 bg-opacity-30 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="mr-1">☀️</span> Solar Energy Tracker
              </div>
            </div>

            {/* Animated progress bars */}
            <div className="mt-3 space-y-1">
              <div className="h-1 bg-amber-800 bg-opacity-30 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-white ${transitionClass}`}
                  style={{ width: `${timeValues.progress}%` }}
                ></div>
              </div>

              {/* Day progress bar */}
              <div className="h-1 bg-amber-800 bg-opacity-30 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-yellow-300 ${transitionClass}`}
                  style={{
                    width: `${
                      ((currentTime.getHours() * 60 +
                        currentTime.getMinutes()) /
                        (24 * 60)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { panels, loadingPanels } = usePanels();
  const [isLoadingPriorityPanels, setIsLoadingPriorityPanels] = useState(false);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);

  const handleCameraToggle = async () => {
    try {
      if (!cameraRunning) {
        await axiosInstance.post("/api/camera/start");
        setCameraRunning(true);
      } else {
        await axiosInstance.post("/api/camera/stop");
        setCameraRunning(false);
      }
    } catch (err) {
      console.error("Error toggling camera:", err);
    }
  };

  // Sync cameraRunning with backend when dashboard mounts
  useEffect(() => {
    const fetchCameraStatus = async () => {
      try {
        const res = await axiosInstance.get("/api/camera/status");
        if (typeof res.data?.running === "boolean") {
          setCameraRunning(res.data.running);
        }
      } catch (err) {
        console.error("Error fetching camera status:", err);
      }
    };

    fetchCameraStatus();
  }, []);

  // Memoize the total panel count to avoid unnecessary recalculations
  const totalPanels = useMemo(() => panels.length, [panels]);

  // Custom panel counts based on new definitions
  const healthyPanels = useMemo(
    () =>
      panels.filter((p) => {
        const desc = p.currentFault?.description?.toLowerCase() || "";
        return desc.includes("clean") || desc.includes("no fault");
      }),
    [panels],
  );

  const faultPanels = useMemo(
    () =>
      panels.filter((p) => {
        const desc = p.currentFault?.description?.toLowerCase() || "";
        return (
          desc.includes("dust") ||
          desc.includes("drop") ||
          desc.includes("snow")
        );
      }),
    [panels],
  );

  const criticalPanels = useMemo(
    () =>
      panels.filter((p) => {
        const desc = p.currentFault?.description?.toLowerCase() || "";
        return desc.includes("physical");
      }),
    [panels],
  );

  // Custom panel lists for the priority widgets
  const highPriorityPanelsCustom = useMemo(
    () =>
      panels.filter((p) => {
        const desc = p.currentFault?.description?.toLowerCase() || "";
        return desc.includes("physical");
      }),
    [panels],
  );

  const mediumPriorityPanelsCustom = useMemo(
    () =>
      panels.filter((p) => {
        const desc = p.currentFault?.description?.toLowerCase() || "";
        return (
          desc.includes("dust") ||
          desc.includes("drop") ||
          desc.includes("snow")
        );
      }),
    [panels],
  );

  const lowPriorityPanelsCustom = useMemo(
    () =>
      panels.filter((p) => {
        const desc = p.currentFault?.description?.toLowerCase() || "";
        return desc.includes("clean") || desc.includes("no fault");
      }),
    [panels],
  );

  // Enhanced load function with performance optimizations
  const loadPriorityPanelsChunked = useCallback(async () => {
    if (loadingPanels || panels.length === 0) return;

    setIsLoadingPriorityPanels(true);

    try {
      // Use intersection observer for better performance - only calculate when visible
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          // Use requestAnimationFrame to avoid blocking the main thread
          requestAnimationFrame(() => {
            // Removed setFaultCounts and setHighPriorityPanels, setMediumPriorityPanels, setLowPriorityPanels
            // Only set loading state to false after chunked loading simulation
            setTimeout(() => {
              setTimeout(() => {
                setIsLoadingPriorityPanels(false);
              }, 0);
            }, 0);
          });
          // Once loaded, disconnect the observer
          observer.disconnect();
        }
      });
      // Start observing the document
      observer.observe(document.documentElement);
      // Cleanup
      return () => observer.disconnect();
    } catch (error) {
      console.error("Error loading priority panels:", error);
      setIsLoadingPriorityPanels(false);
    }
  }, [panels, loadingPanels]);

  // Use debounced effect to prevent multiple rapid renders
  useEffect(() => {
    // Only run this effect if the component is mounted
    let isMounted = true;

    // Add requestIdleCallback for better performance - run when browser is idle
    const idleCallback =
      window.requestIdleCallback || ((cb) => setTimeout(cb, 50));

    const id = idleCallback(() => {
      if (isMounted) {
        loadPriorityPanelsChunked();
      }
    });

    return () => {
      isMounted = false;

      // Cancel idle callback if available
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
    };
  }, [loadPriorityPanelsChunked]);

  // Main dashboard render
  return (
    <div
      className="space-y-8 p-1 overflow-y-auto scroll-smooth"
      style={{
        scrollBehavior: "smooth",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Sun className="h-8 w-8 mr-3 text-amber-400" />
              Solar Panel Inspection Dashboard
            </h1>
            <p className="text-gray-300 mt-1">
              Monitoring {totalPanels} panels across your solar grid
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/panels">
              <Button
                variant="primary"
                className="bg-amber-500 hover:bg-amber-600 border-0"
                icon={<Eye className="h-4 w-4" />}
              >
                View All Panels
              </Button>
            </Link>
            <button
              onClick={() => setShowInspectModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Inspect
            </button>
            <ScheduleModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      </div>

      {/* Clock Widget */}
      <ClockWidget />

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border-0 rounded-xl overflow-hidden">
          <div className="p-1 bg-blue-500"></div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Total Panels
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {totalPanels.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-full bg-blue-100 text-blue-600">
                <Database className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-gray-200 rounded-full">
              <div className="h-1 bg-blue-500 rounded-full w-full"></div>
            </div>
          </div>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border-0 rounded-xl overflow-hidden">
          <div className="p-1 bg-green-500"></div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Healthy Panels
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {healthyPanels.length.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {Math.round(
                    (healthyPanels.length / (totalPanels || 1)) * 100,
                  )}
                  % of total
                </p>
              </div>
              <div className="p-4 rounded-full bg-green-100 text-green-600">
                <Activity className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-gray-200 rounded-full">
              <div
                className="h-1 bg-green-500 rounded-full"
                style={{
                  width: `${Math.round(
                    (healthyPanels.length / (totalPanels || 1)) * 100,
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border-0 rounded-xl overflow-hidden">
          <div className="p-1 bg-yellow-500"></div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Panels With Faults
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {faultPanels.length.toLocaleString()}
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  {Math.round((faultPanels.length / (totalPanels || 1)) * 100)}%
                  of total
                </p>
              </div>
              <div className="p-4 rounded-full bg-yellow-100 text-yellow-600">
                <AlertCircle className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-gray-200 rounded-full">
              <div
                className="h-1 bg-yellow-500 rounded-full"
                style={{
                  width: `${Math.round(
                    (faultPanels.length / (totalPanels || 1)) * 100,
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border-0 rounded-xl overflow-hidden">
          <div className="p-1 bg-red-500"></div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Critical Faults
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {criticalPanels.length.toLocaleString()}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  {Math.round(
                    (criticalPanels.length / (totalPanels || 1)) * 100,
                  )}
                  % of total
                </p>
              </div>
              <div className="p-4 rounded-full bg-red-100 text-red-600">
                <Clock className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-gray-200 rounded-full">
              <div
                className="h-1 bg-red-500 rounded-full"
                style={{
                  width: `${Math.round(
                    (criticalPanels.length / (totalPanels || 1)) * 100,
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Overview */}
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0 rounded-xl overflow-hidden">
        <div className="bg-gray-900 text-white p-5">
          <h2 className="text-xl font-bold">Panel Status Overview</h2>
          <p className="text-gray-300 text-sm">
            Distribution of panel health across your installation
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Healthy Panels</span>
                <span className="text-sm text-gray-500">
                  {healthyPanels.length.toLocaleString()} panels
                </span>
              </div>
              <div className="h-4 w-full bg-gray-100 rounded-full mb-2 overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.round(
                      (healthyPanels.length / (totalPanels || 1)) * 100,
                    )}%`,
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-500 text-right">
                {Math.round((healthyPanels.length / (totalPanels || 1)) * 100)}%
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Panels With Faults</span>
                <span className="text-sm text-gray-500">
                  {faultPanels.length.toLocaleString()} panels
                </span>
              </div>
              <div className="h-4 w-full bg-gray-100 rounded-full mb-2 overflow-hidden">
                <div
                  className="h-full bg-yellow-300 transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.round(
                      (faultPanels.length / (totalPanels || 1)) * 100,
                    )}%`,
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-500 text-right">
                {Math.round((faultPanels.length / (totalPanels || 1)) * 100)}%
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Critical Faults</span>
                <span className="text-sm text-gray-500">
                  {criticalPanels.length.toLocaleString()} panels
                </span>
              </div>
              <div className="h-4 w-full bg-gray-100 rounded-full mb-2 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.round(
                      (criticalPanels.length / (totalPanels || 1)) * 100,
                    )}%`,
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-500 text-right">
                {Math.round((criticalPanels.length / (totalPanels || 1)) * 100)}
                %
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Priority Issues Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High priority panels */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 rounded-xl overflow-hidden">
          <div className="p-1 bg-red-500"></div>
          <div className="p-5 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                High Priority Issues
              </h3>
              {highPriorityPanelsCustom.length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {highPriorityPanelsCustom.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-5">
            <EnhancedVirtualPanelList
              panels={highPriorityPanelsCustom}
              isLoading={isLoadingPriorityPanels}
              faultLevel="high"
              totalCount={highPriorityPanelsCustom.length}
              panelsLimit={PANELS_LIMIT}
            />
          </div>
        </Card>

        {/* Medium priority panels */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 rounded-xl overflow-hidden">
          <div className="p-1 bg-yellow-500"></div>
          <div className="p-5 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                Medium Priority Issues
              </h3>
              {mediumPriorityPanelsCustom.length > 0 && (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {mediumPriorityPanelsCustom.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-5">
            <EnhancedVirtualPanelList
              panels={mediumPriorityPanelsCustom}
              isLoading={isLoadingPriorityPanels}
              faultLevel="medium"
              totalCount={mediumPriorityPanelsCustom.length}
              panelsLimit={PANELS_LIMIT}
            />
          </div>
        </Card>

        {/* Low priority panels */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 rounded-xl overflow-hidden">
          <div className="p-1 bg-yellow-300"></div>
          <div className="p-5 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                Low Priority Issues
              </h3>
              {lowPriorityPanelsCustom.length > 0 && (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {lowPriorityPanelsCustom.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-5">
            <EnhancedVirtualPanelList
              panels={lowPriorityPanelsCustom}
              isLoading={isLoadingPriorityPanels}
              faultLevel="low"
              totalCount={lowPriorityPanelsCustom.length}
              panelsLimit={PANELS_LIMIT}
            />
          </div>
        </Card>
      </div>

      {/* Inspect options modal */}
      {showInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white text-gray-900 rounded-lg p-6 shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Inspect Options</h2>
              <button
                onClick={() => setShowInspectModal(false)}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  handleCameraToggle();
                  setShowInspectModal(false);
                }}
                className={`w-full px-4 py-2 rounded text-white font-medium ${
                  cameraRunning
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {cameraRunning ? "Stop Camera" : "Camera"}
              </button>

              <button
                onClick={() => {
                  setShowInspectModal(false);
                  setShowModal(true);
                }}
                className="w-full px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                📅 Schedule Inspection
              </button>

              <a
                href="http://127.0.0.1:5001/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2 rounded bg-gray-800 hover:bg-gray-900 text-white font-medium"
                onClick={() => setShowInspectModal(false)}
              >
                Import Image & GDrive
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
