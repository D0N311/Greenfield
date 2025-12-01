import { Link, useLocation } from "react-router-dom";
import {
  DollarSign,
  Home,
  Heart,
  ArrowLeft,
  Users,
  MapPin,
  UserX,
  Settings,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function Sidebar({ isCollapsed, setIsCollapsed }) {
  const location = useLocation();

  const menuItems = [
    {
      name: "Lot Payments",
      path: "/dashboard/lot-payments",
      icon: Home,
    },
    {
      name: "Lots",
      path: "/dashboard/lots",
      icon: MapPin,
    },
    {
      name: "Contributions",
      path: "/dashboard/contributions",
      icon: Heart,
    },
    {
      name: "Contribution Types",
      path: "/dashboard/contribution-types",
      icon: Settings,
    },
    {
      name: "Penalties",
      path: "/dashboard/penalties",
      icon: AlertTriangle,
    },
    {
      name: "Members",
      path: "/dashboard/members",
      icon: Users,
    },
    {
      name: "Deleted Members",
      path: "/dashboard/deleted-members",
      icon: UserX,
    },
  ];

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen glass-panel border-r border-gray-200/30 z-40 transition-all duration-500 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Toggle Button */}
          <div className="flex items-center justify-between mb-6">
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              <Link
                to="/dashboard"
                className="text-xl font-bold text-green-700 hover:text-green-800 transition-all duration-300 whitespace-nowrap"
              >
                Greenfield
              </Link>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-700 transition-all ml-auto"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          <div
            className={`mb-2 overflow-hidden transition-all duration-500 ease-in-out delay-75 ${
              isCollapsed ? "max-h-0 opacity-0" : "max-h-10 opacity-100"
            }`}
          >
            <p className="text-sm text-gray-600 whitespace-nowrap">
              HOA Management
            </p>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <div key={item.path} className="relative group">
                  <Link
                    to={item.path}
                    className={`flex items-center rounded-lg transition-all duration-300 ease-in-out ${
                      isActive
                        ? "bg-green-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                    } ${
                      isCollapsed
                        ? "justify-center p-3 mx-auto w-11 h-11"
                        : "gap-3 px-3 py-3"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0 transition-transform duration-300 ease-in-out hover:scale-110" />
                    <span
                      className={`font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${
                        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out whitespace-nowrap z-50 shadow-xl scale-95 group-hover:scale-100">
                      {item.name}
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-gray-900"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Back to Home Button */}
          <div className="mt-auto pt-6 border-t border-gray-200/30">
            <div className="relative group">
              <Link
                to="/"
                className={`flex items-center rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-300 ease-in-out ${
                  isCollapsed
                    ? "justify-center p-3 mx-auto w-11 h-11"
                    : "gap-3 px-3 py-3 w-full"
                }`}
              >
                <ArrowLeft className="h-5 w-5 shrink-0 transition-transform duration-300 ease-in-out hover:scale-110" />
                <span
                  className={`font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  Back to Home
                </span>
              </Link>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out whitespace-nowrap z-50 shadow-xl scale-95 group-hover:scale-100">
                  Back to Home
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-gray-900"></div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className={`pt-4 overflow-hidden transition-all duration-500 ease-in-out delay-100 ${
              isCollapsed ? "max-h-0 opacity-0" : "max-h-20 opacity-100"
            }`}
          >
            <p className="text-xs text-gray-500 text-center whitespace-nowrap">
              © 2024 Greenfield HOA
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}

export default Sidebar;
