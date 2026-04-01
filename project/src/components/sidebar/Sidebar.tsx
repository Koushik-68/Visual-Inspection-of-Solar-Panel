import { NavLink } from "react-router-dom";

{
  /* Add AI Assistance link after Inspection History */
}
<NavLink
  to="/ai-assistance"
  className={({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-emerald-100 hover:text-emerald-700 font-medium ${
      isActive ? "bg-emerald-200 text-emerald-800" : "text-gray-700"
    }`
  }
>
  <span role="img" aria-label="AI">🤖</span>
  AI Assistance
</NavLink> 