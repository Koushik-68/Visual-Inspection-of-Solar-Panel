import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sun,
  AlertCircle,
  User,
  Lock,
  UserPlus,
  Grid as GridIcon,
  Save,
} from "lucide-react";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import PanelRegistrationForm, {
  PanelData,
} from "../components/PanelRegistrationForm";
import { usePanels } from "../context/PanelContext";
import { Panel } from "../types";
import "../styles/animations.css";
import { toast } from "react-toastify";
import axios from "../axios/axiosInstance";

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<
    "user" | "grid" | "panel"
  >("user");
  const [rows, setRows] = useState(10);
  const [columns, setColumns] = useState(10);
  const [showWarning, setShowWarning] = useState(false);

  const { register } = useAuth();
  const { panels, setPanels, createGrid } = usePanels();
  const navigate = useNavigate();

  // Stepper UI
  const stepIndex =
    registrationStep === "user" ? 0 : registrationStep === "grid" ? 1 : 2;
  const steps = [
    { label: "Account", icon: <User className="h-5 w-5" /> },
    { label: "Grid Setup", icon: <GridIcon className="h-5 w-5" /> },
    { label: "Panel Details", icon: <Sun className="h-5 w-5" /> },
  ];

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Both fields are required");
      return;
    }

    const success = await register(username, password);
    // console.log(success);
    if (success) {
      toast.success("Registration successful!");
      setRegistrationStep("grid");
    } else {
      toast.error("Username already taken");
    }
  };

  const handleGridSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const totalPanels = rows * columns;
    if (totalPanels > 100000) {
      setShowWarning(true);
      setIsLoading(false);
      return;
    }
    setShowWarning(false);
    await createGrid(rows, columns);
    setIsLoading(false);
    setRegistrationStep("panel");
  };

  const handlePanelSubmit = async (panelData: PanelData) => {
    setIsLoading(true);
    try {
      // Apply the same panel details to every generated panel in the grid
      const updatedPanels: Panel[] = panels.map((panel) => ({
        ...panel,
        companyName: panelData.company,
        size: {
          width: panelData.dimensions.width,
          height: panelData.dimensions.height,
        },
        Model: Number(panelData.model) || panel.Model || 0,
        installationDate: panelData.installationDate,
        maxOutput:
          typeof panelData.maxOutput === "number" && panelData.maxOutput > 0
            ? panelData.maxOutput
            : panel.maxOutput,
        currentOutput:
          typeof panelData.maxOutput === "number" && panelData.maxOutput > 0
            ? panelData.maxOutput
            : panel.currentOutput,
        createdBy: username,
      }));

      // Update local state so the UI reflects these details immediately
      setPanels(updatedPanels);

      // Persist updated panels for every grid cell to the main backend (MySQL)
      try {
        await axios.post(
          "/api/user/panels/bulk",
          { panels: updatedPanels },
          { withCredentials: true }
        );
      } catch (saveError) {
        console.error("Error saving panel details to backend:", saveError);
        toast.error(
          "Panel details were applied locally, but saving to the database failed."
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to save panel data. Please try again.");
      setIsLoading(false);
    }
  };

  // Stepper UI
  const renderStepper = () => (
    <div className="flex items-center justify-center mb-8 gap-4">
      {steps.map((s, idx) => (
        <div key={s.label} className="flex flex-col items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
            ${
              stepIndex === idx
                ? "bg-amber-500 border-amber-400 shadow-lg"
                : "bg-gray-800 border-gray-600"
            }
            ${stepIndex > idx ? "bg-green-500 border-green-400" : ""}
          `}
          >
            {stepIndex > idx ? <Save className="h-6 w-6 text-white" /> : s.icon}
          </div>
          <span
            className={`mt-2 text-xs font-semibold ${
              stepIndex === idx ? "text-amber-300" : "text-gray-400"
            }`}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );

  // Step 1: User Info
  if (registrationStep === "user") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="solar-panels"></div>
        </div>
        <div className="w-full max-w-md p-8 backdrop-blur-sm bg-gray-900 bg-opacity-80 rounded-xl shadow-2xl border border-gray-700 transform transition-all duration-500 animate-fadeIn">
          {renderStepper()}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full animate-float">
                <Sun className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white animate-slideInDown">
              Solar Panel Inspector
            </h1>
            <p className="text-gray-300 mt-2 animate-fadeIn">
              Create a new account
            </p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-md flex items-start animate-shakeX">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}
          <form onSubmit={handleUserSubmit} className="space-y-6">
            <div className="animate-slideInLeft">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-white transition-all duration-300"
                  placeholder="Choose a username"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="animate-slideInRight">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-white transition-all duration-300"
                  placeholder="Create a password"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="animate-slideInLeft">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-white transition-all duration-300"
                  placeholder="Confirm your password"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-0 transition-all duration-300 transform hover:scale-[1.02] animate-pulse-subtle"
              isLoading={isLoading}
              icon={<UserPlus className="h-4 w-4 mr-2" />}
            >
              Next: Grid Setup
            </Button>
          </form>
          <div className="mt-8 text-center animate-fadeIn">
            <p className="text-gray-300">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors duration-300"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Grid Setup
  if (registrationStep === "grid") {
    const totalPanels = rows * columns;
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="solar-panels"></div>
        </div>
        <div className="w-full max-w-lg p-8 backdrop-blur-sm bg-gray-900 bg-opacity-80 rounded-xl shadow-2xl border border-gray-700 transform transition-all duration-500 animate-fadeIn">
          {renderStepper()}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full animate-float">
                <GridIcon className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white animate-slideInDown">
              Grid Setup
            </h1>
            <p className="text-gray-300 mt-2 animate-fadeIn">
              Configure your solar panel grid
            </p>
          </div>
          {showWarning && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start mb-4">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Warning</h3>
                <p className="text-sm text-yellow-700">
                  Creating a grid with more than 100,000 panels may impact
                  browser performance. Consider reducing the size or splitting
                  into multiple grids.
                </p>
              </div>
            </div>
          )}
          <form onSubmit={handleGridSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="rows"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Number of Rows
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="rows"
                    min="1"
                    max="1000"
                    value={rows}
                    onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                    className="block w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-800 text-white transition-colors"
                    placeholder="Enter number of rows"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-400 sm:text-sm">rows</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  Maximum 1000 rows supported
                </p>
              </div>
              <div>
                <label
                  htmlFor="columns"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Number of Columns
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="columns"
                    min="1"
                    max="1000"
                    value={columns}
                    onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                    className="block w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-800 text-white transition-colors"
                    placeholder="Enter number of columns"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-400 sm:text-sm">columns</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  Maximum 1000 columns supported
                </p>
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mt-4">
              <h3 className="text-lg font-medium text-gray-200 mb-4">
                Grid Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-800">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-400">Rows</p>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-200 rounded-full">
                      {rows}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(rows / 1000) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-800">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-400">Columns</p>
                    <span className="px-2 py-1 text-xs font-medium bg-purple-900 text-purple-200 rounded-full">
                      {columns}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${(columns / 1000) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-800">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-400">
                      Total Panels
                    </p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        totalPanels > 50000
                          ? "bg-red-900 text-red-200"
                          : totalPanels > 25000
                          ? "bg-yellow-900 text-yellow-200"
                          : "bg-green-900 text-green-200"
                      }`}
                    >
                      {totalPanels.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        totalPanels > 50000
                          ? "bg-red-500"
                          : totalPanels > 25000
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${(totalPanels / 100000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRegistrationStep("user")}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-300"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-md transition-all duration-300 ml-auto"
                isLoading={isLoading}
                icon={<Save className="h-4 w-4 mr-2" />}
              >
                Next: Panel Details
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Panel Details
  if (registrationStep === "panel") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="solar-panels"></div>
        </div>
        <div className="w-full max-w-2xl mx-auto">
          {renderStepper()}
          <PanelRegistrationForm
            onSubmit={handlePanelSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default RegisterPage;
