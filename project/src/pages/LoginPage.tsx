import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sun,
  AlertCircle,
  Lock,
  User,
  ScanEye,
  Activity,
  // ShieldCheck,
  // Cpu,
  ArrowRight,
} from "lucide-react";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!username || !password) {
      setError("Authorization Required");
      toast.error("Please enter terminal credentials");
      setIsLoading(false);
      return;
    }

    const success = await login(username, password);
    if (success) {
      toast.success("System Authenticated. Welcome, Inspector.");
      navigate("/");
    } else {
      setError("Fault: Invalid Access Credentials");
      toast.error("Access Denied");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* --- BACKGROUND ARCHITECTURE --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated Scanning HUD Line */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-[15%] w-full animate-scan z-10" />

        {/* Solar Panel Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
            backgroundSize: "60px 40px",
          }}
        />

        {/* Deep Field Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-900/10 rounded-full blur-[120px]" />
      </div>

      {/* --- INSPECTION TERMINAL CARD --- */}
      <div className="relative z-20 w-full max-w-[420px] animate-fadeIn">
        {/* Terminal Header Decor */}

        {/* Main Matte Container */}
        <div className="bg-[#0c0e14] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden">
          {/* Visual Identity Section */}
          <div className="bg-gradient-to-br from-[#161a24] to-transparent p-8 border-b border-white/5 relative">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="p-4 bg-[#1a1d26] border border-cyan-500/30 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-transform group-hover:scale-105">
                  <ScanEye className="h-8 w-8 text-cyan-400" />
                </div>
                {/* HUD Spinning Ring */}
                <div className="absolute -inset-2 border border-dashed border-cyan-500/20 rounded-2xl animate-spin-slow pointer-events-none" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
                  Solar
                  <span className="text-cyan-500 not-italic font-light">
                    Inspector
                  </span>
                </h1>
                <p className="text-[10px] text-cyan-500/60 font-mono mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                  <Activity className="h-5 w-5 animate-pulse" /> Visual
                  Inspection of Solar Farm
                </p>
              </div>
            </div>

            {/* Corner Accent */}
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Sun className="h-12 w-12 text-amber-500" />
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-6">
            {error && (
              <div className="p-3 bg-red-500/5 border border-red-500/30 rounded-lg flex items-center gap-3 animate-shakeX">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-200 text-[11px] font-mono tracking-tight">
                  {error}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-2 tracking-widest">
                  <User className="h-3 w-3 text-cyan-500/70" /> Inspector ID
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#12151c] border border-white/5 rounded-xl text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono text-sm placeholder:text-gray-700"
                    placeholder="Enter ID..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-2 tracking-widest">
                  <Lock className="h-3 w-3 text-cyan-500/70" /> Password
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#12151c] border border-white/5 rounded-xl text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono text-sm placeholder:text-gray-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-4 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden border-0"
                isLoading={isLoading}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Login{" "}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                {/* Button Gloss Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
            </form>

            {/* Support Links */}
            <div className="flex flex-col items-center gap-4 pt-2">
              <p className="text-[11px] text-gray-500 uppercase tracking-tighter">
                No Terminal Access?{" "}
                <Link
                  to="/register"
                  className="text-cyan-500 hover:text-cyan-400 font-black transition-colors ml-1 underline decoration-cyan-500/30 underline-offset-4"
                >
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Visual Footer Metrics */}
        <div className="mt-6 flex justify-around items-center px-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
          <div className="h-6 w-[1px] bg-gray-800" />
          <div className="text-center"></div>
        </div>
      </div>

      {/* --- CUSTOM ANIMATIONS --- */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(800%); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-scan { animation: scan 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
        .animate-shakeX { animation: shakeX 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};

export default LoginPage;
