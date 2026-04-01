import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, AlertCircle, Lock, User} from "lucide-react";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
// import { usePanels } from "../context/PanelContext";
// import Card from "../components/common/Card";
import "../styles/animations.css";
import { toast } from "react-toastify";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [showGridSetup, setShowGridSetup] = useState(false);
  // const [rows, setRows] = useState(10);
  // const [columns, setColumns] = useState(10);

  const { login} = useAuth();
  // const { createGrid, gridConfig } = usePanels();
  const navigate = useNavigate();

  // Check if we need to show grid setup immediately when the component mounts
  // useEffect(() => {
  //   if (isNewUser || (gridConfig.rows === 0 && gridConfig.columns === 0)) {
  //     setShowGridSetup(false);
  //   }
  // }, [isNewUser, gridConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Both fields are required");
      toast.error("Both fields are required");
      return;
    }

    const success = await login(username, password);
    if (success) {
      toast.success("Logged in successfully!");
      navigate("/");
    } else {
      setError("Invalid credentials");
      toast.error("Invalid username or password");
    }
  };

  // const handleGridSetup = async () => {
  //   setIsLoading(true);
  //   try {
  //     await createGrid(rows, columns);

  //     // Clear the new user flag if it was set
  //     if (isNewUser) {
  //       clearNewUserFlag();
  //     }

  //     navigate("/");
  //   } catch (error) {
  //     console.error("Error creating grid:", error);
  //     setError("Failed to create grid. Please try again with fewer panels.");
  //     setIsLoading(false);
  //   }
  // };

  // if (showGridSetup) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
  //       <div className="absolute inset-0 overflow-hidden">
  //         <div className="solar-grid"></div>
  //       </div>
  //       <Card className="w-full max-w-md shadow-2xl border border-gray-700 bg-gray-900 text-white backdrop-blur-sm bg-opacity-80 animate-fadeIn rounded-xl">
  //         <div className="text-center mb-8">
  //           <div className="flex justify-center mb-4">
  //             <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full animate-pulse-slow">
  //               <Sun className="h-14 w-14 text-white" />
  //             </div>
  //           </div>
  //           <h1 className="text-2xl font-bold text-white mb-2 animate-slideInDown">
  //             Welcome to Solar Panel Inspector!
  //           </h1>
  //           <p className="text-gray-300 animate-fadeIn">
  //             Let's create your solar panel grid
  //           </p>
  //         </div>

  //         <div className="space-y-6">
  //           <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 animate-slideInLeft">
  //             <h3 className="font-bold text-amber-400 mb-2">
  //               Why create a grid?
  //             </h3>
  //             <p className="text-gray-300 text-sm">
  //               Your grid configuration determines how many solar panels you'll
  //               monitor. This will generate your initial panel layout for
  //               inspection and analysis.
  //             </p>
  //           </div>

  //           <div className="animate-slideInRight">
  //             <label
  //               htmlFor="rows"
  //               className="block text-sm font-medium text-gray-300 mb-1"
  //             >
  //               Number of Rows
  //             </label>
  //             <div className="relative">
  //               <input
  //                 type="number"
  //                 id="rows"
  //                 min="1"
  //                 max="100"
  //                 value={rows}
  //                 onChange={(e) => setRows(parseInt(e.target.value) || 1)}
  //                 className="w-full px-3 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-white transition-all duration-300"
  //               />
  //               <GridIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
  //             </div>
  //           </div>

  //           <div className="animate-slideInLeft">
  //             <label
  //               htmlFor="columns"
  //               className="block text-sm font-medium text-gray-300 mb-1"
  //             >
  //               Number of Columns
  //             </label>
  //             <div className="relative">
  //               <input
  //                 type="number"
  //                 id="columns"
  //                 min="1"
  //                 max="100"
  //                 value={columns}
  //                 onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
  //                 className="w-full px-3 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-white transition-all duration-300"
  //               />
  //               <GridIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
  //             </div>
  //           </div>

  //           <div className="bg-gray-800 p-4 rounded-md border border-gray-700 animate-fadeIn">
  //             <div className="flex items-center justify-between">
  //               <p className="text-amber-400 font-medium">Total panels:</p>
  //               <p className="text-2xl font-bold text-white">
  //                 {rows * columns}
  //               </p>
  //             </div>
  //             <p className="text-sm text-gray-300 mt-1">
  //               This will create a {rows} × {columns} grid of solar panels to
  //               monitor.
  //             </p>

  //             <div className="w-full h-2 bg-gray-700 rounded-full mt-3 overflow-hidden">
  //               <div
  //                 className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500 ease-out"
  //                 style={{
  //                   width: `${Math.min(((rows * columns) / 200) * 100, 100)}%`,
  //                 }}
  //               ></div>
  //             </div>
  //             <p className="text-right text-xs text-gray-400 mt-1">
  //               {Math.min(Math.round(((rows * columns) / 200) * 100), 100)}% of
  //               recommended maximum
  //             </p>
  //           </div>

  //           <Button
  //             variant="primary"
  //             className="w-full py-3 text-lg font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-0 transition-all duration-300 transform hover:scale-[1.02] animate-pulse-subtle"
  //             onClick={handleGridSetup}
  //             isLoading={isLoading}
  //           >
  //             Create My Grid & Continue
  //           </Button>

  //           <p className="text-center text-xs text-gray-400 animate-fadeIn">
  //             You can modify your grid layout later in the Grid Builder section.
  //           </p>
  //         </div>
  //       </Card>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="solar-panels">
          <div className="cloud"></div>
          <div className="cloud cloud2"></div>
        </div>
      </div>
      <div className="w-full max-w-md p-8 backdrop-blur-sm bg-gray-900 bg-opacity-80 rounded-xl shadow-2xl border border-gray-700 transform transition-all duration-500 animate-fadeIn">
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
            Login to your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-md flex items-start animate-shakeX">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter your username"
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
                placeholder="Enter your password"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-0 transition-all duration-300 transform hover:scale-[1.02] animate-pulse-subtle"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-8 text-center animate-fadeIn">
          <p className="text-gray-300">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors duration-300"
            >
              Register
            </Link>
          </p>

          <div className="mt-4 text-xs text-gray-500 bg-gray-800 p-3 rounded-md inline-block">
            <p>Demo account: admin / password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
